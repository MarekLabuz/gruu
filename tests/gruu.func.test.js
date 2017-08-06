window.__DEV__ = true

const { createComponent, destinations, findDestination } = require('../src/index')

describe('findDestination', () => {
  test('returns correct destination', () => {
    expect(findDestination()).toBe('')
    expect(findDestination(['state'])).toBe(destinations.STATE)
    expect(findDestination(['state', 'counter'])).toBe(destinations.STATE)
    expect(findDestination(['children', '0', 'state'])).toBe(destinations.STATE)
    expect(findDestination(['children'])).toBe(destinations.CHILDREN)
    expect(findDestination(['children', '0'])).toBe(destinations.CHILDREN)
    expect(findDestination(['children', '0', 'children'])).toBe(destinations.CHILDREN)
    expect(findDestination(['textContent'])).toBe(destinations.NODE)
    expect(findDestination(['children', '0', 'style'])).toBe(destinations.NODE)
  })
})

describe('createComponent', () => {
  test('returns Proxy', () => {
    expect(Object.keys(createComponent({}))).toEqual(['_id'])
    expect(typeof createComponent({})).toEqual('object')
    expect(createComponent()).toBe(undefined)
    expect(createComponent(null)).toBe(null)
  })

  test('converts text to Text HTML Element', () => {
    const component = createComponent('test')
    expect(typeof component).toEqual('object')
    expect(Object.keys(component)).toEqual(['_type', 'textContent', '_id'])
    expect(component.textContent).toEqual('test')
    expect(Object.keys(createComponent(''))).toEqual(['_type', 'textContent', '_id'])
  })

  test('converts numbers to Text HTML Element', () => {
    const component = createComponent(7868)
    expect(typeof component).toEqual('object')
    expect(Object.keys(component)).toEqual(['_type', 'textContent', '_id'])
    expect(component.textContent).toEqual(7868)
    expect(Object.keys(createComponent(0))).toEqual(['_type', 'textContent', '_id'])
  })
})
