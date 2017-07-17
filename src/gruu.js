const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) // eslint-disable-line

const guid = () => `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`

const doesntExist = v => v === null || v === undefined || v === false

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

  if (key === 'length' && value < component.length) {
    for (let i = value; i < component.length; i += 1) {
      domModificator({ parent, component, key: i, value: null })
    }
  }

  if (doesntExist(value)) {
    if (component[key] && component[key].node) {
      const comp = component[key].noProxy || component[key]
      comp.node.remove()
    }
    component[key] = undefined
    return 0
  }

  if (doesntExist(component[key]) && value._type && parent && parent.node) {
    const newComponent = createComponent(value).noProxy

    if (key >= component.length) {
      recursivelyRenderComponents({ root: parent.node, children: [newComponent] })
    } else if (key < component.length) {
      let lastNode = key + 1
      for (let i = key; i < component.length; i += 1) {
        if (component[key]) {
          lastNode = key
          break
        }
      }
      recursivelyRenderComponents({ root: newComponent.node, children: newComponent.children })
      parent.node.insertBefore(newComponent.node, component[lastNode] && component[lastNode].node)
    }

    component[key] = newComponent
    return 0
  }

  // value.every(val => val && val._type)
  if (component[key] && Array.isArray(value) && key === 'children') {
    const lengthDiff = component[key].length - value.length
    const values = value.concat(Array(lengthDiff < 0 ? 0 : lengthDiff).fill(null))
    for (let i = 0; i < values.length; i += 1) {
      domModificator({ parent: component, component: component[key], key: i, value: values[i] })
    }
    return 0
  }

  if (value._type && parent && parent.node) {
    Object.keys(value).forEach((valueKey) => {
      domModificator({ parent: component, component: component[key], key: valueKey, value: value[valueKey] })
    })
    return 0
  }

  if (anyway || (component[key] !== value && typeof value !== 'function' && key !== 'length')) {
    switch (key) {
      case 'style':
        Object.keys(value).forEach((param) => {
          component.node.style[param] = value[param]
        })
        break
      case 'children':
        value.forEach((val, i) => {
          domModificator({ parent: component, component: component[key], key: i, value: val })
        })
        break
      case 'content':
        if (component.node) {
          component.node.textContent = value
        }
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

const handler = (object, parent, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler(object, target._type ? target : parent, ...k, key))
    }
    return target[key]
  },
  set (target, key, value) {
    domModificator({ component: target, key, value, parent })

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
      Object.keys(object.registered || {}).forEach(id => (object.registered || {})[id]())
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
    object._id = guid()

    if (!object) {
      return object
    }

    if (object.node) {
      object.parent = parent
      return object
    }

    const component = object
    const { _type } = component

    Object.keys(component).forEach((key) => {
      component[key] = typeof component[key] === 'function'
        ? component[key].bind(new Proxy(component, handler(component, component.parent)))
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
              const value = component[key]()
              return domModificator({
                component,
                key: newKey,
                value
              })
            }
          }
        })
        component[newKey] = key.startsWith('__') ? component[key]() : component[key]
      }
    })

    if (parent) {
      component.parent = parent
    }

    if (modifyNode && component._type) {
      component.node = _type === 'text'
        ? document.createTextNode(component.content)
        : createElement(component)
    } else {
      Object.keys(component).forEach((key) => {
        domModificator({
          parent: component.parent,
          component,
          key,
          value: component[key],
          anyway: true
        })
      })
    }

    if (component.children && Array.isArray(component.children)) {
      component.children = recursivelyCreateComponent({
        head: head || component,
        watchers,
        children: component.children,
        // parent: component,
        parent: component._type ? component : parent
      })
    }

    return component
  })
}

