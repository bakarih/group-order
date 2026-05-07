-- Group Orders Table
create table group_orders (
  id uuid default gen_random_uuid() primary key,
  host_name text not null,
  host_email text not null,
  status text not null default 'active' check (status in ('active', 'checked_out')),
  created_at timestamptz default now()
);

-- Participants Table (includes the host as first participant)
create table participants (
  id uuid default gen_random_uuid() primary key,
  group_order_id uuid references group_orders(id) on delete cascade not null,
  name text not null,
  email text not null,
  join_token uuid default gen_random_uuid() unique not null,
  is_host boolean default false,
  joined_at timestamptz default now()
);

-- Cart Items Table
create table cart_items (
  id uuid default gen_random_uuid() primary key,
  group_order_id uuid references group_orders(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  menu_item_id text not null,
  menu_item_name text not null,
  menu_item_price numeric(10,2) not null,
  quantity int not null default 1 check (quantity > 0),
  added_at timestamptz default now()
);

-- Enable Row Level Security
alter table group_orders enable row level security;
alter table participants enable row level security;
alter table cart_items enable row level security;

-- Permissive policies for demo (production would scope these tighter)
create policy "Allow all on group_orders" on group_orders for all using (true) with check (true);
create policy "Allow all on participants" on participants for all using (true) with check (true);
create policy "Allow all on cart_items" on cart_items for all using (true) with check (true);

-- Enable Realtime (run these in the SQL editor too)
alter publication supabase_realtime add table cart_items;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table group_orders;
