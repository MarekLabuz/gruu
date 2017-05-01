let proxyElements
let elements

const find = (root, k) => k.reduce((acc, key) => ({
  modifyTree: acc.modifyTree,
  elem: acc.elem && acc.elem[key],
  elemParent: acc.elem
}), { modifyTree: true, elem: root, elemParent: null })

function recursivelyRenderElements (root, elems = [], replaceWith = []) {
  return elems.forEach((elem, i) => {
    if (replaceWith[i]) {
      root.replaceChild(elem.node, replaceWith[i])
    } else {
      root.appendChild(elem.node)
    }
    if (elem.children) {
      recursivelyRenderElements(elem.node, elem.children, [])
    }

    return elem
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

  if (_type) {
    const elems = recursivelyCreateElements(elemParent, [value], elemParent._indexes)
    target[name] = elems[0]
    recursivelyRenderElements(elemParent.node, elems, [elem[name].node])
    // setTimeout(() => rebuildIndexes(elemParent), 0)
    return true
  }

  if (value === null) {
    elem[name].node.remove()
    target.splice(name, 1)
    setTimeout(() => rebuildIndexes(elemParent.node), 0)
    return true
  }

  target[name] = value

  const node = (elem.node || elem)

  switch (name) {
    case 'content':
      node.textContent = value
      break
    default:
      node[name] = value
  }
  return true
}

const registered = {}

const handler = (root, ...k) => ({
  get (target, key) {
    return typeof target[key] === 'object' && target[key] !== null
      ? new Proxy(target[key], handler(root, ...k, key))
      : target[key]
  },
  set: (target, name, value) => {
    const { modifyTree, elem, elemParent } = find(root, k)

    Object.keys(registered).forEach((key) => {
      if ([...k, name].includes('state')) {
        const [nodeAccess, stateAccess] = [...k, name].join(',').split('state').map(v => v.split(',').filter(i => i))
        const { elem: elemTarget } = find(elements, nodeAccess)
        const id = `${elemTarget._indexes.join(',')}|${stateAccess.join(',')}`
        if (id === key) {
          registered[key].forEach((item) => {
            Object.keys(item).forEach((prop) => {

              console.log({
                modifyTree: true,
                elem: item[prop].elem.node,
                elemParent: item[prop].elem.parent,
                target: item[prop].elem,
                name: prop,
                value: item[prop].func(value)
              })
              treeModificationsHandler({
                modifyTree: true,
                elem: item[prop].elem.node,
                elemParent: item[prop].elem.parent,
                target: item[prop].elem,
                name: prop,
                value: item[prop].func(value)
              })
            })
          })
        }
      }
    })

    // console.log({ modifyTree, elem, elemParent, target, name, value })

    return treeModificationsHandler({ modifyTree, elem, elemParent, target, name, value })
  }
})

function objectSpread (root, parent, object, ...omitProps) {
  return Object.keys(object).reduce((acc, key) => (
    Object.assign(
      {},
      acc,
      omitProps.includes(key)
        ? {}
        : { [key]: object[key] }
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

function rebuildIndexes (structure = [], indexes = []) {
  (!Array.isArray(structure) ? [] : structure).forEach((elem, i) => {
    const { children, _updateWith } = elem
    const prevIndexes = elem._indexes
    elem._indexes = [...indexes, i]
    if (_updateWith && prevIndexes !== elem._indexes) {
      Object.keys(_updateWith).forEach((key) => {
        if (_updateWith[key].includes('state')) {
          const path = _updateWith[key].split('.').reduce((acc, curr) => {
            if (/\[.+]/.test(curr)) {
              const [array, index] = curr.split('[')
              return [...acc, array, index.replace(']', '')]
            }
            return [...acc, curr]
          }, [])
          const [nodeAccess, stateAccess] = path.join(',').split('state')
            .map(v => v.split(',').filter(k => k))
          const [location, ...restNodeAccess] = nodeAccess
          const { elem: elemTarget } = find(location === 'this' ? elem : elements, restNodeAccess)
          const { elem: value } = find(location === 'this' ? elem : elements, path.slice(1))
          const id = `${elemTarget._indexes.join(',')}|${stateAccess.join(',')}`
          registered[id] = [...(registered[id] || []), { [key]: { elem, func: elem[key] } }]

          treeModificationsHandler({
            modifyTree: true,
            elem: elem.node,
            elemParent: elem.parent.node,
            target: elem,
            name: key,
            value: elem[key](value)
          })
        }
      })
    }

    rebuildIndexes(children, elem._indexes)
  })
}

function recursivelyCreateElements (parent, structure = []) {
  return (!Array.isArray(structure) ? [] : structure).map((node) => {
    const { _type } = node

    const newElem = node
    Object.keys(newElem).forEach((key) => {
      newElem[key] = (typeof newElem[key] === 'function')
        ? newElem[key].bind(new Proxy(newElem, handler(newElem)))
        : newElem[key]
    })

    newElem.node = _type === 'text'
      ? document.createTextNode(newElem.content)
      : createElementWithProperties(newElem, parent)

    newElem.parent = parent
    newElem.children = recursivelyCreateElements(newElem, newElem.children)

    return newElem
  })
}

function createApp (root, structure) { // eslint-disable-line no-unused-vars
  elements = recursivelyCreateElements(root, structure)
  setTimeout(() => rebuildIndexes(elements), 0)
  setTimeout(() => recursivelyRenderElements(root, elements))
  proxyElements = new Proxy(elements, handler(elements))
  return proxyElements
}

// function createComponent (object) {
//   object.isProxy = true
//   const elems = recursivelyCreateElements(root, [object])
//   setTimeout(() => rebuildIndexes(elems), 0)
//   return new Proxy(elems, handler(elems))[0]
// }
