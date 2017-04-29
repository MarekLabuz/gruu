let proxyElements
let elements
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
          elem[key] = typeof properties[key] === 'function' ? properties[key]('') : properties[key]
      }
    })
  }
  return elem
}

const register = {}

function rebuildIndexes (structure = [], indexes = []) {
  (!Array.isArray(structure) ? [] : structure).forEach((elem, i) => {
    const { children } = elem
    elem._indexes = [...indexes, i]
    rebuildIndexes(children, elem._indexes)
  })
}

const find = (root, k) => {
  return k.reduce((acc, key) => {
    // if (!acc.elem[key] || !acc.elem[key]._type || !acc.elem[key][0] || !acc.elem[key][0]._type) {
    //   return acc
    // }
    switch (key) {
      default:
        return { modifyTree: acc.modifyTree, elem: acc.elem && acc.elem[key], elemParent: acc.elem }
    }
  }, { modifyTree: true, elem: root, elemParent: null })
}

const registered = {}

function recursivelyCreateElements (parent, structure = []) {
  return (!Array.isArray(structure) ? [] : structure).map((node) => {
    const { _type, _updateWith } = node

    const newElem = _type === 'text'
      ? Object.assign({}, node, { node: document.createTextNode(node.content), parent })
      :
      Object.assign({}, node, {
        node: createElementWithProperties(node, parent),
        children: recursivelyCreateElements(node, node.children),
        parent
      })

    if (_updateWith) {
      Object.keys(_updateWith).forEach((key) => {
        const [nodeAccess, stateAccess] = _updateWith[key].split('.').reduce((acc, curr) => {
          if (/\[.+]/.test(curr)) {
            const [array, index] = curr.split('[')
            return [...acc, array, index.replace(']', '')]
          }
          return [...acc, curr]
        }, []).join(',').split('state')
          .map(v => v.split(',').filter(i => i))
        const { modifyTree, elem, elemParent } = find(elements, nodeAccess.slice(1))
        setTimeout(() => {
          const id = `${elem._indexes.join(',')}|${stateAccess.join(',')}`
          registered[id] = [...(registered[id] || []), { [key]: newElem }]
          console.log('path', { modifyTree, elem, elemParent }, stateAccess, registered)
        })
      })
    }

    return newElem

    // if (_updateWith) {
    //   Object.keys(_updateWith).forEach((key) => {
    //     const path = _updateWith[key].split('.').reduce((acc, curr) => {
    //       if (/\[.+]/.test(curr)) {
    //         const [array, index] = curr.split('[')
    //         return [...acc, array, index.replace(']', '')]
    //       }
    //       return [...acc, curr]
    //     }, []).slice(1)
    //     const pathID = path.join(',')
    //     register[[...indexes, i].join(',')] = [...(register[pathID] || []), { item, key, func: item[key] }]
    //     const value = path.reduce((acc, curr) => acc[curr], __root)
    //     // console.log(path.slice(0, -1).reduce((acc, curr) => acc[curr], __root), [...indexes, i].join(','))
    //     item[key] = item[key](value)
    //     console.log(register)
    //   })
    // }
    //
    // const elem = _type === 'text'
    //   ? { node: document.createTextNode(item.content) }
    //   :
    //   {
    //     node: createElementWithProperties(item, parent),
    //     children: recursivelyCreateElements({ parent, node: item }, item.children, [...indexes, i])
    //   }
    // return elem
  })
}

function recursivelyRenderElements (root, elements = [], replaceWith = []) {
  return elements.forEach((elem, i) => {
    if (replaceWith[i]) {
      root.replaceChild(elem.node, replaceWith[i])
    } else {
      // console.log('elem', root, elem)
      root.appendChild(elem.node)
    }
    if (elem.children) {
      setTimeout(() => recursivelyRenderElements(elem.node, elem.children, []))
    }
    return elem
    // return Object.keys(elem).reduce((acc, key) => Object.assign({}, key !== 'node' ? { [key]: elem[key] } : {}), {})
  })
}

const treeModificationsHandler = ({ modifyTree, elem, elemParent, target, name, value }) => {
  const { _type } = (value || {})

  if (!modifyTree || name === 'state' || name === '_indexes') {
    target[name] = value
    return true
  }

  if (Array.isArray(value) && value.every(({ _type }) => _type)) {
    target[name] = value
    const elems = recursivelyCreateElements(elemParent, value)
    recursivelyRenderElements(elem, elems, elem[name])
    // setTimeout(() => rebuildIndexes(__root), 0)
    return true
  }

  // console.log('sdfsdf', { modifyTree, node, parent, target, name, value })
  if (_type) {
    // console.log('node', node)
    const elems = recursivelyCreateElements(elemParent, [value])
    target[name] = elems[0]
    // console.log('--------', elements, value, elemParent)
    recursivelyRenderElements(elemParent.node, elems, [elem[name].node])
    setTimeout(() => rebuildIndexes(elemParent), 0)
    return true
  }

  if (value === null) {
    elem[name].remove()
    target.splice(name, 1)
    setTimeout(() => rebuildIndexes(elemParent.node), 0)
    return true
  }

  target[name] = value

  switch (name) {
    case 'content':
      elem.textContent = value
      break
    default:
      // node[name] = value
  }
  return true
}

const handler = (root, ...k) => ({
  get (target, key) {
    // console.log(target, key, target[key])
    // return target[key]
    return typeof target[key] === 'object' && target[key] !== null
      ? new Proxy(target[key], handler(root, ...k, key))
      : target[key]
  },
  set: (target, name, value) => {
    // console.log(root, k)
    const { modifyTree, elem, elemParent } = find(root, k)
    // console.log({ elem, elemParent, root, k })
    // console.log('root', root, k, node, target, name, parent)
    // console.log(proxyElements)
    // console.log({ modifyTree, node, parent, target, name, value, k, root })
    // console.log(target, name, value, [root, ...k, name])
    // const path = [...k, name].join(',')
    // const keys = Object.keys(register).filter(key => key.includes(path))
    // if (keys.length) {
    //   keys.forEach((p) => {
    //     register[p].forEach((v) => {
    //       setTimeout(() => {
    //         const { item, item: { _indexes }, func, key } = v
    //         const elem = _indexes.reduce((acc, curr) => acc.childNodes[curr], _root)
    //         const vv = p.replace(path, '').replace(',', '').split('.')
    //         const vvv = vv.reduce((acc, curr) => (curr ? acc[curr] : acc), value)
    //         treeModificationsHandler(true, item, key, func(vvv), elem, elem.parentNode)
    //       })
    //     })
    //   })
    // }
    return treeModificationsHandler({ modifyTree, elem, elemParent, target, name, value })
  }
})

function createApp (root, structure) { // eslint-disable-line no-unused-vars
  _root = root
  elements = recursivelyCreateElements(root, structure)
  // console.log(elements)
  recursivelyRenderElements(root, elements)
  proxyElements = new Proxy(elements, handler(elements))
  setTimeout(() => rebuildIndexes(proxyElements), 0)
  return proxyElements
}