// ---------------------------------------------------------------------------------------------------------------------
const stateModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 0) {
    object.state = value
  } else {
    const [action, ...rest] = actions
    const v = rest.reduce((acc, key) => acc[key], object.state)
    v[action] = value
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
      object.children[actions[0]] = value
    } else if (target && value) {
      if (!target._type || !value._type) {
        const component = recursivelyCreateComponent2({ object: value })
        target._unmount()
        Object.keys(target).forEach((k) => {
          if (k !== '_parent') {
            delete target[k]
          }
        })
        Object.keys(component).forEach((k) => {
          target[k] = component[k]
        })
        recursivelyRenderComponent({ component: target, parent: target._parent })
      } else {
        const component = recursivelyCreateComponent2({ object: value })
        recursivelyRenderComponent({ component, attach: false })

        Object.keys(component).forEach((key) => {
          domModificator2({ object: target, actions: [key], value: component[key] })
        })
      }
    } else if (!target && value) {
      const component = recursivelyCreateComponent2({ object: value })
      recursivelyRenderComponent({ component, parent: object, attach: false })

      let index = parseInt(actions[0], 10) + 1
      for (let i = index; i < object.children.length; i += 1) {
        if (object.children[i]) {
          index = i
          break
        }
      }

      object._node.insertBefore(component._node, object.children[index] && object.children[index]._node)
      object.children[actions[0]] = component
    }
  }
}

const nodeModificationHandler = ({ object, actions, value }) => {
  if (actions.length === 1) {
    object._node[actions[0]] = value
    object[actions[0]] = value
  } else {
    // TODO: style
    const headActions = actions.slice(0, -1)
    const tail = actions.slice(-1)
    const v = get(object._node, headActions)
    v[tail] = value
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
  let result = { destination: destinations.DEFAULT, isNode: true }
  for (const action of actions) {
    if (result.destination === destinations.NONE || action.startsWith('_') || action.startsWith('$')) {
      return destinations.NONE
    } if (result.destination === destinations.STATE || (action === 'state' && result.isNode)) {
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

const domModificator2 = ({ object: obj, actions, value }) => {
  const destination = findDestination(actions)

  const object = obj.noProxy || obj
  // console.log({ destination, actions, object })

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
    default:
      break
  }
}

const handler2 = (object, ...k) => ({
  get (target, key) {
    if (key === 'noProxy') {
      return target
    }

    if (typeof key === 'string' && key.startsWith('_')) {
      return target[key]
    }

    const isType = target[key] && target[key]._type
    const component = isType ? target[key] : object

    if (target[key] && typeof target[key] === 'object') {
      return new Proxy(target[key], handler2(component, ...(isType ? [] : [...k, key])))
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
      // Object.keys(object.registered || {}).forEach(id => (object.registered || {})[id]())
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

const recursivelyCreateComponent2 = ({ object /* , parent */ }) => {
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
      ? component[key].bind(new Proxy(component, handler2(component)))
      : component[key]
  })

  Object.keys(component).forEach((key) => {
    if (key.startsWith('$')) {
      const pureKey = key.slice(1)
      component[pureKey] = component[key]()
    }
  })

  if (component._type) {
    component._node = component._type === 'text'
      ? document.createTextNode(component.textContent)
      : createElement2(component)
  }

  if (component.children && Array.isArray(component.children)) {
    component.children = component.children.map(child => recursivelyCreateComponent2({
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

  return component
}

const createComponent = (object, ...watchers) => {
  const component = recursivelyCreateComponent2({ object, watchers })
  return new Proxy(component, handler2(component))
}

const recursivelyRenderComponent = ({ component, parent, attach = true }) => {
  const pureComponent = component && (component.noProxy || component)

  pureComponent._parent = parent

  if (pureComponent) {
    if (attach && pureComponent._node && pureComponent._parent) {
      pureComponent._parent._node.appendChild(pureComponent._node)
    }

    if (pureComponent.children) {
      pureComponent.children.forEach((child) => {
        child._parent = pureComponent._type ? pureComponent : pureComponent._parent
        recursivelyRenderComponent({
          component: child,
          parent: pureComponent._type ? pureComponent : pureComponent._parent
        })
      })
    }
  }
}

const renderApp = (root, children) => {
  const component = createComponent({ _type: 'div', children })
  component.noProxy._parent = { _node: root }
  recursivelyRenderComponent({ component, parent: { _node: root } })
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
