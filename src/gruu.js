const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) // eslint-disable-line

const guid = () => `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`

const stateModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 0) {
    object.state = value
  } else {
    const lastAction = actions.slice(-1)[0]
    const v = actions.slice(0, -1).reduce((acc, key) => acc[key], object)
    v[lastAction] = value
  }
}

const get = (object, actions) => actions.reduce((acc, key) => acc[key], object)

const findClosestParent = object => (object._node ? object : findClosestParent(object._parent))

const childrenModificationHandler = ({ object, actions, value }) => {
  const lastIndexChildren = actions.lastIndexOf('children')
  const action = actions.slice(lastIndexChildren + 1)[0]

  if (action === undefined) {
    const length = object.children.length - value.length
    value.concat(Array(length < 0 ? 0 : length).fill(null)).forEach((newChild, i) => {
      domModificator({ object, actions: [...actions, `${i}`], value: newChild })
    })
  } else if (!isNaN(parseInt(action, 10))) {
    const target = get(object, actions)
    if (target && !value) {
      target._unmount()
      target._isRendered = false
      object.children[action] = null
    } else if (target && target._isRendered && value) {
      if (value._isRendered && value._watchers) {
        Object.keys(value._watchers).forEach((w) => {
          delete value._watchers[w]._listeners[value._id]
        })
      }
      if ((target._type || value._type) && (!target._type || !value._type || target._type !== value._type)) {
        const component = value._isRendered ? (value.noProxy || value) : recursivelyCreateComponent(value)
        target._unmount()
        recursivelyRenderComponent({ component, parent: findClosestParent(target._parent) })
        const nodeArray = componentToNodeArray(component)

        let index = parseInt(action, 10) + 1
        for (let i = index; i < target._parent.children.length; i += 1) {
          if (target._parent.children[i] && target._parent.children[i]._node) {
            index = i
            break
          }
        }

        nodeArray.forEach(({ node }) => {
          target._parent._node
            .insertBefore(node, target._parent.children[index] && target._parent.children[index]._node)
        })

        object.children[action] = component
      } else {
        const component = value._isRendered ? (value.noProxy || value) : recursivelyCreateComponent(value)
        recursivelyRenderComponent({ component, parent: findClosestParent(target._parent) })

        Object.keys(component).forEach((key) => {
          domModificator({ object: target, actions: [key], value: component[key] })
        })
      }
    } else if ((!target || !target._isRendered) && value) {
      const component = recursivelyCreateComponent(value)
      const parent = findClosestParent(object)
      recursivelyRenderComponent({ component, parent })

      const nodeArray = componentToNodeArray(parent, true)
      let index = nodeArray.findIndex(({ id }) => id === (target ? target._id : object._id))

      if (index === -1) {
        if (component._node) {
          parent._node.appendChild(component._node)
        }
        object.children[action] = component
      } else {
        index += 1
        for (let i = index; i < nodeArray.length; i += 1) {
          if (nodeArray[i] && nodeArray[i].node && nodeArray[i].node.parentNode === parent._node) {
            index = i
            break
          }
        }

        if (component._node) {
          parent._node.insertBefore(component._node, nodeArray[index] && nodeArray[index].node)
        }
        object.children[action] = component
      }
    }
  }
}

const anythingHasChanged = (object = {}, dest = {}) => {
  if (typeof object === 'object' && typeof dest === 'object') {
    const keys = Object.keys(Object.assign({}, object, dest))
    for (const key of keys) { // eslint-disable-line
      if (object[key] !== dest[key]) {
        return true
      }
    }
    return false
  }
  return object !== dest
}

const nodeModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 1) {
    const action = actions[0]
    if (anythingHasChanged(value, object[action])) {
      if (action === 'style') {
        object._node.removeAttribute('style')
        Object.keys(value).forEach((key) => {
          object._node.style[key] = value[key] || ''
        })
        object.style = value
      } else {
        object._node[action] = value
        object[action] = value
      }
    }
  } else {
    const lastAction = actions.slice(-1)[0]
    const { v: val, n: node } = actions
      .slice(0, -1)
      .reduce(({ v, n }, key) => ({ v: v[key], n: n[key] }), { v: object, n: object._node })

    if (node[lastAction] !== val[lastAction] || val[lastAction] !== value || node[lastAction] !== value) {
      val[lastAction] = value
      node[lastAction] = value
    }
  }
}

const destinations = {
  NONE: 'NONE',
  DEFAULT: 'DEFAULT',
  STATE: 'STATE',
  CHILDREN: 'CHILDREN',
  NODE: 'NODE'
}

const findDestination = (actions) => {
  let result = { destination: '', isNode: true }
  for (const action of actions) { // eslint-disable-line
    if (result.destination === destinations.NONE || action.startsWith('_')) {
      return destinations.NONE
    } else if (result.destination === destinations.DEFAULT || action.startsWith('$')) {
      return destinations.DEFAULT
    } else if (result.destination === destinations.STATE || (action === 'state' && result.isNode)) {
      return destinations.STATE
    } else if (action === 'children' && result.isNode) {
      result = { destination: destinations.CHILDREN, isNode: false }
    } else if (result.destination === destinations.CHILDREN && !isNaN(parseInt(action, 10))) {
      result = { destination: destinations.CHILDREN, isNode: true }
    } else if (result.isNode) {
      result = { destination: destinations.NODE, isNode: true }
    }
  }
  return result.destination
}

const defaultModificationHandler = ({ object, actions, value }) => {
  object[actions[0]] = value
}

const domModificator = ({ object: obj, actions, value }) => {
  const destination = findDestination(actions)

  const object = obj.noProxy || obj
  // debugger

  switch (destination) {
    case destinations.STATE:
      stateModificationHandler({ object, actions, value })
      break
    case destinations.CHILDREN:
      childrenModificationHandler({ object, actions, value })
      break
    case destinations.NODE:
      nodeModificationHandler({ object, actions, value })
      break
    case destinations.DEFAULT:
      defaultModificationHandler({ object, actions, value })
      break
    default:
      break
  }
}

const handler = (object, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (typeof key === 'string' && key.startsWith('_')) {
      return target[key]
    }

    const { component: stackElement, key: stackKey } = processStack.slice(-1)[0] || {}
    if (stackElement) {
      if (!object._listeners) {
        object._listeners = {}
      }

      const newKey = [...k, key].join('.')

      if (!object._listeners[stackElement._id]) {
        object._listeners[stackElement._id] = {
          keys: new Set()
        }
      }
      object._listeners[stackElement._id].component = stackElement
      object._listeners[stackElement._id].keys.add(`${newKey} -> ${stackKey}`)

      if (!stackElement._watchers) {
        stackElement._watchers = {}
      }
      stackElement._watchers[object._id] = object
    }

    const isType = target[key] && target[key]._type
    const component = isType ? target[key] : object

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler(component, ...(isType ? [] : [...k, key])))
    }

    return target[key]
  },
  set (target, key, value) {
    const actions = [...k, key]
    domModificator({ object, actions, value })

    if (object._rerender) {
      clearTimeout(object._rerender)
    }

    object._rerender = setTimeout(() => {
      const _actions = actions.length > 1 ? actions.slice(0, -1).join('.') : actions[0]
      if (object._listeners) {
        const listenersIds = Object.keys(object._listeners)
        listenersIds.forEach((id) => {
          const { component, keys } = object._listeners[id]
          const paramsTuUpdate = Object.keys(component).reduce((acc, param) => [
            ...acc.filter(p => p !== param),
            ...(param.startsWith('$') && keys.has(`${_actions} -> ${param.split('.')[0]}`) ? [param] : [])
          ], [])

          paramsTuUpdate.forEach((param) => {
            const pureKey = param.slice(1)
            domModificator({
              object: component,
              actions: [pureKey],
              value: component[param]()
            })
          })
        })
      }
    })

    return true
  }
})

