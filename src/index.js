const Gruu = ((function () {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

  const uuid = () => `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`

  const proxyAwareArrayFunctions = ['push', 'unshift']
  const alterKeyCondition = key => key === 'children' || key.startsWith('_') || key.startsWith('$')

  const stateModificationHandler = ({ object, actions, value, modifyTree }) => {
    if (modifyTree) {
      if (actions.length === 0) {
        object.state = value
      } else {
        const lastAction = actions.slice(-1)[0]
        const v = actions.slice(0, -1).reduce((acc, key) => acc[key], object)
        v[lastAction] = value
      }
    }
  }

  const get = (object, actions) => actions.reduce((acc, key) => acc[key], object)

  const findClosestNodeParent = object => (object._node ? object : findClosestNodeParent(object._parent))

  const clearListeners = (component, paramsTuRemove) => {
    if (component._isRendered && component._watchers) {
      Object.keys(component._watchers).forEach((w) => {
        if (paramsTuRemove) {
          const set = component._watchers[w]._listeners[component._id].keys
          set.forEach((key) => {
            const param = key.split('->')[1].trim()
            if (paramsTuRemove.includes(param)) {
              set.delete(key)
            }
          })
          if (set.size === 0) {
            delete component._watchers[w]._listeners[component._id]
            delete component._watchers[w]
          }
        } else {
          delete component._watchers[w]._listeners[component._id]
          delete component._watchers[w]
        }
      })
    }
  }

  const updateDynamicProperty = (component, key, value) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      processStack.push({ component, key })
      domModificator({
        object: component,
        actions: [pureKey],
        value: value ? value() : component[key](),
        modifyTree: true
      })
      processStack.pop()
    }
  }

  const childrenModificationHandler = ({ object, actions, value, modifyTree }) => {
    const lastIndexChildren = actions.lastIndexOf('children')
    const action = actions.slice(lastIndexChildren + 1)[0]

    const target = get(object, actions)

    if (action === undefined) {
      const preTarget = get(object, actions.slice(0, -1))

      if (!preTarget.children) {
        preTarget.children = []
      }

      const length = preTarget.children.length - value.length
      const val = value.concat(Array(length < 0 ? 0 : length))

      let i
      for (i = 0; i < val.length;) {
        const currentChild = preTarget.children[i]
        const newChild = val[i]

        if (!currentChild || !newChild || !currentChild._key || !newChild._key || currentChild._key === newChild._key) {
          domModificator({ object, actions: [...actions, `${i}`], value: newChild, modifyTree })
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
        const preTarget = get(object, actions.slice(0, -2))

        if (target && !value) {
          target._unmount()
          if (modifyTree) {
            preTarget.children[action] = value
            target._parent.children[action] = value
          }
        } else if (target && value) {
          clearListeners(target)
          if ((target._type || value._type) && (!target._type || !value._type || target._type !== value._type)) {
            const component = value.noProxy || value

            recursivelyCreateAndRenderComponent({ component, parent: preTarget })

            target._unmount()
            const nodeParent = findClosestNodeParent(preTarget)

            const parentNodeArray = componentToNodeArray(nodeParent, true)
            const targetNodeArray = componentToNodeArray(target)
            const componentNodeArray = componentToNodeArray(component)

            const lastTargetNode = targetNodeArray.slice(-1)[0]

            let index = parentNodeArray.findIndex(({ id }) => id === lastTargetNode.id)

            if (index !== -1) {
              index += 1
              for (let i = index; i < parentNodeArray.length; i += 1) {
                if (parentNodeArray[i] && parentNodeArray[i].node &&
                  parentNodeArray[i].node.parentNode === nodeParent._node) {
                  index = i
                  break
                }
              }
            }

            componentNodeArray.forEach(({ node }) => {
              if (node) {
                nodeParent._node.insertBefore(node, parentNodeArray[index] && parentNodeArray[index].node)
              }
            })

            if (modifyTree) {
              preTarget.children[action] = component
              target._parent.children[action] = component
            }
          } else {
            const component = value.noProxy || value

            Object.keys(target).concat(Object.keys(component)).forEach((key) => {
              component[key] = component[key] || (alterKeyCondition(key) ? target[key] : component[key])
            })

            const componentKeys = Object.keys(component)

            componentKeys.forEach((key) => {
              if (!key.startsWith('_') && !key.startsWith('$')) {
                domModificator({ object, actions: [...actions, key], value: component[key], valueParent: component })
              }
            })

            componentKeys.forEach((key) => {
              if (key.startsWith('$')) {
                updateDynamicProperty(component, key)
              }
            })

            if (modifyTree) {
              target._parent.children[action] = component
              preTarget.children[action] = component
            }
          }
        } else if (!target && value) {
          const component = value.noProxy || value
          const parent = findClosestNodeParent(preTarget)

          recursivelyCreateAndRenderComponent({ component, parent: preTarget })

          const parentNodeArray = componentToNodeArray(parent, true)
          let index = parentNodeArray.findIndex(({ id }) => id === object._id)

          const componentNodeArray = componentToNodeArray(component)

          if (index !== -1) {
            index += 1
            for (let i = index; i < parentNodeArray.length; i += 1) {
              if (parentNodeArray[i] && parentNodeArray[i].node &&
                parentNodeArray[i].node.parentNode === parent._node) {
                index = i
                break
              }
            }
          }

          componentNodeArray.forEach(({ node }) => {
            if (node) {
              parent._node.insertBefore(node, parentNodeArray[index] && parentNodeArray[index].node)
            }
          })

          if (modifyTree) {
            preTarget.children[action] = component
          }
        }
      }
    }
  }

  const nodeModificationHandler = ({ object, actions, value, modifyTree }) => {
    const lastIndexChildren = actions.lastIndexOf('style')
    const action = actions.slice(lastIndexChildren + 1)[0]

    if (lastIndexChildren !== -1) {
      if (action === undefined) {
        const target = get(object, actions.slice(0, lastIndexChildren))
        if (!value) {
          target._node.removeAttribute('style')
          if (modifyTree) {
            target.style = value
          }
        } else {
          const newStyle = Object.assign({}, target.style, value)
          if (!target.style) {
            target.style = {}
          }
          Object.keys(newStyle).forEach((key) => {
            if (target.style[key] !== value[key]) {
              target._node.style[key] = value[key] || ''
              if (modifyTree) {
                target.style[key] = value[key]
              }
            }
          })
        }
      } else {
        const target = get(object, actions.slice(0, -2))
        target._node.style[action] = value
        if (modifyTree) {
          if (!target.style) {
            target.style = {}
          }
          target.style[action] = value
        }
      }
    } else {
      const target = get(object, actions.slice(0, -1))
      const lastAction = actions.slice(-1)[0]

      if (target[lastAction] !== value) {
        if (modifyTree) {
          target[lastAction] = value
        }
        if (target._node) {
          target._node[lastAction] = value
        }
      }
    }
  }

  const destinations = {
    INTERNAL: 'INTERNAL',
    DEFAULT: 'DEFAULT',
    STATE: 'STATE',
    CHILDREN: 'CHILDREN',
    NODE: 'NODE',
    NONE: 'NONE'
  }

  const findDestination = (actions = []) => {
    let destination = ''
    let isNode = true

    for (const action of actions) {
      if (destination === destinations.INTERNAL || action.startsWith('_')) {
        return destinations.INTERNAL
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

  const defaultModificationHandler = ({ object, actions, value, modifyTree }) => {
    const target = get(object, actions.slice(0, -1))
    const action = actions.slice(-1)[0]
    if (modifyTree) {
      target[action] = value
    }
  }

  const domModificator = ({ object: obj, actions, value, modifyTree }) => {
    const destination = findDestination(actions)

    const object = obj.noProxy || obj

    switch (destination) {
      case destinations.STATE:
        stateModificationHandler({ object, actions, value, modifyTree })
        break
      case destinations.CHILDREN:
        childrenModificationHandler({ object, actions, value, modifyTree })
        break
      case destinations.NODE:
        nodeModificationHandler({ object, actions, value, modifyTree })
        break
      case destinations.DEFAULT:
        defaultModificationHandler({ object, actions, value, modifyTree })
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
        return new Proxy(target[key].noProxy || target[key], handler(component, ...(isType ? [] : [...k, key])))
      }

      if (typeof target[key] === 'function' && !proxyAwareArrayFunctions.includes(key)) {
        return target[key].bind(target)
      }

      return target[key]
    },
    set (target, key, value) {
      const actions = [...k, key]
      domModificator({ object, actions, value, modifyTree: true })

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

              clearListeners(component, paramsTuUpdate)
              paramsTuUpdate.forEach((param) => {
                updateDynamicProperty(component, param)
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

  const internallyCreateComponent = (object) => {
    const component = object.noProxy || object
    component._id = component._id || uuid()

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

    if (component.children && Array.isArray(component.children)) {
      component.children = component.children.map(child => (child && child.noProxy) || child)
    }

    component._unmount = function () {
      clearListeners(this)
      if (this._isRendered) {
        if (this._node) {
          const nodeParent = findClosestNodeParent(this._parent)
          nodeParent._node.removeChild(this._node)
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

  const recursivelyCreateAndRenderComponent = ({ component: object, parent, nodeParent }) => {
    if (!object || object._isRendered) {
      if (object && object._isRendered) {
        Object.keys(object).forEach((key) => {
          updateDynamicProperty(object, key)
        })
      }
      return
    }

    const component = internallyCreateComponent(object)
    internallyRenderComponent({ component, parent, nodeParent })
    if (component.children) {
      component.children.forEach((child) => {
        recursivelyCreateAndRenderComponent({
          component: child,
          parent: component,
          nodeParent: component._node ? component : nodeParent
        })
      })
    }

    component._isRendered = true
  }

  const createComponent = (object) => {
    if (!object) {
      return object
    }
    object._id = object._id || uuid()
    return new Proxy(object, handler(object))
  }

  const internallyRenderComponent = ({ component, parent, nodeParent }) => {
    const pureComponent = component && (component.noProxy || component)

    if (pureComponent) {
      if (pureComponent._type) {
        pureComponent._node = pureComponent._type === 'text'
          ? document.createTextNode(pureComponent.textContent)
          : createElement(pureComponent)
      }

      pureComponent._parent = parent.noProxy || parent

      if (nodeParent && pureComponent._node) {
        nodeParent._node.appendChild(pureComponent._node)
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
    const parent = { _node: root, children: [component] }
    recursivelyCreateAndRenderComponent({ component, parent, nodeParent: parent })
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

  return Object.assign(
    { createComponent, renderApp, browserHistory, route },
    window.__DEV__ ? { destinations, findDestination } : {}
  )
})())

if (typeof module !== 'undefined') {
  module.exports = Gruu
}
