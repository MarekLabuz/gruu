const doesntExist = v => v === null || v === undefined

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
    component[key] && component[key].node && component[key].node.remove()
    component[key] = undefined
    return 0
  }

  if (doesntExist(component[key]) && value._type && parent.node) {
    const newComponent = createComponent(value).noProxy

    if (key >= component.length) {
      recursivelyRenderComponents({ root: parent.node, children: [newComponent] })
    } else if (key < component.length) {
      const lastNode = component.reduce((acc, curr, i) => (i < key && curr) || acc, undefined)
      recursivelyRenderComponents({ root: newComponent.node, children: newComponent.children })
      parent.node.insertBefore(newComponent.node, lastNode && lastNode.node.nextSibling)
    }

    component[key] = newComponent
    return 0
  }

  if (Array.isArray(value) && value.every(v => v._type)) {
    const lengthDiff = component[key].length - value.length
    const values = value.concat(Array(lengthDiff < 0 ? 0 : lengthDiff).fill(null))
    for (let i = 0; i < values.length; i += 1) {
      i += domModificator({ parent: component, component: component[key], key: i, value: values[i] }) || 0
    }
    return 0
  }

  if (value._type && parent.node) {
    Object.keys(value).forEach((valueKey) => {
      domModificator({ parent: component, component: component[key], key: valueKey, value: value[valueKey] })
    })
    return 0
  }

  if (anyway || component[key] !== value && typeof value !== 'function') {
    switch (key) {
      case 'style':
        Object.keys(value).forEach((param) => {
          component.node.style[param] = value[param]
        })
        break
      case 'children':
        value.forEach((v, i) => {
          domModificator({ parent: component, component: component[key], key: i, value: v })
        })
        break
      case 'content':
        component.node.textContent = value
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

const handlerListener = (object, path) => ({
  set (target, key, value) {
    target[key] = value
  }
})

const handler = (object, head, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (typeof target[key] === 'object') {
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
      Object.keys(object.registered || {}).forEach(key => (object.registered || {})[key]())
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
    if (!object || object.node) {
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
              return domModificator({
                component,
                key: newKey,
                value: component[key]()
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
      Object.keys(component).forEach(key => {
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

const recursivelyRenderComponents = ({ root, children }) => {
  children.forEach((component) => {
    if (!component) {
      return
    }
    const componentNode = component.noProxy ? component.noProxy.node : component.node
    const componentChildren = component.noProxy ? component.noProxy.children : component.children
    root.appendChild(componentNode)
    if (componentChildren) {
      recursivelyRenderComponents({ root: componentNode, children: componentChildren })
    }
  })
}

const renderApp = (root, children) => {
  recursivelyRenderComponents({ root, children })
}
