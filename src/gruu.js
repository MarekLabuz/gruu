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

const childrenModificationHandler = ({ object, actions, value }) => {
  const lastIndexChildren = actions.lastIndexOf('children')
  const action = actions.slice(lastIndexChildren + 1)[0]

  if (action === undefined) {
    const length = object.children.length - value.length
    value.concat(Array(length < 0 ? 0 : length).fill(null)).forEach((newChild, i) => {
      domModificator2({ object, actions: [...actions, `${i}`], value: newChild })
    })
  } else if (!isNaN(parseInt(action, 10))) {
    const target = get(object, actions)
    if (target && !value) {
      target._unmount()
      object.children[action] = value
    } else if (target && value) {
      if (value._isRendered && value._watchers) {
        Object.keys(value._watchers).forEach((w) => {
          Object.keys(value._watchers[w]._listeners).forEach((l) => {
            if (l === value._id) {
              delete value._watchers[w]._listeners[l]
            }
          })
        })
      }
      if (!target._type || !value._type || target._type !== value._type) {
        const component = value._isRendered ? (value.noProxy || value) : recursivelyCreateComponent({ object: value })
        target._unmount()
        recursivelyRenderComponent({ component, parent: target._parent })
        const nodeArray = componentToNodeArray(component)

        let index = parseInt(action, 10) + 1
        for (let i = index; i < target._parent.children.length; i += 1) {
          if (target._parent.children[i] && target._parent.children[i]._node) {
            index = i
            break
          }
        }

        nodeArray.forEach((node) => {
          target._parent._node
            .insertBefore(node, target._parent.children[index] && target._parent.children[index]._node)
        })

        target._parent.children[action] = component
      } else {
        const component = value._isRendered ? (value.noProxy || value) : recursivelyCreateComponent({ object: value })
        recursivelyRenderComponent({ component, parent: target._parent })

        Object.keys(component).forEach((key) => {
          domModificator2({ object: target, actions: [key], value: component[key] })
        })
      }
    } else if (!target && value) {
      const component = recursivelyCreateComponent({ object: value })
      recursivelyRenderComponent({ component, parent: object })

      let index = parseInt(action, 10) + 1
      for (let i = index; i < object.children.length; i += 1) {
        if (object.children[i]) {
          index = i
          break
        }
      }

      object._node.insertBefore(component._node, object.children[index] && object.children[index]._node)
      object.children[action] = component
    }
  }
}

const nodeModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 1) {
    const action = actions[0]
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
  } else {
    const lastAction = actions.slice(-1)[0]
    const { v: val, n: node } = actions
      .slice(0, -1)
      .reduce(({ v, n }, key) => ({ v: v[key], n: n[key] }), { v: object, n: object._node })

    val[lastAction] = value
    node[lastAction] = value
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

const domModificator2 = ({ object: obj, actions, value }) => {
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

    const lastElement = processStack.slice(-1)[0]
    if (lastElement && lastElement._id !== object._id) {
      if (!object._listeners) {
        object._listeners = {}
      }
      object._listeners[lastElement._id] = lastElement

      if (!lastElement._watchers) {
        lastElement._watchers = {}
      }
      lastElement._watchers[object._id] = object
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

      if (object._listeners) {
        const listenersIds = Object.keys(object._listeners)
        listenersIds.forEach((id) => {
          Object.keys(object._listeners[id]).forEach((param) => {
            if (param.startsWith('$')) {
              const pureKey = param.slice(1)
              domModificator2({
                object: object._listeners[id],
                actions: [pureKey],
                value: object._listeners[id][param]()
              })
            }
          })
        })
      }
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

const processStack = []

const recursivelyCreateComponent = ({ object }) => {
  if (!object) {
    return object
  }

  if (object._isRendered) {
    const obj = object.noProxy || object
    // obj._parent = parent
    return obj
  }

  const component = Object.assign({}, object)
  component._id = guid()
  // component._parent = parent

  Object.keys(component).forEach((key) => {
    component[key] = typeof component[key] === 'function'
      ? component[key].bind(new Proxy(component, handler(component)))
      : component[key]
  })

  processStack.push(component)
  Object.keys(component).forEach((key) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      component[pureKey] = component[key]()
    }
  })
  // console.log(processStack)
  processStack.pop()

  if (component._type) {
    component._node = component._type === 'text'
      ? document.createTextNode(component.textContent)
      : createElement2(component)
  }

  if (component.children && Array.isArray(component.children)) {
    component.children = component.children.map(child => recursivelyCreateComponent({
      object: child,
      // parent: component._type ? component : parent
    }))
  }

  component._isRendered = true

  component._unmount = () => {
    if (component._node) {
      component._parent._node.removeChild(component._node)
    } else {
      component.children.forEach((child) => {
        child._unmount()
      })
    }
  }

  // if (watchers) {
  //   watchers.forEach((watcher) => {
  //     if (!watcher._listeners) {
  //       watcher.noProxy._listeners = {}
  //     }
  //     watcher.noProxy._listeners[component._id] = component
  //   })
  // }

  return component
}

const createComponent = (object) => {
  const component = recursivelyCreateComponent({ object })
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
          parent: pureComponent._type ? pureComponent : pureComponent._parent,
          attach: attach || a
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

const componentToNodeArray = (component) => {
  const pureComponent = component && (component.noProxy || component)

  if (pureComponent) {
    if (pureComponent._node) {
      return [pureComponent._node]
    }

    if (pureComponent.children) {
      return pureComponent.children.reduce((acc, child) => acc.concat(componentToNodeArray(child)), [])
    }
  }
  return []
}

const renderApp = (root, children) => {
  const component = createComponent({ _type: 'div', children })
  component.noProxy._parent = { _node: root }
  recursivelyRenderComponent({ component, parent: { _node: root } })
  attachComponent(component)
}

// ---------------------------------------------------------------------------------------------------------------------
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

if (window.__DEV__) {
  module.exports = {
    createComponent,
    renderApp,
    // browserHistory,
    // route
  }
}
