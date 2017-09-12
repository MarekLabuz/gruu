const Gruu = ((function () {
  const exists = value => value != null && value !== false
  let lastId = 1
  const genId = () => {
    lastId += 1
    return lastId
  }
  const last = v => v[v.length - 1]

  const stateModificationHandler = (object, actions, value, modifyTree) => {
    if (modifyTree) {
      if (actions.length === 0) {
        object.state = value
      } else {
        const lastAction = last(actions)
        const v = actions.slice(0, -1).reduce((acc, key) => acc[key], object)
        v[lastAction] = value
      }
    }
  }

  const get = (object, actions) => actions.reduce((acc, key) => acc[key], object)

  const findClosestNodeParent = object => (object._n ? object : findClosestNodeParent(object._parent))

  const bindWithProxy = (component, fn = () => null) => (
    component.noProxy ? component : fn.bind(new Proxy(component, handler(component)))
  )

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
      domModificator(
        component,
        [pureKey],
        value ? bindWithProxy(component, value)() : bindWithProxy(component, component[key])(),
        { modifyTree: true }
      )
      processStack.pop()
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

  const handleComponentRender = (value, target, preTarget, modifyTree, action, valueParent) => {
    let component = value.noProxy || value
    component = recursivelyCreateAndRenderComponent(component, preTarget)

    if (target) {
      target._unmount()
    }

    if (modifyTree) {
      preTarget.children[action] = component
      if (target) {
        target._parent.children[action] = component
      }
    } else if (valueParent) {
      valueParent.children[action] = component
    }

    const componentNodeArray = componentToNodeArray(component)
    const nodeParent = findClosestNodeParent(preTarget)

    if (parseInt(action, 10) >= preTarget.children.length - 1) {
      componentNodeArray.forEach(({ node }) => {
        if (node) {
          nodeParent._n.appendChild(node)
        }
      })
    } else {
      const parentNodeArray = componentToNodeArray(nodeParent, true)
      const lastItem = last(componentNodeArray)
      if (lastItem) {
        const index = parentNodeArray.findIndex(({ id }) => id === lastItem.id)
        const item = index !== -1 ? parentNodeArray.slice(index + 1).find(v => v && v.node && v.node.parentNode) : null
        componentNodeArray.forEach(({ node }) => {
          if (node) {
            nodeParent._n.insertBefore(node, item && item.node)
          }
        })
      }
    }
  }

  const everyEqual = (a, b) => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  }

  const parseTextComponent = (v) => {
    const vNoProxy = (v && v.noProxy) || v
    return (!exists(vNoProxy) || typeof vNoProxy === 'object' ? vNoProxy : { _type: 'text', textContent: vNoProxy })
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

      const valueArray = (Array.isArray(value) ? value : [value]).map(parseTextComponent)
      if (valueParent) {
        valueParent.children = valueArray
      }
      const length = preTarget.children.length - valueArray.length
      const val = valueArray.concat(Array(length < 0 ? 0 : length))

      let i
      for (i = 0; i < val.length;) {
        const currentChild = preTarget.children[i]
        const newChild = val[i]

        if (valueArray.length >= preTarget.children.length ||
          (!currentChild || !newChild || !currentChild._key || !newChild._key || currentChild._key === newChild._key)
        ) {
          domModificator(preTarget, ['children', `${i}`], newChild, { valueParent, modifyTree, dest: CHILDREN })
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
      const valueNoProxy = (value && value.noProxy) || value
      if (
        target !== valueNoProxy && (!target || !valueNoProxy || (!target._createdBy && !valueNoProxy._createdBy) ||
        !everyEqual(target._createdBy, valueNoProxy._createdBy))
      ) {
        const preTarget = get(object, actions.slice(0, -2))
        if (exists(target) && !exists(value)) {
          target._unmount()
          if (modifyTree) {
            preTarget.children[action] = value
            target._parent.children[action] = value
            let i = target._parent.children.length - 1
            while (i > 0 && !target._parent.children[i]) {
              target._parent.children.splice(i, 1)
              i -= 1
            }
          }
        } else if (exists(target) && exists(value)) {
          clearListeners(target)
          if ((target._type || value._type) && (!target._type || !value._type || target._type !== value._type) &&
            (target._type !== 'text' || typeof value === 'object')) {
            handleComponentRender(value, target, preTarget, modifyTree, action, valueParent)
          } else {
            const val = parseTextComponent(valueNoProxy)
            const component = val
            if (component.children && Array.isArray(component.children)) {
              component.children = component.children.map(child => (child && child.noProxy) || child)
            }

            const keys = { $: [], other: [] }

            Object.keys(Object.assign({}, target, component)).forEach((key) => {
              if (target[key] !== component[key]) {
                if (key.startsWith('$')) {
                  keys.$.push(key)
                  keys.other.push(key.slice(1))
                } else if (key.startsWith('_')) {
                  if (key !== '_createdBy' && key !== '_key') {
                    component[key] = target[key]
                  }
                } else {
                  keys.other.push(key)
                }
              }
            })

            if (valueParent) {
              component._parent = valueParent
            }

            keys.$.forEach((key) => {
              overrideDynamicProperty(component, key)
            })

            keys.other.forEach((key) => {
              if (typeof component[key] === 'function') {
                component[key] = bindWithProxy(component, component[key])
              }
              domModificator(target, [key], component[key], { valueParent: component })
            })

            if (modifyTree) {
              target._parent.children[action] = component
              preTarget.children[action] = component
            }
          }
        } else if (!exists(target) && exists(value)) {
          handleComponentRender(value, target, preTarget, modifyTree, action, valueParent)
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
          target._n.removeAttribute('style')
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
              target._n.style[key] = value[key] || ''
              if (modifyTree) {
                target.style[key] = value[key]
              }
            }
          })
        }
      } else {
        const target = get(object, actions.slice(0, -2))
        target._n.style[action] = value
        if (modifyTree) {
          if (!target.style) {
            target.style = {}
          }
          target.style[action] = value
        }
      }
    } else {
      const target = get(object, actions.slice(0, -1))
      const lastAction = last(actions)

      if (target[lastAction] !== value) {
        if (modifyTree) {
          target[lastAction] = value
        }
        if (target._n) {
          target._n[lastAction] = exists(value) ? value : ''
        }
      }
    }
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

  const defaultModificationHandler = (object, actions, value, modifyTree) => {
    const target = get(object, actions.slice(0, -1))
    const action = last(actions)
    if (modifyTree) {
      target[action] = value
    }
  }

  const domModificator = (obj, actions, value, { valueParent, modifyTree, dest }) => {
    const destination = dest || findDestination(actions)

    const object = obj.noProxy || obj

    switch (destination) {
      case STATE:
        stateModificationHandler(object, actions, value, modifyTree)
        break
      case CHILDREN:
        childrenModificationHandler(object, actions, value, valueParent, modifyTree)
        break
      case NODE:
        nodeModificationHandler(object, actions, value, modifyTree)
        break
      case DEFAULT:
        defaultModificationHandler(object, actions, value, modifyTree)
        break
      default:
        break
    }
  }

  const getHandler = (object, k) => (target, key) => {
    if (key === 'noProxy') {
      return target
    }

    if (typeof key === 'string' && key.startsWith('_')) {
      return target[key]
    }

    const { component: stackElement, key: stackKey } = last(processStack) || {}
    if (stackElement) {
      const objectNoProxy = object.noProxy || object
      const stackElementNoProxy = stackElement.noProxy || stackElement

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
      return new Proxy(target[key].noProxy || target[key], handler(component, ...(isType ? [] : [...k, key])))
    }

    if (typeof target[key] === 'function') {
      return target[key].bind(target)
    }

    return target[key]
  }

  const handler = (object, ...k) => ({
    get: getHandler(object, k),
    set (target, key, value) {
      const actions = [...k, key]
      domModificator(object, actions, value, { modifyTree: true })

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
    if (component._r) {
      return component
    }

    Object.keys(component).forEach((key) => {
      if (typeof component[key] === 'function') {
        component[key] = bindWithProxy(component, component[key])
      }
    })

    Object.keys(component).forEach((key) => {
      overrideDynamicProperty(component, key)
    })

    if (component.children && Array.isArray(component.children)) {
      component.children = component.children.map(child => (child && child.noProxy) || child)
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

  const recursivelyCreateAndRenderComponent = (obj, parent, nodeParent) => {
    const object = parseTextComponent(obj)

    if (!exists(object)) {
      return object
    }

    if (object._r) {
      Object.keys(object).forEach((key) => {
        updateDynamicProperty(object, key)
      })
    }

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
    const pureComponent = component && (component.noProxy || component)

    if (pureComponent) {
      if (pureComponent._type) {
        pureComponent._n = pureComponent._n || (
            pureComponent._type === 'text'
              ? document.createTextNode(pureComponent.textContent)
              : createElement(pureComponent)
          )
      }

      pureComponent._parent = parent.noProxy || parent

      if (nodeParent && pureComponent._n) {
        nodeParent._n.appendChild(pureComponent._n)
      }
    }
  }

  const componentToNodeArray = (component, next) => {
    const pureComponent = component && (component.noProxy || component)

    if (exists(pureComponent)) {
      pureComponent._id = pureComponent._id || genId()
      if (pureComponent._n && !next) {
        return [{ id: pureComponent._id, node: pureComponent._n }]
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
