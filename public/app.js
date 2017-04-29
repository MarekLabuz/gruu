let __root
let _root

function objectSpread (root, parent, object, ...omitProps) {
  return Object.keys(object).reduce((acc, key) => (
    Object.assign(
      {},
      acc,
      omitProps.includes(key)
        ? {}
        :
        {
          [key]: typeof object[key] === 'function'
            ? (...v) => object[key].call(new Proxy({ parent, node: object }, handler(root)), ...v)
            : object[key]
        }
    )
  ), {})
}

function createElementWithProperties (item, parent) {
  const { _type } = item
  const elem = document.createElement(_type)
  const properties = objectSpread(elem, parent, item, '_type', '_updateWith', 'content', 'children', 'state')
  if (properties) {
    Object.keys(properties).forEach((key) => {
      switch (key) {
        case 'style':
          Object.keys(properties[key]).forEach((cssProp) => {
            elem.style[cssProp] = properties[key][cssProp]
          })
          break
        default:
          elem[key] = properties[key]
      }
    })
  }
  return elem
}

const register = {}

function rebuildIndexes (structure = [], indexes = []) {
  return structure.map((item, i) => {
    const { children } = item
    item._indexes = [...indexes, i]
    return rebuildIndexes(children, item._indexes)
  })
}

function recursivelyCreateElements (parent, structure = []) {
  return structure.map((item) => {
    const { _type, _updateWith } = item

    if (_updateWith) {
      Object.keys(_updateWith).forEach((key) => {
        const path = _updateWith[key].split('.').reduce((acc, curr) => {
          if (/\[.+]/.test(curr)) {
            const [array, index] = curr.split('[')
            return [...acc, array, index.replace(']', '')]
          }
          return [...acc, curr]
        }, []).slice(1)
        const pathID = path.join(',')
        register[pathID] = [...(register[pathID] || []), { item, key, func: item[key] }]
        const value = path.reduce((acc, curr) => acc[curr], __root)
        item[key] = item[key](value)
      })
    }

    const elem = _type === 'text'
      ? { node: document.createTextNode(item.content) }
      :
      {
        node: createElementWithProperties(item, parent),
        children: recursivelyCreateElements({ parent, node: item }, item.children)
      }
    return elem
  })
}

function recursivelyRenderElements (root, structure = [], replaceWith = []) {
  structure.forEach((item, i) => {
    if (replaceWith[i]) {
      root.replaceChild(item.node, replaceWith[i])
    } else {
      root.appendChild(item.node)
    }
    if (item.children) {
      recursivelyRenderElements(item.node, item.children, [])
    }
  })
}

const treeModificationsHandler = (modifyTree, target, name, value, node, parent) => {
  const { _type } = (value || {})

  if (Array.isArray(value) && value.every(({ _type }) => _type)) {
    target[name] = value
    const elements = recursivelyCreateElements(parent, value)
    recursivelyRenderElements(node, elements, node[name])
    setTimeout(() => rebuildIndexes(__root), 0)
  }

  if (_type) {
    target[name] = value
    const elements = recursivelyCreateElements(parent, [value])
    recursivelyRenderElements(parent, elements, [node[name]])
    setTimeout(() => rebuildIndexes(__root), 0)
    return true
  }

  if (!modifyTree || name === 'state') {
    target[name] = value
    return true
  }

  if (value === null) {
    node[name].remove()
    target.splice(name, 1)
    setTimeout(() => rebuildIndexes(__root), 0)
    return true
  }

  target[name] = value

  switch (name) {
    case 'content':
      node.textContent = value
      break
    case '_indexes':
      break
    default:
      node[name] = value
  }
  return true
}

const handler = (root, ...k) => ({
  get (target, key) {
    return typeof target[key] === 'object' && target[key] !== null
      ? new Proxy(target[key], handler(root, ...k, key))
      : target[key]
  },
  set: (target, name, value) => {
    const { modifyTree, node, parent } = k.reduce((acc, key) => {
      switch (key) {
        case 'state':
          return { modifyTree: false, node: acc.node, parent: acc.node }
        case 'node':
          return { modifyTree: acc.modifyTree, node: acc.node, parent: acc.parent }
        case 'parent':
          return { modifyTree: acc.modifyTree, node: acc.node.parentNode, parent: acc.node }
        case 'children':
          return { modifyTree: acc.modifyTree, node: acc.node.childNodes, parent: acc.node }
        default:
          return { modifyTree: acc.modifyTree, node: acc.node[key], parent: acc.node }
      }
    }, { modifyTree: true, node: root, parent: null })
    const path = [...k, name].join(',')
    const keys = Object.keys(register).filter(key => key.includes(path))
    if (keys.length) {
      keys.forEach((p) => {
        register[p].forEach((v) => {
          setTimeout(() => {
            const { item, item: { _indexes }, func, key } = v
            const elem = _indexes.reduce((acc, curr) => acc.childNodes[curr], _root)
            const vv = p.replace(path, '').replace(',', '').split('.')
            const vvv = vv.reduce((acc, curr) => (curr ? acc[curr] : acc), value)
            treeModificationsHandler(true, item, key, func(vvv), elem, elem.parentNode)
          })
        })
      })
    }
    return treeModificationsHandler(modifyTree, target, name, value, node, parent)
  }
})

function createApp (root, structure) { // eslint-disable-line no-unused-vars
  _root = root
  const elements = recursivelyCreateElements(root, structure)
  recursivelyRenderElements(root, elements)
  __root = new Proxy(structure, handler(root.childNodes))
  setTimeout(() => rebuildIndexes(__root), 0)
  return __root
}
