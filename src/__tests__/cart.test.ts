import { describe, it, expect } from '@jest/globals'
import { MENU_ITEMS, getMenuItem } from '@/lib/menu'
import { CartItem, Participant, ParticipantCart } from '@/types'

describe('MENU_ITEMS', () => {
  it('has exactly 3 items', () => {
    expect(MENU_ITEMS).toHaveLength(3)
  })

  it('each item has required fields', () => {
    MENU_ITEMS.forEach((item) => {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.price).toBeGreaterThan(0)
      expect(item.brand).toBeTruthy()
    })
  })

  it('contains GoTo Foods brand items', () => {
    const brands = MENU_ITEMS.map((item) => item.brand)
    expect(brands).toContain('Jamba')
    expect(brands).toContain("Auntie Anne's")
    expect(brands).toContain("Moe's")
  })
})

describe('getMenuItem', () => {
  it('returns the correct item by id', () => {
    const item = getMenuItem('jamba-mango')
    expect(item).toBeDefined()
    expect(item?.brand).toBe('Jamba')
  })

  it('returns undefined for unknown id', () => {
    expect(getMenuItem('not-real')).toBeUndefined()
  })
})

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1', group_order_id: 'order-1', participant_id: 'p1',
    menu_item_id: 'jamba-mango', menu_item_name: 'Mango-A-Go-Go Smoothie',
    menu_item_price: 7.99, quantity: 1, added_at: new Date().toISOString(),
    ...overrides,
  }
}

function buildParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'p1', group_order_id: 'order-1', name: 'Bakari Holmes',
    email: 'bakari@example.com', join_token: 'token-abc',
    is_host: true, joined_at: new Date().toISOString(),
    ...overrides,
  }
}

function computeSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.menu_item_price * item.quantity, 0)
}

function computeGrandTotal(carts: ParticipantCart[]) {
  return carts.reduce((sum, cart) => sum + cart.subtotal, 0)
}

describe('Cart subtotal', () => {
  it('returns 0 for empty cart', () => expect(computeSubtotal([])).toBe(0))

  it('calculates single item correctly', () => {
    expect(computeSubtotal([buildCartItem({ menu_item_price: 7.99, quantity: 1 })])).toBeCloseTo(7.99)
  })

  it('calculates multiple quantities correctly', () => {
    expect(computeSubtotal([buildCartItem({ menu_item_price: 11.99, quantity: 2 })])).toBeCloseTo(23.98)
  })

  it('sums multiple items correctly', () => {
    const items = [
      buildCartItem({ id: '1', menu_item_price: 7.99, quantity: 1 }),
      buildCartItem({ id: '2', menu_item_price: 5.49, quantity: 1 }),
    ]
    expect(computeSubtotal(items)).toBeCloseTo(13.48)
  })
})

describe('Grand total', () => {
  it('sums across participants', () => {
    const carts: ParticipantCart[] = [
      { participant: buildParticipant(), items: [], subtotal: 37.46 },
      { participant: buildParticipant({ id: 'p2', is_host: false }), items: [], subtotal: 26.96 },
    ]
    expect(computeGrandTotal(carts)).toBeCloseTo(64.42)
  })
})

describe('Participant roles', () => {
  it('identifies host', () => expect(buildParticipant({ is_host: true }).is_host).toBe(true))
  it('identifies guest', () => expect(buildParticipant({ is_host: false }).is_host).toBe(false))

  it('filters guests from participant list', () => {
    const participants = [
      buildParticipant({ id: 'p1', is_host: true }),
      buildParticipant({ id: 'p2', is_host: false }),
      buildParticipant({ id: 'p3', is_host: false }),
    ]
    expect(participants.filter((p) => !p.is_host)).toHaveLength(2)
  })
})