'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GroupOrder, Participant, CartItem, ParticipantCart } from '@/types'
import CheckoutModal from '@/components/CheckoutModal'
import Link from 'next/link'

export default function OrderDashboard() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const token = searchParams.get('token')

  const [order, setOrder] = useState<GroupOrder | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [orderRes, participantsRes, cartRes] = await Promise.all([
      supabase.from('group_orders').select('*').eq('id', orderId).single(),
      supabase.from('participants').select('*').eq('group_order_id', orderId),
      supabase.from('cart_items').select('*').eq('group_order_id', orderId),
    ])

    if (orderRes.data) setOrder(orderRes.data)
    if (participantsRes.data) setParticipants(participantsRes.data)
    if (cartRes.data) setCartItems(cartRes.data)

    if (token && participantsRes.data) {
      const me = participantsRes.data.find((p) => p.join_token === token)
      setCurrentParticipant(me ?? null)
    }

    setLoading(false)
  }, [orderId, token])

  useEffect(() => {
    loadData()

    // Real-time: cart items
    const cartChannel = supabase
      .channel(`cart-${orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `group_order_id=eq.${orderId}` },
        () => loadData())
      .subscribe()

    // Real-time: participants joining
    const participantChannel = supabase
      .channel(`participants-${orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `group_order_id=eq.${orderId}` },
        () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(cartChannel)
      supabase.removeChannel(participantChannel)
    }
  }, [orderId, token, loadData])

  const handleCheckout = async () => {
    await supabase.from('group_orders').update({ status: 'checked_out' }).eq('id', orderId)
    setOrder((prev) => prev ? { ...prev, status: 'checked_out' } : prev)
    setShowCheckout(true)
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading order...</div>
  }

  if (!order || !currentParticipant?.is_host) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Order not found or you don&apos;t have host access.</p>
      </div>
    )
  }

  // Build per-participant carts
  const participantCarts: ParticipantCart[] = participants.map((p) => {
    const items = cartItems.filter((c) => c.participant_id === p.id)
    const subtotal = items.reduce((sum, item) => sum + item.menu_item_price * item.quantity, 0)
    return { participant: p, items, subtotal }
  })

  const grandTotal = participantCarts.reduce((sum, pc) => sum + pc.subtotal, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Generate join links for guests
  const guestParticipants = participants.filter((p) => !p.is_host)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            {order.host_name}&apos;s Group Order
          </h1>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            order.status === 'checked_out' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {order.status === 'checked_out' ? '✅ Checked out' : '🟡 Order open'}
          </span>
        </div>
        {order.status === 'active' && (
          <button
            onClick={handleCheckout}
            disabled={totalItems === 0}
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--brand-green)' }}
          >
            Checkout ({totalItems} items)
          </button>
        )}
      </div>

      {/* Your menu link */}
      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Your cart</p>
          <p className="text-xs text-gray-400">Add items from the menu</p>
        </div>
        <Link
          href={`/order/${orderId}/menu?token=${token}`}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'var(--brand-red)' }}
        >
          Browse Menu →
        </Link>
      </div>

      {/* Guest invite links */}
      {guestParticipants.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm mb-6">
          <h2 className="font-semibold mb-3 text-sm">Guest Join Links</h2>
          <div className="space-y-2">
            {guestParticipants.map((guest) => {
              const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/order/${orderId}/join?token=${guest.join_token}`
              return (
                <div key={guest.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">{guest.email}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(joinUrl)}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Copy link
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-participant order breakdown */}
      <h2 className="font-semibold mb-3">Order Breakdown</h2>
      <div className="space-y-3 mb-6">
        {participantCarts.map(({ participant, items, subtotal }) => (
          <div key={participant.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: participant.is_host ? 'var(--brand-red)' : 'var(--brand-gold)' }}>
                  {participant.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{participant.name}</p>
                  {participant.is_host && <p className="text-xs text-gray-400">Host</p>}
                </div>
              </div>
              <p className="font-semibold text-sm">${subtotal.toFixed(2)}</p>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No items yet</p>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-600">
                    <span>{item.menu_item_name} × {item.quantity}</span>
                    <span>${(item.menu_item_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div className="bg-black rounded-2xl p-5 text-white flex justify-between items-center">
        <span className="font-semibold">Group Total</span>
        <span className="text-2xl font-bold">${grandTotal.toFixed(2)}</span>
      </div>

      {showCheckout && (
        <CheckoutModal
          order={order}
          participantCarts={participantCarts}
          grandTotal={grandTotal}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  )
}
