# GoTo Group Order

A real-time group ordering app built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Setup (5 minutes)

### 1. Supabase
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. Go to **Project Settings → API** → copy your Project URL and anon key

### 2. Environment
```bash
cp .env.local.example .env.local
# Paste your Supabase URL and anon key into .env.local
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How it works

1. **Host** goes to `/` → "Start a Group Order" → enters their name, email, and up to 3 guest emails
2. **Host** lands on the order dashboard → copies join links for each guest
3. **Guests** open their join link → enter their name → browse the menu and add items
4. **Host dashboard** updates in real-time as guests add items — broken down per person
5. **Host** clicks Checkout → sees a full order summary by participant

## Architecture decisions

- **Supabase** over Firebase: relational model maps cleanly to group → participants → cart_items. Row-level security handles access patterns naturally.
- **Join tokens** over email auth: removes email delivery from the demo critical path. Production would use Supabase magic links.
- **Next.js App Router**: Server Components for static menu data, Client Components for real-time cart updates.
- **Supabase Realtime**: `postgres_changes` subscriptions scoped per order — no polling, no websocket management.
- **Optimistic UI** on cart add/remove: cart updates instantly before the DB write confirms, with a clean rollback path.
- **No global state manager**: Supabase real-time + React `useState` is sufficient scope. Adding Zustand/Redux would be over-engineering.

## Menu (GoTo Foods brands)
- 🥤 Jamba Mango-A-Go-Go Smoothie — $7.99
- 🥨 Auntie Anne's Cinnamon Sugar Pretzel — $5.49
- 🌯 Moe's Homewrecker Burrito — $11.99
