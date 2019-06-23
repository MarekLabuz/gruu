const Gruu = ((function () {
  const exists = value => value != null && value !== false
  let lastId = 1
  const genId = () => {
    lastId += 1
    return lastId
  }
  const isManualAttribute = v => v.startsWith('aria') || v === 'role'
  const camelToKebab = s => s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  const last = v => v[v.length - 1]
  const noProxy = v => (v && v.noProxy) || v
  const get = (object, actions) => actions.reduce((acc, key) => acc[key], object)
  const findClosestNodeParent = object => (object._n ? object : findClosestNodeParent(object._parent))
  const bindWithProxy = (component, fn = () => null) => (
    component.noProxy ? component : fn.bind(new Proxy(component, handler(component)))
  )

  const everyEqual = (a, b) => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  }

  const parseTextComponent = (v) => {
    const vNoProxy = noProxy(v)
    return (!exists(vNoProxy) || typeof vNoProxy === 'object' ? vNoProxy : { _type: 'text', textContent: vNoProxy })
  }

  const removeUndefined = (children) => {
    let i = children.length - 1
    while (i >= 0 && !children[i]) {
      children.splice(i, 1)
      i -= 1
    }
  }

  const clearListeners = (component, paramsTuRemove) => {
    if (component._r && component._w) {
      component._id = component._id || genId()
      Object.keys(component._w).forEach((w) => {
        if (paramsTuRemove) {
          const set = component._w[w]._l[component._id].keys
          set.forEach((key) => {
            const param = key.split('->')[1].trim()
            if (paramsTuRemove.includes(param)) {
              set.delete(key)
            }
          })
          if (set.size === 0) {
            delete component._w[w]._l[component._id]
            delete component._w[w]
          }
        } else {
          delete component._w[w]._l[component._id]
          delete component._w[w]
        }
      })
    }
  }

  const updateDynamicProperty = (component, key, value) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      processStack.push({ component, key })
      const val = bindWithProxy(component, value || component[key])()
      processStack.pop()
      const oldValue = component[pureKey]
      const v = domModificator(val, oldValue, component, [pureKey])
      component[pureKey] = v
    }
  }

  const overrideDynamicProperty = (component, key) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      processStack.push({ component, key })
      const result = bindWithProxy(component, component[key])()
      const v = Array.isArray(result) || key !== '$children' ? result : [result]
      component[pureKey] = pureKey === 'children' ? v.map(parseTextComponent) : v
      processStack.pop()
    }
  }

  const handleComponentRender = (value, target, object, action, parent) => {
    const component = recursivelyCreateAndRenderComponent(value, parent)
    component._parent = parent
    value = component

    const componentNodeArray = componentToNodeArray(component)
    const nodeParent = findClosestNodeParent(object)

    if (
      (nodeParent === object || (nodeParent.children.length === 1 && nodeParent.children[0] === object))
      && parseInt(action, 10) > object.children.length - 1
    ) {
      componentNodeArray.forEach(({ node }) => {
        if (node) {
          nodeParent._n.appendChild(node)
        }
      })
    } else {
      object.children[action] = component
      const nodeParentArray = componentToNodeArray(nodeParent, true)
      object.children[action] = target

      const lastItem = last(componentNodeArray)
      if (lastItem) {
        const index = nodeParentArray.findIndex(({ id }) => id === lastItem.id)
        const item = index !== -1
          ? nodeParentArray.slice(index + 1).find(v => v && v.node && v.node.parentNode)
          : null
        componentNodeArray.forEach(({ node }) => {
          if (node) {
            nodeParent._n.insertBefore(node, item && item.node)
          }
        })
      }
    }

    if (target) {
      target._unmount()
    }

    return value
  }

  const childrenModificationHandler = (value, target, object, actions, parent) => {
    const action = actions[1]

    if (action === undefined) {
      if (!object.children) {
        object.children = []
      }

      value = (Array.isArray(value) ? value : [value]).map(parseTextComponent)

      const length = target.length - value.length
      const val = value.concat(Array(length < 0 ? 0 : length))

      for (let i = 0; i < val.length;) {
        const currentChild = target[i]
        const newChild = val[i]
        if (value.length >= target.length ||
          (!currentChild || !newChild || !currentChild._key || !newChild._key || currentChild._key === newChild._key)
        ) {
          value[i] = domModificator(newChild, currentChild, object, ['children', `${i}`], { dest: CHILDREN, parent })
          i += 1
        } else {
          currentChild._unmount()
          target.splice(i, 1)
        }
      }

      removeUndefined(value)
    } else if (!isNaN(parseInt(action, 10))) {
      if (
        target !== value &&
        (
          !target || !value || (!target._createdBy && !value._createdBy) ||
          !everyEqual(target._createdBy, value._createdBy)
        )
      ) {
        const targetExists = exists(target)
        const valueExists = exists(value)
        if (targetExists && !valueExists) {
          target._unmount()
        } else if (targetExists && valueExists) {
          clearListeners(target)
          if ((target._type || value._type) && (!target._type || !value._type || target._type !== value._type) &&
            (target._type !== 'text' || typeof value === 'object')) {
            value = handleComponentRender(value, target, object, action, parent)
          } else {
            const component = parseTextComponent(value)

            component._parent = parent

            if (component.children && Array.isArray(component.children)) {
              component.children = component.children.map(noProxy)
            }

            const keys = { $: [], other: [] }

            Object.keys(Object.assign({}, target, component)).forEach((key) => {
              if (target[key] !== component[key]) {
                if (key.startsWith('$')) {
                  keys.$.push(key)
                  keys.other.push(key.slice(1))
                } else if (key.startsWith('_')) {
                  if (!['_createdBy', '_key', '_parent'].includes(key)) {
                    component[key] = target[key]
                  }
                } else {
                  keys.other.push(key)
                }
              }
            })

            keys.$.forEach((key) => {
              overrideDynamicProperty(component, key)
            })

            keys.other.forEach((key) => {
              if (typeof component[key] === 'function') {
                component[key] = bindWithProxy(component, component[key])
              }
              component[key] = domModificator(component[key], target[key], target, [key], { parent: component })
            })

            value = component
          }
        } else if (!targetExists && valueExists) {
          value = handleComponentRender(value, target, object, action, parent)
        }
      } else {
        value = target
      }
    }

    return value
  }

  const nodeModificationHandler = (object, actions, value, target) => {
    if (value == null) {
      const action = actions[0]

      object._n[action] = ''
      if (object._n.removeAttribute) {
        if (isManualAttribute(action)) {
          object._n.removeAttribute(camelToKebab(action))
        } else {
          object._n.removeAttribute(action)
        }
      }
    } else if (value && typeof value === 'object') {
      const action = actions[0]
      const mergedValue = Object.assign({}, target, value)
      if (object._n) {
        Object.keys(mergedValue).forEach((key) => {
          if (!target || target[key] !== value[key]) {
            object._n[action][key] = value[key] || ''
          }
        })
      }
    } else if (object._n && target !== value) {
      const t = get(object._n, actions.slice(0, -1))
      const action = last(actions)
      if (isManualAttribute(action)) {
        t.setAttribute(camelToKebab(action), value)
      } else {
        t[action] = value
      }
    }

    return value
  }

  const DEFAULT = 0
  const STATE = 1
  const CHILDREN = 2
  const NODE = 3

  const findDestination = (actions = []) => {
    let destination = ''
    let isNode = true

    for (const action of actions) {
      if (destination === DEFAULT || action.startsWith('$')) {
        return DEFAULT
      } else if (destination === STATE || (action === 'state' && isNode)) {
        return STATE
      } else if (action === 'children' && isNode) {
        destination = CHILDREN
        isNode = false
      } else if (destination === CHILDREN && !isNaN(parseInt(action, 10))) {
        destination = CHILDREN
        isNode = true
      } else if (isNode) {
        destination = NODE
        isNode = true
      }
    }
    return destination
  }

  const domModificator = (val, oldValue, obj, actions, { dest, parent = obj } = {}) => {
    const destination = dest || findDestination(actions)

    const object = noProxy(obj)
    const value = noProxy(val)

    switch (destination) {
      case CHILDREN:
        return childrenModificationHandler(value, oldValue, object, actions, parent)
      case NODE:
        return nodeModificationHandler(object, actions, value, oldValue)
      default:
        return val
    }
  }

  const getHandler = (object, k, target, key) => {
    if (key === 'noProxy') {
      return target
    }

    if (typeof key === 'string' && key.startsWith('_')) {
      return target[key]
    }

    const { component: stackElement, key: stackKey } = last(processStack) || {}
    if (stackElement) {
      const objectNoProxy = noProxy(object)
      const stackElementNoProxy = noProxy(stackElement)

      if (!objectNoProxy._l) {
        objectNoProxy._l = {}
      }

      const newKey = [...k, key].join('.')

      stackElementNoProxy._id = stackElementNoProxy._id || genId()

      if (!objectNoProxy._l[stackElementNoProxy._id]) {
        objectNoProxy._l[stackElementNoProxy._id] = {
          keys: new Set()
        }
      }
      objectNoProxy._l[stackElementNoProxy._id].component = stackElementNoProxy
      objectNoProxy._l[stackElementNoProxy._id].keys.add(`${newKey} -> ${stackKey}`)

      if (!stackElementNoProxy._w) {
        stackElementNoProxy._w = {}
      }

      objectNoProxy._id = objectNoProxy._id || genId()
      stackElementNoProxy._w[objectNoProxy._id] = objectNoProxy
    }

    const isType = target[key] && (target[key]._type || target[key].children)
    const component = isType ? target[key] : object

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(noProxy(target[key]), handler(component, ...(isType ? [] : [...k, key])))
    }

    if (typeof target[key] === 'function') {
      return target[key].bind(target)
    }

    return target[key]
  }

  const lastComponent = (v, actions) => {
    let curr = v
    let c = v
    let i = 0
    let mode = NODE

    for (let j = 0; j < actions.length; j += 1) {
      const action = actions[j]
      curr = curr[action]

      if (mode === NODE && action === CHILDREN) {
        mode = CHILDREN
      } else if (mode === NODE && action === STATE) {
        return { c, i: j }
      } else if (mode === CHILDREN && !isNaN(parseInt(action, 10))) {
        c = curr
        i = j
        mode = NODE
      }
    }

    return { c, i }
  }

  const setHandler = (object, k, target, key, value) => {
    const actions = [...k, key]
    const { c, i } = lastComponent(object, actions)
    const oldValue = target[key]
    const val = noProxy(value)
    const v = domModificator(val, oldValue, c, actions.slice(i))
    target[key] = v

    object._actionsToUpdate = [...(object._actionsToUpdate || []), actions.join('.')]

    clearTimeout(object._rerender)
    object._rerender = setTimeout(() => {
      const _actions = object._actionsToUpdate
      object._actionsToUpdate = []
      if (object._l) {
        const listenersIds = Object.keys(object._l)
        listenersIds.forEach((id) => {
          if (object._l[id]) {
            const { component, keys } = object._l[id]
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

  const handler = (object, ...k) => ({
    get: (target, key) => getHandler(object, k, target, key),
    set: (target, key, value) => setHandler(object, k, target, key, value)
  })

  const createElement = (component) => {
    const node = document.createElement(component._type)
    Object.keys(component).forEach((key) => {
      if (key.startsWith('_') || key.startsWith('$')) {
        return
      }
      if (isManualAttribute(key)) {
        node.setAttribute(camelToKebab(key), component[key])
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
    const component = noProxy(object)
    if (component._r) {
      return component
    }

    Object.keys(component).forEach((key) => {
      if (typeof component[key] === 'function' && !key.startsWith('$')) {
        component[key] = bindWithProxy(component, component[key])
      }
      overrideDynamicProperty(component, key)
    })

    if (component.children && Array.isArray(component.children)) {
      component.children = component.children.map(noProxy)
    }

    component._unmount = function () {
      clearListeners(this)
      if (this._r) {
        if (this._n) {
          const nodeParent = findClosestNodeParent(this._parent)
          if (this._n.parentNode) {
            nodeParent._n.removeChild(this._n)
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

  const restoreListeners = (object) => {
    if (object._r) {
      Object.keys(object).forEach((key) => {
        updateDynamicProperty(object, key)
      })
      if (!object._n && object.children) {
        object.children.forEach(restoreListeners)
      }
    }
  }

  const recursivelyCreateAndRenderComponent = (obj, parent, nodeParent) => {
    const object = parseTextComponent(obj)

    if (!exists(object)) {
      return object
    }

    restoreListeners(object)

    const component = internallyCreateComponent(object)
    internallyRenderComponent(component, parent, nodeParent)
    if (exists(component.children) && !component._r) {
      if (!Array.isArray(component.children)) {
        component.children = [component.children]
      }
      component.children = component.children.map(child => (
        recursivelyCreateAndRenderComponent(child, component, component._n ? component : nodeParent)
      ))
    }

    component._r = true

    return component
  }

  const createComponent = (obj) => {
    const object = parseTextComponent(obj)

    if (!exists(object)) {
      return object
    }

    return new Proxy(object, handler(object))
  }

  const internallyRenderComponent = (component, parent, nodeParent) => {
    const pureComponent = noProxy(component)

    if (pureComponent) {
      if (pureComponent._type) {
        pureComponent._n = pureComponent._n || (
            pureComponent._type === 'text'
              ? document.createTextNode(pureComponent.textContent)
              : createElement(pureComponent)
          )
      }

      pureComponent._parent = noProxy(parent)

      if (nodeParent && pureComponent._n) {
        nodeParent._n.appendChild(pureComponent._n)
      }
    }
  }

  const componentToNodeArray = (component, next) => {
    const pureComponent = noProxy(component)

    if (exists(pureComponent)) {
      pureComponent._id = pureComponent._id || genId()
      if (pureComponent._n && !next) {
        return [{ id: pureComponent._id, node: pureComponent._n }]
      }

      if (pureComponent.children) {
        return pureComponent.children.reduce((acc, child) =>
            acc.concat(child ? componentToNodeArray(child) : [{ id: pureComponent._id }]),
          []
        )
      }
    }
    return []
  }

  const renderApp = (root, children) => {
    const component = noProxy(createComponent({ children }))
    const parent = { _n: root, children: [component] }
    recursivelyCreateAndRenderComponent(component, parent, parent)
  }

  return Object.assign(
    { createComponent, renderApp },
    window.__DEV__ ? { destinations: { DEFAULT, STATE, CHILDREN, NODE }, findDestination } : {}
  )
})())

if (typeof module !== 'undefined') {
  module.exports = Gruu
}
