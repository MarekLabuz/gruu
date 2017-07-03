// let rootLocation = null
// const pathDependentComponents = {}
const doesntExist = v => v === null || v === undefined || v === false
// const matchesPathname = path => new RegExp(`${path.replace(/:[^/]+/g, '[^/]+')}`).test(window.location.pathname)
// const getParams = (path) => {
//   if (!path) {
//     return {}
//   }
//   const paramRegex = new RegExp(':.+')
//   const windowPathname = window.location.pathname.split('/').slice(1)
//   return path.split('/').slice(1).reduce((acc, curr, i) =>
//     Object.assign({}, acc, paramRegex.test(curr) ? { [curr.replace(':', '')]: windowPathname[i] } : {}), {})
// }

function domModificator ({ parent: p, component: c, key: k, value: v, anyway }) {
  const value = !v ? v : v.noProxy || v
  const parent = !p ? p : p.noProxy || p
  const component = !c ? c : c.noProxy || c
  const key = !k ? k : k.noProxy || k

  if ((typeof key === 'string' && key.startsWith('_')) ||
    (doesntExist(value) && doesntExist(component[key])) ||
    key === 'node') {
    return 0
  }

  if (doesntExist(value)) {
    if (component[key] && component[key].node) {
      const comp = component[key].noProxy || component[key]
      comp.node.remove()
    }
    component[key] = undefined
    return 0
  }

  if (doesntExist(component[key]) && value._type && parent && parent.node) {
    const newComponent = createComponent(value).noProxy

    if (key >= component.length) {
      recursivelyRenderComponents({ root: parent.node, children: [newComponent] })
    } else if (key < component.length) {
      let lastNode = key + 1
      for (let i = key; i < component.length; i += 1) {
        if (component[key]) {
          lastNode = key
          break
        }
      }
      recursivelyRenderComponents({ root: newComponent.node, children: newComponent.children })
      parent.node.insertBefore(newComponent.node, component[lastNode] && component[lastNode].node)
    }

    component[key] = newComponent
    return 0
  }

  // value.every(val => val && val._type)
  if (component[key] && Array.isArray(value) && key === 'children') {
    const lengthDiff = component[key].length - value.length
    const values = value.concat(Array(lengthDiff < 0 ? 0 : lengthDiff).fill(null))
    for (let i = 0; i < values.length; i += 1) {
      domModificator({ parent: component, component: component[key], key: i, value: values[i] })
    }
    return 0
  }

  if (value._type && parent && parent.node) {
    Object.keys(value).forEach((valueKey) => {
      domModificator({ parent: component, component: component[key], key: valueKey, value: value[valueKey] })
    })
    return 0
  }

  if (anyway || (component[key] !== value && typeof value !== 'function')) {
    switch (key) {
      case 'style':
        Object.keys(value).forEach((param) => {
          component.node.style[param] = value[param]
        })
        break
      case 'children':
        value.forEach((val, i) => {
          domModificator({ parent: component, component: component[key], key: i, value: val })
        })
        break
      case 'content':
        if (component.node) {
          component.node.textContent = value
        }
        break
      default:
        if (component.node) {
          component.node[key] = value
        }
    }
    component[key] = value
  }
  return 0
}

const handler = (object, head, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler(object, head, ...k, key))
    }
    return target[key]
  },
  set (target, key, value) {
    domModificator({ component: target, key, value })

    if (object.rerender) {
      clearTimeout(object.rerender)
    }

    object.rerender = setTimeout(() => {
      // console.log(target[key])
      // return
      Object.keys(object).forEach((param) => {
        if (param.startsWith('__')) {
          const newParam = param.replace('__', '')
          domModificator({
            component: object,
            key: newParam,
            value: object[param]()
          })
        }
      })
      Object.keys(object.registered || {}).forEach(id => (object.registered || {})[id]())
    })

    return true
  }
})

const createElement = (component) => {
  const { _type } = component
  const node = document.createElement(_type)
  Object.keys(component).forEach((key) => {
    if (key.startsWith('_')) {
      return
    }
    switch (key) {
      case 'style':
        Object.keys(component[key]).forEach((cssProp) => {
          node.style[cssProp] = component[key][cssProp]
        })
        break
      case 'children':
      case 'state':
        return
      default:
        node[key] = component[key]
    }
  })
  return node
}

