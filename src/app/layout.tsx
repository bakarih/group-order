import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GoTo Group Order',
  description: 'Order together from your favorite GoTo Foods brands',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--brand-red)' }}>
              G
            </div>
            <span className="font-semibold text-sm tracking-tight">GoTo Group Order</span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
