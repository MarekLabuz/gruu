const Gruu = ((function () {
  const exists = value => value || value === '' || value === 0

  const char = () => Math.floor(31 * Math.random()).toString(32)
  const chunk = num => Array(num).fill(0).map(() => char()).join('')

  const uuid = () => `${chunk(8)}-${chunk(4)}-${chunk(4)}-${chunk(4)}-${chunk(12)}`

  const stateModificationHandler = (object, actions, value, modifyTree) => {
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
      domModificator(component, [pureKey], value ? value() : component[key](), {
        modifyTree: true
      })
      processStack.pop()
    }
  }

  const handleComponentRender = (value, target, preTarget, modifyTree, action, valueParent, object) => {
    let component = value.noProxy || value
    component = recursivelyCreateAndRenderComponent({ component, parent: preTarget })

    const nodeParent = findClosestNodeParent(preTarget)

    const parentNodeArray = componentToNodeArray(nodeParent, true)
    const componentNodeArray = componentToNodeArray(component)

    let index
    if (target) {
      target._unmount()
      const targetNodeArray = componentToNodeArray(target)
      const lastTargetNode = targetNodeArray.slice(-1)[0]
      index = parentNodeArray.findIndex(({ id }) => id === lastTargetNode.id)
    } else {
      index = parentNodeArray.findIndex(({ id }) => id === object._id)
    }

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
        if (!parentNodeArray[index] || !parentNodeArray[index].node || parentNodeArray[index].node.parentNode) {
          nodeParent._node.insertBefore(node, parentNodeArray[index] && parentNodeArray[index].node)
        } else {
          nodeParent._node.appendChild(node)
        }
      }
    })

    if (modifyTree) {
      preTarget.children[action] = component
      if (target) {
        target._parent.children[action] = component
      }
    } else if (valueParent) {
      valueParent.children[action] = component
    }
  }

  const childrenModificationHandler = (object, actions, value, valueParent, modifyTree) => {
    const lastIndexChildren = actions.lastIndexOf('children')
    const action = actions.slice(lastIndexChildren + 1)[0]

    const target = get(object, actions)

    if (action === undefined) {
      let preTarget = get(object, actions.slice(0, -1))
      preTarget = preTarget.noProxy || preTarget

      if (!preTarget.children) {
        preTarget.children = []
      }

      const valueArray = Array.isArray(value) ? value : [value]
      if (valueParent) {
        valueParent.children = valueArray
      }
      const length = preTarget.children.length - valueArray.length
      const val = valueArray.concat(Array(length < 0 ? 0 : length))

      let i
      for (i = 0; i < val.length;) {
        const currentChild = preTarget.children[i]
        const newChild = val[i]

        if (!currentChild || !newChild || !currentChild._key || !newChild._key || currentChild._key === newChild._key) {
          domModificator(object, [...actions, `${i}`], newChild, { valueParent, modifyTree })
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

        if (exists(target) && !exists(value)) {
          target._unmount()
          if (modifyTree) {
            preTarget.children[action] = value
            target._parent.children[action] = value
          }
        } else if (exists(target) && exists(value)) {
          clearListeners(target)
          if ((target._type || value._type) && (!target._type || !value._type || target._type !== value._type)) {
            handleComponentRender(value, target, preTarget, modifyTree, action, valueParent)
          } else {
            const component = value.noProxy || value
            const targetKeys = Object.keys(target)
            targetKeys.forEach((key) => {
              if (key.startsWith('_') || key.startsWith('$')) {
                component[key] = component[key] || target[key]
              }
            })
            const componentKeys = Object.keys(component)
            const notExisting = targetKeys.filter(key => !componentKeys.includes(key))
            notExisting.forEach((key) => {
              domModificator(object, [...actions, key], component[key], { valueParent: component })
            })
            componentKeys.forEach((key) => {
              if (typeof component[key] === 'function') {
                component[key] = component[key].bind(new Proxy(component, handler(component)))
              }
              if (!key.startsWith('_') && !key.startsWith('$')) {
                domModificator(object, [...actions, key], component[key], { valueParent: component })
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
        } else if (!exists(target) && exists(value)) {
          handleComponentRender(value, target, preTarget, modifyTree, action, valueParent, object)
        }
      }
    }
  }

  const nodeModificationHandler = (object, actions, value, modifyTree) => {
    const lastIndexChildren = actions.lastIndexOf('style')
    const action = actions.slice(lastIndexChildren + 1)[0]

    if (lastIndexChildren !== -1) {
      if (action === undefined) {
        const target = get(object, actions.slice(0, lastIndexChildren))
        if (!exists(value)) {
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
          target._node[lastAction] = value || ''
        }
      }
    }
  }

  const destinations = {
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
      if (destination === destinations.DEFAULT || action.startsWith('$')) {
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

  const defaultModificationHandler = (object, actions, value, modifyTree) => {
    const target = get(object, actions.slice(0, -1))
    const action = actions.slice(-1)[0]
    if (modifyTree) {
      target[action] = value
    }
  }

  const domModificator = (obj, actions, value, { valueParent, modifyTree }) => {
    const destination = findDestination(actions)

    const object = obj.noProxy || obj

    switch (destination) {
      case destinations.STATE:
        stateModificationHandler(object, actions, value, modifyTree)
        break
      case destinations.CHILDREN:
        childrenModificationHandler(object, actions, value, valueParent, modifyTree)
        break
      case destinations.NODE:
        nodeModificationHandler(object, actions, value, modifyTree)
        break
      case destinations.DEFAULT:
        defaultModificationHandler(object, actions, value, modifyTree)
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
          (object.noProxy || object)._listeners = {}
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

      if (typeof target[key] === 'function') {
        return target[key].bind(target)
      }

      return target[key]
    },
    set (target, key, value) {
      const actions = [...k, key]
      domModificator(object, actions, value, { modifyTree: true })

      object._actionsToUpdate = [...(object._actionsToUpdate || []), actions.join('.')]

      if (object._rerender) {
        clearTimeout(object._rerender)
      }

      object._rerender = setTimeout(() => {
        const _actions = object._actionsToUpdate
        object._actionsToUpdate = []
        if (object._listeners) {
          const listenersIds = Object.keys(object._listeners)
          listenersIds.forEach((id) => {
            if (object._listeners[id]) {
              const { component, keys } = object._listeners[id]
              const paramsToUpdate = Object.keys(component).reduce((acc, param) => [
                ...acc.filter(p => p !== param),
                ...(
                  param.startsWith('$') &&
                    _actions.some(_action => keys.has(`${_action} -> ${param.split('.')[0]}`)) ? [param] : []
                )
              ], [])

              clearListeners(component, paramsToUpdate)
              paramsToUpdate.forEach((param) => {
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
    if (component._isRendered) {
      return component
    }
    component._id = component._id || uuid()

    Object.keys(component).forEach((key) => {
      if (typeof component[key] === 'function') {
        component[key] = component[key].bind(new Proxy(component, handler(component)))
      }
    })

    Object.keys(component).forEach((key) => {
      if (key.startsWith('$')) {
        const pureKey = key.slice(1)
        processStack.push({ component, key })
        const value = component[key]()
        component[pureKey] = Array.isArray(value) || key !== '$children' ? value : [value]
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
          if (this._node.parentNode) {
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

  const recursivelyCreateAndRenderComponent = ({ component: obj, parent, nodeParent }) => {
    const object = (!exists(obj) || typeof obj === 'object') ? obj : { _type: 'text', textContent: obj }

    if (!exists(object)) {
      return object
    }

    if (object._isRendered) {
      Object.keys(object).forEach((key) => {
        updateDynamicProperty(object, key)
      })
    }

    const component = internallyCreateComponent(object)
    internallyRenderComponent({ component, parent, nodeParent })
    if (exists(component.children) && !component._isRendered) {
      if (!Array.isArray(component.children)) {
        component.children = [component.children]
      }
      component.children = component.children.map(child => (
        recursivelyCreateAndRenderComponent({
          component: child,
          parent: component,
          nodeParent: component._node ? component : nodeParent
        })
      ))
    }

    component._isRendered = true

    return component
  }

  const createComponent = (obj) => {
    const object = (!exists(obj) || typeof obj === 'object') ? obj : { _type: 'text', textContent: obj }

    if (!exists(object)) {
      return object
    }

    object._id = object._id || uuid()
    return new Proxy(object, handler(object))
  }

  const internallyRenderComponent = ({ component, parent, nodeParent }) => {
    const pureComponent = component && (component.noProxy || component)

    if (pureComponent) {
      if (pureComponent._type) {
        pureComponent._node = pureComponent._node || (
            pureComponent._type === 'text'
              ? document.createTextNode(pureComponent.textContent)
              : createElement(pureComponent)
          )
      }

      pureComponent._parent = parent.noProxy || parent

      if (nodeParent && pureComponent._node) {
        nodeParent._node.appendChild(pureComponent._node)
      }
    }
  }

  const componentToNodeArray = (component, next) => {
    const pureComponent = component && (component.noProxy || component)

    if (exists(pureComponent)) {
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