const recursivelyCreateComponent = ({ head, watchers, children, parent }) => {
  return children.map((object) => {
    if (!object) {
      return object
    }

    if (object.node) {
      object.parent = parent
      return object
    }

    const component = object
    const { _type } = component

    Object.keys(component).forEach((key) => {
      component[key] = typeof component[key] === 'function'
        ? component[key].bind(new Proxy(component, handler(component, head || component)))
        : component[key]
    })

    let modifyNode = true

    for (let i = 0; i < watchers.length; i += 1) {
      if (watchers[i].noProxy.registered && watchers[i].noProxy.registered[component._id]) {
        const comp = watchers[i].noProxy.registered[component._id](true)
        component.node = comp.node
        modifyNode = false
        break
      }
    }

    Object.keys(component).forEach((key) => {
      if (key.startsWith('__')) {
        const newKey = key.replace('__', '')
        watchers.forEach((watcher) => {
          if (component._id && !component[newKey]) {
            if (!watcher.noProxy.registered) {
              watcher.noProxy.registered = {}
            }
            watcher.noProxy.registered[component._id] = (returnComponent) => {
              if (returnComponent) {
                return component
              }
              const value = component[key]()
              return domModificator({
                component,
                key: newKey,
                value
              })
            }
          }
        })
        component[newKey] = key.startsWith('__') ? component[key]() : component[key]
      }
    })

    if (modifyNode) {
      component.node = _type === 'text'
        ? document.createTextNode(component.content)
        : createElement(component)
    } else {
      Object.keys(component).forEach((key) => {
        domModificator({
          parent: component.parent,
          component,
          key,
          value: component[key],
          anyway: true
        })
      })
    }

    if (parent) {
      component.parent = parent
    }

    if (component.children && Array.isArray(component.children)) {
      component.children = recursivelyCreateComponent({
        head: head || component,
        watchers,
        children: component.children,
        parent: component
      })
    }

    return component
  })
}

const createComponent = (object, ...watchers) => {
  const component = recursivelyCreateComponent({ watchers, children: [object], parent: null })[0]
  component.watchers = watchers
  return new Proxy(component, handler(component, component))
}

const recursivelyRenderComponents = ({ root, children, depth }) => {
  if (children) {
    children.forEach((component) => {
      if (!component || (component && component.noProxy && component.noProxy._matchesPath === false)) {
        return
      }
      const componentNode = component.noProxy ? component.noProxy.node : component.node
      const componentChildren = component.noProxy ? component.noProxy.children : component.children
      if (componentNode) {
        root.appendChild(componentNode)
      }
      if (componentChildren && depth !== 0) {
        recursivelyRenderComponents({ root: componentNode, children: componentChildren, depth: depth - 1 })
      }
    })
  }
}

const renderApp = (root, children) => {
  const main = createComponent({ _type: 'div', children })
  recursivelyRenderComponents({ root, children: [main] })
}

if (window.__TEST__) {
  module.exports = {
    createComponent,
    renderApp
  }
}

// const rerenderByPathname = (path, lastPath) => {
//   if (path !== lastPath) {
//     if (!rootLocation) {
//       rootLocation = path
//     }
//     window.history.pushState({ pathname: lastPath }, null, path)
//     Object.keys(pathDependentComponents).forEach((p) => {
//       Object.keys(pathDependentComponents[p]).forEach((id) => {
//         pathDependentComponents[p][id]()
//       })
//     })
//   }
// }

// window.addEventListener('popstate', (e) => {
//   const previousPathname = history.state ? history.state.pathname : rootLocation
//   console.log(window.location.pathname, previousPathname, history.state)
//   rerenderByPathname(window.location.pathname, previousPathname)
// })

// const locationManager = {
//   push (path) {
//     if (path !== window.location.pathname) {
//       rerenderByPathname(path, window.location.pathname)
//     }
//   }
// }