const createElement = (component) => {
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

const processStack = []

const recursivelyCreateComponent = (object) => {
  if (!object) {
    return object
  }

  if (object._isRendered) {
    return object.noProxy || object
  }

  const component = Object.assign({}, object)
  component._id = guid()

  Object.keys(component).forEach((key) => {
    component[key] = typeof component[key] === 'function'
      ? component[key].bind(new Proxy(component, handler(component)))
      : component[key]
  })

  Object.keys(component).forEach((key) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      processStack.push({ component, key })
      component[pureKey] = component[key]()
      processStack.pop()
    }
  })

  if (component._type) {
    component._node = component._type === 'text'
      ? document.createTextNode(component.textContent)
      : createElement(component)
  }

  if (component.children && Array.isArray(component.children)) {
    component.children = component.children.map(recursivelyCreateComponent)
  }

  component._isRendered = true

  component._unmount = () => {
    if (component._isRendered && component._watchers) {
      Object.keys(component._watchers).forEach((w) => {
        delete component._watchers[w]._listeners[component._id]
      })
    }
    if (component._isRendered) {
      if (component._node && component._node.parentNode === component._parent._node) {
        component._parent._node.removeChild(component._node)
      } else if (component.children) {
        component.children.forEach((child) => {
          if (child) {
            child._unmount()
          }
        })
      }
    }
  }

  return component
}

const createComponent = (object) => {
  const component = recursivelyCreateComponent(object)
  return new Proxy(component, handler(component))
}

const recursivelyRenderComponent = ({ component, parent, attach = false }) => {
  const pureComponent = component && (component.noProxy || component)
  let a = false

  pureComponent._parent = parent

  if (pureComponent) {
    if (attach && pureComponent._node && pureComponent._parent) {
      pureComponent._parent._node.appendChild(pureComponent._node)
    } else {
      a = true
    }

    if (pureComponent.children) {
      pureComponent.children.forEach((child) => {
        recursivelyRenderComponent({
          component: child,
          parent: pureComponent._node ? pureComponent : pureComponent._parent,
          attach: attach || !!pureComponent._node
        })
      })
    }
  }
}

const attachComponent = (component) => {
  const pureComponent = component && (component.noProxy || component)
  if (pureComponent) {
    if (pureComponent._node && pureComponent._parent) {
      pureComponent._parent._node.appendChild(pureComponent._node)
      return
    }

    if (pureComponent.children) {
      pureComponent.children.forEach(attachComponent)
    }
  }
}

const componentToNodeArray = (component, next) => {
  const pureComponent = component && (component.noProxy || component)

  if (pureComponent) {
    if (pureComponent._node && !next) {
      return [{ id: pureComponent._id, node: pureComponent._node }]
    }

    if (pureComponent.children) {
      return pureComponent.children.reduce((acc, child) =>
        acc.concat(child ? componentToNodeArray(child) : [{ id: pureComponent._id }]), []
      )
    }
  }
  return []
}

const renderApp = (root, children) => {
  const component = createComponent({ children }).noProxy
  recursivelyRenderComponent({ component, parent: { _node: root, children: [component] } })
  attachComponent(component)
}

const browserHistory = createComponent({
  state: {
    locationPath: window.location.pathname,
    goTo (path) {
      browserHistory.state.locationPath = path
      window.history.pushState(null, null, path)
    }
  }
})

const isPathCorrect = (path, locationPath) => path === locationPath

const route = (path, component) => createComponent({
  $children () {
    return [isPathCorrect(path, browserHistory.state.locationPath) && component]
  }
})

if (window.__DEV__) {
  module.exports = {
    createComponent,
    renderApp,
    browserHistory,
    route
  }
}
