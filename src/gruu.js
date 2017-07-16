const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) // eslint-disable-line

const guid = () => `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`

const doesntExist = v => v === null || v === undefined || v === false

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

  if (key === 'length' && value < component.length) {
    for (let i = value; i < component.length; i += 1) {
      domModificator({ parent, component, key: i, value: null })
    }
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

  if (anyway || (component[key] !== value && typeof value !== 'function' && key !== 'length')) {
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

const handler = (object, parent, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler(object, target._type ? target : parent, ...k, key))
    }
    return target[key]
  },
  set (target, key, value) {
    domModificator({ component: target, key, value, parent })

    if (object.rerender) {
      clearTimeout(object.rerender)
    }

    object.rerender = setTimeout(() => {
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
    object._id = guid()

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
        ? component[key].bind(new Proxy(component, handler(component, component.parent)))
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

    if (parent) {
      component.parent = parent
    }

    if (modifyNode && component._type) {
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

    if (component.children && Array.isArray(component.children)) {
      component.children = recursivelyCreateComponent({
        head: head || component,
        watchers,
        children: component.children,
        // parent: component,
        parent: component._type ? component : parent
      })
    }

    return component
  })
}














const stateModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 0) {
    object.state = value
  } else {
    const [action, ...rest] = actions
    const v = rest.reduce((acc, key) => acc[key], object.state)
    v[action] = value
  }
}

const childrenModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 0) {
    object.children.forEach((child, i) => {
      if (child && value[i]) {
        Object.keys(value[i]).forEach((key) => {
          domModificator2({ object: child, actions: [key], value: value[i][key] })
        })
      } else if (!child || !value[i]) {
        domModificator2({ object, actions: ['children', i], value: value[i] })
      }
    })
    value.slice(object.children.length).forEach((newChild, i) => {
      domModificator2({ object, actions: ['children', object.children.length + i], value: newChild })
    })
  } else if (!isNaN(parseInt(actions[0], 10))) {
    const target = object.children[actions[0]]
    if (target && !value) {
      target._parent._node.removeChild(target._node)
      object.children[actions[0]] = value
    } else if (target && value) {
      const component = recursivelyCreateComponent2({ object: value })
      recursivelyRenderComponent({ component })

      Object.keys(component).forEach((key) => {
        domModificator2({ object: target, actions: [key], value: component[key] })
      })
    } else if (!target && value) {
      const component = recursivelyCreateComponent2({ object: value })
      recursivelyRenderComponent({ component })
      component._parent = object

      let index = parseInt(actions[0], 10) + 1
      for (let i = index; i < object.children.length; i += 1) {
        if (object.children[i]) {
          index = i
          break
        }
      }

      object._node.insertBefore(component._node, object.children[index] && object.children[index]._node)
      object.children[actions[0]] = component
    }
  }
}

const nodeModificationHandler = ({ object, action, actions, value }) => {
  if (actions.length === 0) {
    object._node[action] = value
  } else {
    const [a, ...rest] = actions
    const v = rest.reduce((acc, key) => acc[key], object._node[action])
    v[a] = value
  }
}

const domModificator2 = ({ object, actions: [action, ...actions], value }) => {
  if (action.startsWith('_')) {
    return
  }

  switch (action) {
    case 'state':
      stateModificationHandler({ object, actions, value })
      break
    case 'children':
      childrenModificationHandler({ object, actions, value })
      break
    default:
      nodeModificationHandler({ object, action, actions, value })
      break
  }
}


const handler2 = (object, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    const isType = target[key] && target[key]._type
    const component = isType ? target[key] : target

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler2(component, ...(isType ? [] : [...k, key])))
    }

    return target[key]
  },
  set (target, key, value) {
    const actions = [...k, key]
    domModificator2({ object, actions, value })

    if (object._rerender) {
      clearTimeout(object._rerender)
    }
    object._rerender = setTimeout(() => {
      Object.keys(object).forEach((param) => {
        if (param.startsWith('$')) {
          const pureKey = param.slice(1)
          domModificator2({ object, actions: [pureKey], value: object[param]() })
        }
      })
      // Object.keys(object.registered || {}).forEach(id => (object.registered || {})[id]())
    })

    return true
  }
})

const createElement2 = (component) => {
  const node = document.createElement(component._type)
  Object.keys(component).forEach((key) => {
    if (key.startsWith('_') || key.startsWith('$')) {
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

const recursivelyCreateComponent2 = ({ object, parent }) => {
  if (!object) {
    return object
  }

  if (object._isRendered) {
    object.noProxy._parent = parent
    return object
  }

  const component = object
  component._id = guid()
  component._parent = parent

  Object.keys(component).forEach((key) => {
    component[key] = typeof component[key] === 'function'
      ? component[key].bind(new Proxy(component, handler2(component)))
      : component[key]
  })

  Object.keys(component).forEach((key) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      component[pureKey] = component[key]()
    }
  })

  if (component._type) {
    component._node = component._type === 'text'
      ? document.createTextNode(component.textContent)
      : createElement2(component)
  }

  if (component.children && Array.isArray(component.children)) {
    component.children = component.children.map(child => recursivelyCreateComponent2({
      object: child,
      parent: component._type ? component : parent
    }))
  }

  component._isRendered = true
  return component
}

const createComponent = (object, ...watchers) => {
  const component = recursivelyCreateComponent2({ object, watchers })
  return new Proxy(component, handler2(component))
}

const recursivelyRenderComponent = ({ component }) => {
  const pureComponent = component && (component.noProxy || component)

  if (pureComponent) {
    if (pureComponent._node && pureComponent._parent) {
      pureComponent._parent._node.appendChild(pureComponent._node)
    }

    if (pureComponent.children) {
      pureComponent.children.forEach((child) => {
        recursivelyRenderComponent({ component: child })
      })
    }
  }
}

const renderApp = (root, children) => {
  const component = createComponent({ _type: 'div', children })
  component.noProxy._parent = { _node: root }
  recursivelyRenderComponent({ component })
}


















// const browserHistory = createComponent({
//   _id: 'browserHistory',
//   state: {
//     locationPath: window.location.pathname,
//     goTo (path) {
//       browserHistory.state.locationPath = path
//       window.history.pushState(null, null, path)
//     }
//   }
// })
//
// const isPathCorrect = (path, locationPath) => path === locationPath
//
// const route = (id, path, component) => createComponent({
//   _type: 'div',
//   _id: id,
//   __children () {
//     return [isPathCorrect(path, browserHistory.state.locationPath) && component]
//   }
// }, browserHistory)

if (window.__TEST__) {
  module.exports = {
    createComponent,
    renderApp,
    // browserHistory,
    // route
  }
}
