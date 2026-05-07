'use client'

import { GroupOrder, ParticipantCart } from '@/types'

interface Props {
  order: GroupOrder
  participantCarts: ParticipantCart[]
  grandTotal: number
  onClose: () => void
}

export default function CheckoutModal({ order, participantCarts, grandTotal, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Order Summary</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Placed by {order.host_name}</p>
        </div>

        {/* Per-person breakdown */}
        <div className="p-6 space-y-5">
          {participantCarts.map(({ participant, items, subtotal }) => (
            <div key={participant.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: participant.is_host ? 'var(--brand-red)' : 'var(--brand-gold)' }}>
                    {participant.name[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{participant.name}</span>
                  {participant.is_host && <span className="text-xs text-gray-400">(Host)</span>}
                </div>
                <span className="font-semibold text-sm">${subtotal.toFixed(2)}</span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-9">No items</p>
              ) : (
                <div className="pl-9 space-y-1">
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

        {/* Divider + total */}
        <div className="border-t border-gray-100 px-6 py-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="font-semibold">${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4 text-xs text-gray-400">
            <span>Tax & fees</span>
            <span>Calculated at next step</span>
          </div>

          <div className="flex justify-between items-center bg-black text-white rounded-2xl px-5 py-4">
            <span className="font-semibold">Group Total</span>
            <span className="text-xl font-bold">${grandTotal.toFixed(2)}</span>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            ✅ Order confirmed. Payment would be processed here.
          </p>
        </div>
      </div>
    </div>
  )
}
