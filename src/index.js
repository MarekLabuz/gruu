const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

const uuid = () => `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`

const proxyAwareArrayFunctions = ['push', 'unshift']

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

const findClosestNodeParent = object => (object._node ? object : findClosestNodeParent(object._parent))

const childrenModificationHandler = ({ object, actions, value }) => {
  const lastIndexChildren = actions.lastIndexOf('children')
  const action = actions.slice(lastIndexChildren + 1)[0]

  const target = get(object, actions)

  if (action === undefined) {
    const preTarget = get(object, actions.slice(0, -1))

    if (!preTarget.children) {
      preTarget.children = []
    }

    const length = preTarget.children.length - value.length
    const val = value.concat(Array(length < 0 ? 0 : length).fill(null))

    let i
    for (i = 0; i < val.length;) {
      const currentChild = preTarget.children[i]
      const newChild = val[i]

      if (!currentChild || !newChild || !currentChild._key || !newChild._key || currentChild._key === newChild._key) {
        domModificator({ object, actions: [...actions, `${i}`], value: newChild })
        i += 1
      } else {
        currentChild._unmount()
        preTarget.children = [
          ...preTarget.children.slice(0, i),
          ...preTarget.children.slice(i + 1)
        ]
      }
    }
  } else if (!isNaN(parseInt(action, 10))) {
    if (target !== (value && (value.noProxy || value))) {
      if (target && !value) {
        target._unmount()
        target._parent.children[action] = null
      } else if (target && value) {
        if (value._isRendered && value._watchers) {
          Object.keys(value._watchers).forEach((w) => {
            delete value._watchers[w]._listeners[value._id]
          })
        }
        if (!target._type || !value._type || target._type !== value._type) {
          const component = recursivelyCreateComponent(value)

          recursivelyRenderComponent({ component, parent: target._parent })

          target._unmount()
          const nodeParent = findClosestNodeParent(target._parent)

          const parentNodeArray = componentToNodeArray(nodeParent, true)
          const targetNodeArray = componentToNodeArray(target)
          const componentNodeArray = componentToNodeArray(component)

          const lastTargetNode = targetNodeArray.slice(-1)[0]

          let index = parentNodeArray.findIndex(({ id }) => id === lastTargetNode.id)

          if (index === -1) {
            if (component._node) {
              nodeParent._node.appendChild(component._node)
            }
            target._parent.children[action] = component
          } else {
            index += 1
            for (let i = index; i < parentNodeArray.length; i += 1) {
              if (parentNodeArray[i] && parentNodeArray[i].node &&
                parentNodeArray[i].node.parentNode === nodeParent._node) {
                index = i
                break
              }
            }

            componentNodeArray.forEach(({ node }) => {
              if (node) {
                nodeParent._node.insertBefore(node, parentNodeArray[index] && parentNodeArray[index].node)
              }
            })

            target._parent.children[action] = component
          }
        } else {
          const component = recursivelyCreateComponent(value)
          recursivelyRenderComponent({ component, parent: target._parent })

          const componentKeys = Object.keys(component)
          componentKeys.forEach((key) => {
            if (!key.startsWith('_')) {
              domModificator({ object, actions: [...actions, key], value: component[key] })
            }
          })
        }
      } else if (!target && value) {
        const component = recursivelyCreateComponent(value)
        const preTarget = get(object, actions.slice(0, -2))

        const parent = findClosestNodeParent(preTarget)
        recursivelyRenderComponent({ component, parent: preTarget })

        const parentNodeArray = componentToNodeArray(parent, true)
        let index = parentNodeArray.findIndex(({ id }) => id === object._id)

        if (index === -1) {
          if (component._node) {
            parent._node.appendChild(component._node)
          }
          preTarget.children[action] = component
        } else {
          index += 1
          for (let i = index; i < parentNodeArray.length; i += 1) {
            if (parentNodeArray[i] && parentNodeArray[i].node && parentNodeArray[i].node.parentNode === parent._node) {
              index = i
              break
            }
          }

          const componentNodeArray = componentToNodeArray(component)

          componentNodeArray.forEach(({ node }) => {
            if (node) {
              parent._node.insertBefore(node, parentNodeArray[index] && parentNodeArray[index].node)
            }
          })

          preTarget.children[action] = component
        }
      }
    }
  }
}

