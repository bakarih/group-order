'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Participant, CartItem } from '@/types'
import { MENU_ITEMS } from '@/lib/menu'
import Link from 'next/link'

export default function MenuPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const token = searchParams.get('token')

  const [participant, setParticipant] = useState<Participant | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)

  const loadCart = useCallback(async (participantId: string) => {
    const { data } = await supabase
      .from('cart_items')
      .select('*')
      .eq('participant_id', participantId)
      .eq('group_order_id', orderId)
    if (data) setCartItems(data)
  }, [orderId])

  useEffect(() => {
    if (!token) return

    supabase
      .from('participants')
      .select('*')
      .eq('join_token', token)
      .single()
      .then(({ data }) => {
        if (data) {
          setParticipant(data)
          loadCart(data.id)
        }
        setLoading(false)
      })
  }, [token, loadCart])

  useEffect(() => {
    if (!participant) return
    const channel = supabase
      .channel(`my-cart-${participant.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'cart_items',
        filter: `participant_id=eq.${participant.id}`
      }, () => loadCart(participant.id))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [participant, loadCart])

  const addItem = async (menuItemId: string) => {
    if (!participant) return
    setAdding(menuItemId)

    const menuItem = MENU_ITEMS.find((m) => m.id === menuItemId)!
    const existing = cartItems.find((c) => c.menu_item_id === menuItemId)

    if (existing) {
      // Optimistic update
      setCartItems((prev) => prev.map((c) =>
        c.menu_item_id === menuItemId ? { ...c, quantity: c.quantity + 1 } : c
      ))
      await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      const newItem = {
        group_order_id: orderId,
        participant_id: participant.id,
        menu_item_id: menuItemId,
        menu_item_name: menuItem.name,
        menu_item_price: menuItem.price,
        quantity: 1,
      }
      // Optimistic update
      setCartItems((prev) => [...prev, { ...newItem, id: 'temp', added_at: new Date().toISOString() }])
      await supabase.from('cart_items').insert(newItem)
    }

    setAdding(null)
  }

  const removeItem = async (menuItemId: string) => {
    if (!participant) return
    const existing = cartItems.find((c) => c.menu_item_id === menuItemId)
    if (!existing) return

    if (existing.quantity > 1) {
      setCartItems((prev) => prev.map((c) =>
        c.menu_item_id === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
      ))
      await supabase.from('cart_items').update({ quantity: existing.quantity - 1 }).eq('id', existing.id)
    } else {
      setCartItems((prev) => prev.filter((c) => c.menu_item_id !== menuItemId))
      await supabase.from('cart_items').delete().eq('id', existing.id)
    }
  }

  const getQuantity = (menuItemId: string) =>
    cartItems.find((c) => c.menu_item_id === menuItemId)?.quantity ?? 0

  const cartTotal = cartItems.reduce((sum, item) => sum + item.menu_item_price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) return <div className="text-center py-20 text-gray-400">Loading menu...</div>
  if (!participant) return <div className="text-center py-20 text-gray-500">Invalid session.</div>

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>The Menu</h1>
          <p className="text-sm text-gray-500">Ordering as <span className="font-medium text-black">{participant.name}</span></p>
        </div>
        {participant.is_host && (
          <Link
            href={`/order/${orderId}?token=${token}`}
            className="text-sm px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        )}
      </div>

      {/* Menu Items */}
      <div className="space-y-4 mb-8">
        {MENU_ITEMS.map((item) => {
          const qty = getQuantity(item.id)
          return (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl shrink-0"
                style={{ background: 'var(--brand-cream)' }}>
                {item.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.brand}</p>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{item.description}</p>
                  </div>
                  <p className="font-bold text-sm shrink-0">${item.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {qty > 0 ? (
                  <>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-colors"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-sm">{qty}</span>
                    <button
                      onClick={() => addItem(item.id)}
                      disabled={adding === item.id}
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center text-lg font-bold transition-all hover:opacity-90"
                      style={{ background: 'var(--brand-red)' }}
                    >+</button>
                  </>
                ) : (
                  <button
                    onClick={() => addItem(item.id)}
                    disabled={adding === item.id}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: 'var(--brand-red)' }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart summary sticky footer */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <div className="bg-black text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-xl animate-slide-up">
            <div>
              <p className="text-xs text-gray-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              <p className="font-bold">${cartTotal.toFixed(2)}</p>
            </div>
            <p className="text-sm text-gray-300">
              {participant.is_host ? 'Host sees your cart live ✓' : 'Host sees this live ✓'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
