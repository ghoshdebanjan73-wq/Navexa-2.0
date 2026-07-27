-- =============================================================================
-- NAVEXA SYSTEM DATABASE SCHEMA
-- PostgreSQL schema setup for Supabase DB
-- Includes table schemas, relationships, constraints, and Row Level Security.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CUSTOMERS TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.customers (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    phone text not null,
    email text,
    address text,
    notes text,
    created_at timestamptz not null default now(),
    created_by text,
    updated_at timestamptz,
    updated_by text
);

-- Enable RLS
alter table public.customers enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on customers" on public.customers;

-- Policies for customers
create policy "Allow all CRUD operations for owners on customers"
    on public.customers for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 2. VEHICLES TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.vehicles (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    type text not null,
    reg text not null,
    status text not null default 'Available',
    created_at timestamptz not null default now(),
    created_by text,
    updated_at timestamptz,
    updated_by text
);

-- Enable RLS
alter table public.vehicles enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on vehicles" on public.vehicles;

-- Policies for vehicles
create policy "Allow all CRUD operations for owners on vehicles"
    on public.vehicles for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 3. TRIPS TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    customer text not null,
    customer_id text references public.customers(id) on delete set null,
    pickup_location text not null,
    destination text not null,
    trip_date text not null,
    trip_time text not null,
    vehicle text not null,
    vehicle_id text references public.vehicles(id) on delete set null,
    vehicle_reg text,
    fare numeric not null,
    status text not null default 'Upcoming',
    payment_status text not null default 'Unpaid',
    notes text,
    created_at timestamptz not null default now(),
    created_by text,
    updated_at timestamptz,
    updated_by text
);

-- Enable RLS
alter table public.trips enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on trips" on public.trips;

-- Policies for trips
create policy "Allow all CRUD operations for owners on trips"
    on public.trips for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 4. VEHICLE MAINTENANCE TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.maintenance (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    vehicle_id text not null references public.vehicles(id) on delete cascade,
    type text not null,
    service_date text not null,
    cost numeric not null,
    odometer numeric,
    notes text,
    created_at timestamptz not null default now(),
    created_by text
);

-- Enable RLS
alter table public.maintenance enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on maintenance" on public.maintenance;

-- Policies for maintenance
create policy "Allow all CRUD operations for owners on maintenance"
    on public.maintenance for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 5. TRIP PAYMENTS TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    trip_id text not null references public.trips(id) on delete cascade,
    amount numeric not null,
    payment_date text not null,
    payment_method text not null,
    notes text,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.payments enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on payments" on public.payments;

-- Policies for payments
create policy "Allow all CRUD operations for owners on payments"
    on public.payments for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 6. MANUAL TRANSACTIONS TABLE (Finance Ledger)
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    transaction text not null,
    category text not null,
    date text not null,
    amount numeric not null,
    type text not null,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on transactions" on public.transactions;

-- Policies for transactions
create policy "Allow all CRUD operations for owners on transactions"
    on public.transactions for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 7. USER PROFILE TABLE & TRIGGERS
-- -----------------------------------------------------------------------------
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text,
    role text not null default 'Staff', -- 'Admin' or 'Staff'
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Drop policies if exist to allow running script multiple times without error
drop policy if exists "Allow read access for authenticated users on users" on public.users;
create policy "Allow read access for authenticated users on users"
    on public.users for select
    to authenticated
    using (true);

drop policy if exists "Allow update access for owners on users" on public.users;
create policy "Allow update access for owners on users"
    on public.users for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Function to handle new user creations
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Staff')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute when auth.users gets a new row
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Realtime replication for all core application tables
begin;
  alter publication supabase_realtime drop table if exists customers, vehicles, trips, maintenance, payments, transactions;
  alter publication supabase_realtime add table customers, vehicles, trips, maintenance, payments, transactions;
commit;