const nodeModificationHandler = ({ object, actions, value }) => {
  const [first, second] = actions.slice(-2)

  if (first === 'style') {
    if (actions.length === 1) {
      const target = get(object, actions.slice(0, -1))
      const newStyle = Object.assign({}, target.style, value)

      Object.keys(newStyle).forEach((key) => {
        if (target.style[key] !== value[key]) {
          target._node.style[key] = newStyle[key] || ''
          target.style[key] = newStyle[key]
        }
      })
    } else {
      const target = get(object, actions.slice(0, -2))
      target._node.style[second] = value
      target.style[second] = value
    }
  } else {
    const target = get(object, actions.slice(0, -1))
    const lastAction = actions.slice(-1)[0]

    if (target[lastAction] !== value) {
      target[lastAction] = value
      target._node[lastAction] = value
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
  let destination = ''
  let isNode = true

  for (const action of actions) { // eslint-disable-line
    if (destination === destinations.NONE || action.startsWith('_')) {
      return destinations.NONE
    } else if (destination === destinations.DEFAULT || action.startsWith('$')) {
      return destinations.DEFAULT
    } else if (destination === destinations.STATE || (action === 'state' && isNode)) {
      return destinations.STATE
    } else if (action === 'children' && isNode) {
      destination = destinations.CHILDREN
      isNode = false
    } else if (destination === destinations.CHILDREN && !isNaN(parseInt(action, 10))) {
      destination = destinations.CHILDREN
      isNode = true
    } else if (isNode) {
      destination = destinations.NODE
      isNode = true
    }
  }
  return destination
}

const defaultModificationHandler = ({ object, actions, value }) => {
  const target = get(object, actions.slice(0, -1))
  const action = actions.slice(-1)[0]
  target[action] = value
}

const domModificator = ({ object: obj, actions, value }) => {
  const destination = findDestination(actions)

  const object = obj.noProxy || obj

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

    const isType = target[key] && (target[key]._type || target[key].children)
    const component = isType ? target[key] : object

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler(component, ...(isType ? [] : [...k, key])))
    }

    if (typeof target[key] === 'function' && !proxyAwareArrayFunctions.includes(key)) {
      return target[key].bind(target)
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
          if (object._listeners[id]) {
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
          }
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

const recursivelyCreateComponent = (obj) => {
  const object = typeof obj === 'string' ? { _type: 'text', textContent: obj } : obj

  if (!object) {
    return object
  }

  if (object._isRendered) {
    return object.noProxy || object
  }

  const component = object
  component._id = uuid()

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

  component._unmount = function () { // eslint-disable-line
    if (this._isRendered && this._watchers) {
      Object.keys(this._watchers).forEach((w) => {
        delete this._watchers[w]._listeners[this._id]
      })
    }
    if (this._isRendered) {
      if (this._node) {
        const nodeParent = findClosestNodeParent(this._parent)
        if (this._node.parentNode === nodeParent._node) {
          nodeParent._node.removeChild(this._node)
        }
      } else if (this.children) {
        this.children.forEach((child) => {
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

const recursivelyRenderComponent = ({ component, parent, nodeParent }) => {
  const pureComponent = component && (component.noProxy || component)

  if (pureComponent) {
    pureComponent._parent = parent

    if (nodeParent && pureComponent._node) {
      nodeParent._node.appendChild(pureComponent._node)
    }

    if (pureComponent.children) {
      pureComponent.children.forEach((child) => {
        recursivelyRenderComponent({
          component: child,
          parent: pureComponent,
          nodeParent: pureComponent._node ? pureComponent : nodeParent
        })
      })
    }
  }
}

const attachComponent = (component) => {
  const pureComponent = component && (component.noProxy || component)
  if (pureComponent) {
    if (pureComponent._node) {
      const nodeParent = findClosestNodeParent(pureComponent._parent)
      nodeParent._node.appendChild(pureComponent._node)
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

if (module.exports) {
  module.exports = {
    createComponent,
    renderApp,
    browserHistory,
    route
  }
}
