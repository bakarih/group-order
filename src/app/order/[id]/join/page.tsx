'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Participant } from '@/types'

export default function JoinPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = params.id as string
  const token = searchParams.get('token')

  const [participant, setParticipant] = useState<Participant | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [alreadyJoined, setAlreadyJoined] = useState(false)

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
          setName(data.name)
          // If they already have a name that isn't just the email prefix, skip name entry
          const emailPrefix = data.email.split('@')[0]
          if (data.name !== emailPrefix) {
            setAlreadyJoined(true)
            router.replace(`/order/${orderId}/menu?token=${token}`)
          }
        }
        setLoading(false)
      })
  }, [token, orderId, router])

  const handleJoin = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!participant) return
    setSaving(true)
    const { error: err } = await supabase
      .from('participants')
      .update({ name: name.trim() })
      .eq('id', participant.id)
    if (err) { setError('Something went wrong.'); setSaving(false); return }
    router.push(`/order/${orderId}/menu?token=${token}`)
  }

  if (loading || alreadyJoined) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>
  }

  if (!participant) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Invalid or expired invite link.</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto text-center animate-slide-up pt-10">
      <div className="text-5xl mb-4">👋</div>
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
        You&apos;re invited!
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Enter your name to join the group order and start adding items.
      </p>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 text-left mb-4">
        <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-2">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="First name is fine"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
          autoFocus
        />
      </div>

      {error && <p className="text-sm mb-3" style={{ color: 'var(--brand-red)' }}>{error}</p>}

      <button
        onClick={handleJoin}
        disabled={saving}
        className="w-full py-4 rounded-2xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ background: 'var(--brand-red)' }}
      >
        {saving ? 'Joining...' : 'Join & Browse Menu →'}
      </button>
    </div>
  )
}
