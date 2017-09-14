const Gruu = ((function () {
  const exists = value => value != null && value !== false
  let lastId = 1
  const genId = () => {
    lastId += 1
    return lastId
  }
  const last = v => v[v.length - 1]

  // const stateModificationHandler = (object, actions, value, modifyTree) => {
  //   if (modifyTree) {
  //     if (actions.length === 0) {
  //       object.state = value
  //     } else {
  //       const lastAction = last(actions)
  //       const v = actions.slice(0, -1).reduce((acc, key) => acc[key], object)
  //       v[lastAction] = value
  //     }
  //   }
  // }

  const noProxy = v => (v && v.noProxy) || v

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
      const val = bindWithProxy(component, value || component[key])()
      const oldValue = component[pureKey]
      component[pureKey] = val
      domModificator(component, [pureKey], val, oldValue)
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

  const handleComponentRender = (object, value, target, action, overriddenChildren) => {
    // let component = value.noProxy || value

    const component = recursivelyCreateAndRenderComponent(value, object)
    object.children[action] = component
    component._parent = object

    const componentNodeArray = componentToNodeArray(component)
    const nodeParent = findClosestNodeParent(object)

    // if (modifyTree) {
    //   preTarget.children[action] = component
    //   if (target) {
    //     target._parent.children[action] = component
    //   }
    // } else if (valueParent) {
    //   valueParent.children[action] = component
    // }

    // console.log(overriddenChildren, action, newChildren)

    if (!overriddenChildren || parseInt(action, 10) > object.children.length - 1) {
      componentNodeArray.forEach(({ node }) => {
        if (node) {
          nodeParent._n.appendChild(node)
        }
      })
    } else {
      // debugger

      const newChildren = [
        ...overriddenChildren.slice(0, action),
        component,
        ...overriddenChildren.slice(parseInt(action, 10) + 1)
      ]

      const parentNodeArray = newChildren.reduce((acc, curr) => acc.concat(componentToNodeArray(curr)), [])
      // const ttt = componentToNodeArray(target || object.children[parseInt(action, 10) + 1])[0]
      const lastItem = last(componentNodeArray)
      if (lastItem) {
        // console.log(parentNodeArray)
        const index = parentNodeArray.findIndex(({ id }) => id === lastItem.id)
        const item = index !== -1
          ? parentNodeArray.slice(index + 1).find(v => v && v.node && v.node.parentNode)
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
    const vNoProxy = noProxy(v)
    return (!exists(vNoProxy) || typeof vNoProxy === 'object' ? vNoProxy : { _type: 'text', textContent: vNoProxy })
  }

  const childrenModificationHandler = (object, actions, value, target, overriddenChildren) => {
    const lastIndexChildren = actions.lastIndexOf('children')
    const action = actions.slice(lastIndexChildren + 1)[0]

    // const target = get(object, actions)

    if (action === undefined) {
      // let preTarget = get(object, actions.slice(0, -1))
      // preTarget = preTarget.noProxy || preTarget

      if (!object.children) {
        object.children = []
      }

      const valueArray = (Array.isArray(value) ? value : [value]).map(parseTextComponent)
      object.children = valueArray


      // if (valueParent) {
      //   valueParent.children = valueArray
      // }
      const length = target.length - valueArray.length
      const val = valueArray.concat(Array(length < 0 ? 0 : length))

      // console.log({ val })

      // return

      let i
      for (i = 0; i < val.length;) {
        const currentChild = target[i]
        const newChild = val[i]

        // console.log({ currentChild, newChild })
        // return

        if (valueArray.length >= target.length ||
          (!currentChild || !newChild || !currentChild._key || !newChild._key || currentChild._key === newChild._key)
        ) {
          domModificator(object, ['children', `${i}`], newChild, currentChild, {
            dest: CHILDREN,
            overriddenChildren: target
          })
          i += 1
        } else {
          currentChild._unmount()
          object.children.splice(i, 1)
        }
      }
    } else if (!isNaN(parseInt(action, 10))) {
      // const valueNoProxy = (value && value.noProxy) || value

      if (
        target !== value &&
        (
          !target || !value || (!target._createdBy && !value._createdBy) ||
          !everyEqual(target._createdBy, value._createdBy)
        )
      ) {
        // const preTarget = get(object, actions.slice(0, -2))
        if (exists(target) && !exists(value)) {
          // console.log({ target, value })
          target._unmount()
          // return
          // if (modifyTree) {
          //   preTarget.children[action] = value
          //   target._parent.children[action] = value
          //   let i = target._parent.children.length - 1
          //   while (i > 0 && !target._parent.children[i]) {
          //     target._parent.children.splice(i, 1)
          //     i -= 1
          //   }
          // }
        } else if (exists(target) && exists(value)) {
          clearListeners(target)
          if ((target._type || value._type) && (!target._type || !value._type || target._type !== value._type) &&
            (target._type !== 'text' || typeof value === 'object')) {
            handleComponentRender(object, value, target, action, overriddenChildren)
          } else {
            const component = parseTextComponent(value)
            object.children[action] = component
            component._parent = object

            // debugger

            // const val = parseTextComponent(valueNoProxy)
            // const component = val
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
            // console.log({ object, actions, value, target, component, keys })

            keys.other.forEach((key) => {
              if (typeof component[key] === 'function') {
                component[key] = bindWithProxy(component, component[key])
              }
              domModificator(component, [key], component[key], target[key])
            })

            // console.log(component)
            // return
            //
            // if (valueParent) {
            //   component._parent = valueParent
            // }
            //
            // keys.$.forEach((key) => {
            //   overrideDynamicProperty(component, key)
            // })
            //
            // keys.other.forEach((key) => {
            //   if (typeof component[key] === 'function') {
            //     component[key] = bindWithProxy(component, component[key])
            //   }
            //   domModificator(component, [key], component[key], target[key], { valueParent: component })
            // })
            //
            // if (modifyTree) {
            //   target._parent.children[action] = component
            //   preTarget.children[action] = component
            // }
          }
        } else if (!exists(target) && exists(value)) {
          handleComponentRender(object, value, target, action, overriddenChildren)
        }
      }
    }
  }

  const nodeModificationHandler = (object, actions, value, target) => {
    if (value == null) {
      const action = actions[0]

      // console.log({ object, actions, value, target }, object._n, action)
      // debugger
      object._n[action] = ''
      if (object._n.removeAttribute) {
        object._n.removeAttribute(action)
      }
    } else if (value && typeof value === 'object') {
      const action = actions[0]
      const mergedValue = Object.assign({}, target, value)
      if (object._n) {
        Object.keys(mergedValue).forEach((key) => {
          if (target[key] !== value[key]) {
            object._n[action][key] = value[key] || ''
          }
        })
      }
    } else if (object._n && target !== value) {
      const t = get(object._n, actions.slice(0, -1))
      const action = last(actions)
      t[action] = value
    }
  }

    // return
    //
    // const lastIndexChildren = actions.lastIndexOf('style')
    // const action = actions.slice(lastIndexChildren + 1)[0]
    //
    // if (lastIndexChildren !== -1) {
    //   if (action === undefined) {
    //     const target = get(object, actions.slice(0, lastIndexChildren))
    //
    //     console.log(target)
    //     if (!exists(value)) {
    //       target._n.removeAttribute('style')
    //       if (modifyTree) {
    //         target.style = value
    //       }
    //     } else {
    //       const newStyle = Object.assign({}, target.style, value)
    //       if (!target.style) {
    //         target.style = {}
    //       }
    //       Object.keys(newStyle).forEach((key) => {
    //         if (target.style[key] !== value[key]) {
    //           target._n.style[key] = value[key] || ''
    //           if (modifyTree) {
    //             target.style[key] = value[key]
    //           }
    //         }
    //       })
    //     }
    //   } else {
    //     const target = get(object, actions.slice(0, -2))
    //     target._n.style[action] = value
    //     if (modifyTree) {
    //       if (!target.style) {
    //         target.style = {}
    //       }
    //       target.style[action] = value
    //     }
    //   }
    // } else {
    //   const target = get(object, actions.slice(0, -1))
    //   const lastAction = last(actions)
    //
    //   if (target._n && target._n[lastAction] !== value) {
    //     target._n[lastAction] = value
    //   }
    //
    //   if (target[lastAction] !== value) {
    //     if (modifyTree) {
    //       target[lastAction] = value
    //     }
    //     if (target._n) {
    //       target._n[lastAction] = exists(value) ? value : ''
    //     }
    //   }
    // }

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

  // const defaultModificationHandler = (object, actions, value, modifyTree) => {
  //   const target = get(object, actions.slice(0, -1))
  //   const action = last(actions)
  //   if (modifyTree) {
  //     target[action] = value
  //   }
  // }

  const domModificator = (obj, actions, val, oldValue, { dest, overriddenChildren = oldValue } = {}) => {
    const destination = dest || findDestination(actions)

    const object = noProxy(obj)
    const value = noProxy(val)

    // debugger

    switch (destination) {
      case STATE:
        // stateModificationHandler(object, actions, value)
        break
      case CHILDREN:
        childrenModificationHandler(object, actions, value, oldValue, overriddenChildren)
        break
      case NODE:
        nodeModificationHandler(object, actions, value, oldValue)
        break
      case DEFAULT:
        // defaultModificationHandler(object, actions, value)
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

  const handler = (object, ...k) => ({
    get: getHandler(object, k),
    set (target, key, value) {
      const actions = [...k, key]
      const { c, i } = lastComponent(object, actions)
      const oldValue = target[key]
      const val = noProxy(value)
      target[key] = val

      // console.log({ object, target, actions, value })
      // console.log(oldValue)
      domModificator(c, actions.slice(i), val, oldValue)


      object._actionsToUpdate = [...(object._actionsToUpdate || []), actions.join('.')]

      // console.log({ target, key, val, object })

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
    const component = noProxy(object)
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
