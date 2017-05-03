const registered = {}

const doesntExist = v => v === null || v === undefined

function domModificator ({ parent, component, key, value }) {
  if ((typeof key === 'string' && key.startsWith('_')) ||
    (doesntExist(component[key]) && doesntExist(value)) ||
    key === 'node') {
    return 0
  }

  if (doesntExist(value)) {
    component[key].node.remove()
    component.splice(key, 1)
    return -1
  }

  if (doesntExist(component[key]) && value._type) {
    const newComponent = createComponent(value).noProxy

    if (key === component.length) {
      component[key] = newComponent
      recursivelyRenderComponents({ root: parent.node, children: [component[key]] })
    } else if (key < component.length) {
      parent.node.replaceChild(component[key].node, newComponent.node)
      component[key] = newComponent
    }
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

  if (value._type) {
    Object.keys(value).forEach((valueKey) => {
      domModificator({ parent: component, component: component[key], key: valueKey, value: value[valueKey] })
    })
    return 0
  }

  if (component[key] !== value && typeof value !== 'function') {
    component[key] = value
    switch (key) {
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
  }
  return 0
}

const getId = () => {
  const id = Math.max(0, ...Object.keys(registered)) + 1
  registered[id] = {}
  return id
}

const handlerListener = (object, path) => ({
  set (target, key, value) {
    target[key] = value
  }
})

const handler = (object, id, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (typeof target[key] === 'object') {
      return new Proxy(target[key], handler(object, id, ...k, key))
    }
    return target[key]
  },
  set (target, key, value) {
    domModificator({ component: target, key, value })

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

    Object.keys(registered[id] || {}).forEach((listenerId) => {
      Object.keys(registered[id][listenerId] || {}).forEach((param) => {
        const paramKey = `__${param}`
        domModificator({
          component: registered[id][listenerId][param],
          key: param,
          value: registered[id][listenerId][param][paramKey]()
        })
      })
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

const recursivelyCreateComponent = ({ id, head, watchers, children, parent }) => {
  return children.map((object) => {
    if (object.node) {
      return object
    }

    const component = object
    const { _type } = component

    if (head) {
      component._id = id
    }

    Object.keys(component).forEach((key) => {
      component[key] = typeof component[key] === 'function'
        ? component[key].bind(new Proxy(component, handler(component, id)))
        : component[key]
    })

    Object.keys(component).forEach((key) => {
      if (key.startsWith('__')) {
        const newKey = key.replace('__', '')
        const watchersIds = watchers.map(watcher => watcher.noProxy._id)
        watchersIds.forEach((watcherId) => {
          registered[watcherId] = Object.assign({}, registered[watcherId], {
            [id]: Object.assign({}, (registered[watcherId] || {})[id], { [newKey]: component })
          })
        })
        component[newKey] = key.startsWith('__') ? component[key]() : component[key]
      }
    })

    component.node = _type === 'text'
      ? document.createTextNode(component.content)
      : createElement(component)


    if (component.parent) {
      component.parent = parent
    }

    if (component.children && Array.isArray(component.children)) {
      component.children = recursivelyCreateComponent({
        id,
        head: false,
        watchers,
        children: component.children,
        parent: component
      })
    }

    return component
  })
}

const createComponent = (object, ...watchers) => {
  const id = getId()
  const component = recursivelyCreateComponent({ id, head: true, watchers, children: [object], parent: null })[0]
  return new Proxy(component, handler(component, id))
}

const recursivelyRenderComponents = ({ root, children }) => {
  children.forEach((component) => {
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

