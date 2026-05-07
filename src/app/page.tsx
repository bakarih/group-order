import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="mb-6 text-6xl">🍽️</div>

      <h1 className="text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
        Order Together.
      </h1>

      <p className="text-lg text-gray-600 mb-2 max-w-md">
        Start a group order from Jamba, Auntie Anne&apos;s, Moe&apos;s, and more.
        Invite your crew, everyone picks their own, you check out together.
      </p>

      <p className="text-sm text-gray-400 mb-10">Up to 3 participants per group order.</p>

      <Link
        href="/order/new"
        className="px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg"
        style={{ background: 'var(--brand-red)' }}
      >
        Start a Group Order
      </Link>

      <div className="mt-16 grid grid-cols-3 gap-6 text-center">
        {[
          { emoji: '📧', label: 'Invite by email', desc: 'Share a join link with up to 3 friends' },
          { emoji: '🛒', label: 'Everyone picks', desc: 'Each person browses the menu and builds their cart' },
          { emoji: '💳', label: 'Host checks out', desc: 'See a full summary broken down by person' },
        ].map((step) => (
          <div key={step.label} className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
            <div className="text-3xl mb-2">{step.emoji}</div>
            <div className="font-semibold text-sm mb-1">{step.label}</div>
            <div className="text-xs text-gray-500">{step.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
