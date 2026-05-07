export type OrderStatus = 'active' | 'checked_out'

export interface GroupOrder {
  id: string
  host_name: string
  host_email: string
  status: OrderStatus
  created_at: string
}

export interface Participant {
  id: string
  group_order_id: string
  name: string
  email: string
  join_token: string
  is_host: boolean
  joined_at: string
}

export interface CartItem {
  id: string
  group_order_id: string
  participant_id: string
  menu_item_id: string
  menu_item_name: string
  menu_item_price: number
  quantity: number
  added_at: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  emoji: string
  brand: string
}

export interface ParticipantCart {
  participant: Participant
  items: CartItem[]
  subtotal: number
}
