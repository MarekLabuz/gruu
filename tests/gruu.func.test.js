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
})

describe('', () => {

})
