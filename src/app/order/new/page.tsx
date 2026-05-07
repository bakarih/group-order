'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewOrderPage() {
  const router = useRouter()
  const [hostName, setHostName] = useState('')
  const [hostEmail, setHostEmail] = useState('')
  const [guestEmails, setGuestEmails] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateGuest = (index: number, value: string) => {
    setGuestEmails((prev) => prev.map((e, i) => (i === index ? value : e)))
  }

  const handleSubmit = async () => {
    if (!hostName.trim() || !hostEmail.trim()) {
      setError('Please enter your name and email.')
      return
    }

    const filledGuests = guestEmails.filter((e) => e.trim())
    if (filledGuests.length === 0) {
      setError('Please invite at least one guest.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create the group order
      const { data: order, error: orderErr } = await supabase
        .from('group_orders')
        .insert({ host_name: hostName.trim(), host_email: hostEmail.trim() })
        .select()
        .single()

      if (orderErr || !order) throw orderErr ?? new Error('Failed to create order')

      // Add host as first participant (is_host: true)
      const { data: hostParticipant, error: hostErr } = await supabase
        .from('participants')
        .insert({
          group_order_id: order.id,
          name: hostName.trim(),
          email: hostEmail.trim(),
          is_host: true,
        })
        .select()
        .single()

      if (hostErr || !hostParticipant) throw hostErr ?? new Error('Failed to add host')

      // Add guest participants
      const guestInserts = filledGuests.map((email) => ({
        group_order_id: order.id,
        name: email.split('@')[0], // default name from email prefix
        email: email.trim(),
        is_host: false,
      }))

      const { error: guestsErr } = await supabase.from('participants').insert(guestInserts)
      if (guestsErr) throw guestsErr

      // Redirect host to their order dashboard with their participant token
      router.push(`/order/${order.id}?token=${hostParticipant.join_token}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
        Start a Group Order
      </h1>
      <p className="text-gray-500 mb-8 text-sm">You&apos;ll be the host. Guests get a link to add their items.</p>

      {/* Host Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center"
            style={{ background: 'var(--brand-red)' }}>H</span>
          Your Info (Host)
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--brand-red)' } as React.CSSProperties}
          />
          <input
            type="email"
            placeholder="Your email"
            value={hostEmail}
            onChange={(e) => setHostEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </div>
      </div>

      {/* Guest Emails */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 mb-6">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center">G</span>
          Invite Guests
        </h2>
        <p className="text-xs text-gray-400 mb-4">Up to 3 guests. They&apos;ll get a join link.</p>
        <div className="space-y-3">
          {guestEmails.map((email, i) => (
            <input
              key={i}
              type="email"
              placeholder={`Guest ${i + 1} email`}
              value={email}
              onChange={(e) => updateGuest(i, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm mb-4 text-center" style={{ color: 'var(--brand-red)' }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ background: 'var(--brand-red)' }}
      >
        {loading ? 'Creating order...' : 'Create Group Order →'}
      </button>
    </div>
  )
}
