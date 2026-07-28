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
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    phone text not null,
    email text,
    company_name text,
    preferred_contact_method text default 'Phone',
    address text,
    city text,
    state text,
    country text,
    postal_code text,
    status text default 'Active',
    notes text,
    created_at timestamptz not null default now(),
    created_by text,
    updated_at timestamptz,
    updated_by text
);

-- Migration helpers for customers table
alter table public.customers add column if not exists company_name text;
alter table public.customers add column if not exists preferred_contact_method text default 'Phone';
alter table public.customers add column if not exists city text;
alter table public.customers add column if not exists state text;
alter table public.customers add column if not exists country text;
alter table public.customers add column if not exists postal_code text;
alter table public.customers add column if not exists status text default 'Active';

-- Enable RLS
alter table public.customers enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on customers" on public.customers;
drop policy if exists "Allow all CRUD operations for authenticated users on customers" on public.customers;

-- Policies for customers
create policy "Allow all CRUD operations for authenticated users on customers"
    on public.customers for all
    to authenticated
    using (true)
    with check (true);


-- -----------------------------------------------------------------------------
-- 2. VEHICLES TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.vehicles (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    photo_url text,
    name text not null,
    type text not null,
    reg text not null,
    brand text,
    model text,
    manufacturing_year integer,
    color text,
    fuel_type text,
    seats integer default 4,
    odometer numeric default 0,
    assigned_driver_id text,
    assigned_driver_name text,
    status text not null default 'Available',
    rc_number text,
    rc_expiry text,
    rc_doc_url text,
    insurance_policy text,
    insurance_expiry text,
    insurance_doc_url text,
    fitness_expiry text,
    fitness_doc_url text,
    pollution_expiry text,
    permit_expiry text,
    permit_doc_url text,
    next_service_date text,
    next_service_odometer numeric,
    created_at timestamptz not null default now(),
    created_by text,
    updated_at timestamptz,
    updated_by text
);

-- Migration helpers for existing vehicles table
alter table public.vehicles add column if not exists photo_url text;
alter table public.vehicles add column if not exists brand text;
alter table public.vehicles add column if not exists model text;
alter table public.vehicles add column if not exists manufacturing_year integer;
alter table public.vehicles add column if not exists color text;
alter table public.vehicles add column if not exists fuel_type text;
alter table public.vehicles add column if not exists seats integer default 4;
alter table public.vehicles add column if not exists odometer numeric default 0;
alter table public.vehicles add column if not exists assigned_driver_id text;
alter table public.vehicles add column if not exists assigned_driver_name text;
alter table public.vehicles add column if not exists rc_number text;
alter table public.vehicles add column if not exists rc_expiry text;
alter table public.vehicles add column if not exists rc_doc_url text;
alter table public.vehicles add column if not exists insurance_policy text;
alter table public.vehicles add column if not exists insurance_expiry text;
alter table public.vehicles add column if not exists insurance_doc_url text;
alter table public.vehicles add column if not exists fitness_expiry text;
alter table public.vehicles add column if not exists fitness_doc_url text;
alter table public.vehicles add column if not exists pollution_expiry text;
alter table public.vehicles add column if not exists permit_expiry text;
alter table public.vehicles add column if not exists permit_doc_url text;
alter table public.vehicles add column if not exists next_service_date text;
alter table public.vehicles add column if not exists next_service_odometer numeric;

-- Enable RLS
alter table public.vehicles enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on vehicles" on public.vehicles;
drop policy if exists "Allow all CRUD operations for authenticated users on vehicles" on public.vehicles;

-- Policies for vehicles
create policy "Allow all CRUD operations for authenticated users on vehicles"
    on public.vehicles for all
    to authenticated
    using (true)
    with check (true);


-- -----------------------------------------------------------------------------
-- 3. TRIPS TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    customer text not null,
    customer_id text references public.customers(id) on delete set null,
    pickup_location text not null,
    destination text not null,
    trip_date text not null,
    trip_time text not null,
    vehicle text not null,
    vehicle_id text references public.vehicles(id) on delete set null,
    vehicle_reg text,
    driver_id text references public.drivers(id) on delete set null,
    driver_name text,
    driver_phone text,
    trip_type text default 'One Way',
    estimated_distance numeric,
    fare numeric not null,
    actual_fare numeric,
    status text not null default 'Booked',
    payment_status text not null default 'Unpaid',
    timeline jsonb default '[]'::jsonb,
    notes text,
    created_at timestamptz not null default now(),
    created_by text,
    updated_at timestamptz,
    updated_by text
);

-- Migration helpers for trips table
alter table public.trips add column if not exists driver_id text;
alter table public.trips add column if not exists driver_name text;
alter table public.trips add column if not exists driver_phone text;
alter table public.trips add column if not exists trip_type text default 'One Way';
alter table public.trips add column if not exists estimated_distance numeric;
alter table public.trips add column if not exists actual_fare numeric;
alter table public.trips add column if not exists timeline jsonb default '[]'::jsonb;

-- Enable RLS
alter table public.trips enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on trips" on public.trips;
drop policy if exists "Allow all CRUD operations for authenticated users on trips" on public.trips;

-- Policies for trips
create policy "Allow all CRUD operations for authenticated users on trips"
    on public.trips for all
    to authenticated
    using (true)
    with check (true);


-- -----------------------------------------------------------------------------
-- 4. VEHICLE MAINTENANCE TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.maintenance (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    vehicle_id text not null references public.vehicles(id) on delete cascade,
    type text not null,
    service_date text not null,
    cost numeric not null,
    odometer numeric,
    workshop text,
    notes text,
    created_at timestamptz not null default now(),
    created_by text
);

-- Migration helpers for maintenance table
alter table public.maintenance add column if not exists workshop text;

-- Enable RLS
alter table public.maintenance enable row level security;

-- Drop policy if exists to allow running the script multiple times without error
drop policy if exists "Allow all CRUD operations for owners on maintenance" on public.maintenance;
drop policy if exists "Allow all CRUD operations for authenticated users on maintenance" on public.maintenance;

-- Policies for maintenance
create policy "Allow all CRUD operations for authenticated users on maintenance"
    on public.maintenance for all
    to authenticated
    using (true)
    with check (true);


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
drop policy if exists "Allow all CRUD operations for authenticated users on payments" on public.payments;

-- Policies for payments
create policy "Allow all CRUD operations for authenticated users on payments"
    on public.payments for all
    to authenticated
    using (true)
    with check (true);


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
drop policy if exists "Allow all CRUD operations for authenticated users on transactions" on public.transactions;

-- Policies for transactions
create policy "Allow all CRUD operations for authenticated users on transactions"
    on public.transactions for all
    to authenticated
    using (true)
    with check (true);


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

-- -----------------------------------------------------------------------------
-- 8. COMPANY PROFILE TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.company_profile (
    id uuid primary key default gen_random_uuid(),
    business_name text not null,
    owner_name text not null,
    phone text not null,
    email text,
    gst_number text,
    address text not null,
    city text,
    state text,
    country text,
    postal_code text,
    logo_url text,
    currency text not null default 'INR',
    timezone text not null default 'Asia/Kolkata',
    date_format text not null default '12h',
    invoice_prefix text not null default 'NVX',
    starting_invoice_number text not null default '000001',
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    created_by uuid references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.company_profile enable row level security;

-- Drop policies if exist to allow running script multiple times without error
drop policy if exists "Allow read access for authenticated users on company_profile" on public.company_profile;
drop policy if exists "Allow write access for admins on company_profile" on public.company_profile;

-- Policies for company_profile
create policy "Allow read access for authenticated users on company_profile"
    on public.company_profile for select
    to authenticated
    using (true);

create policy "Allow write access for admins on company_profile"
    on public.company_profile for all
    to authenticated
    using (
        exists (
            select 1 from public.users
            where users.id = auth.uid() and users.role = 'Admin'
        )
    )
    with check (
        exists (
            select 1 from public.users
            where users.id = auth.uid() and users.role = 'Admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 9. DRIVERS TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.drivers (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade,
    photo_url text,
    full_name text not null,
    phone text not null,
    email text,
    date_of_birth text,
    address text,
    emergency_contact_name text,
    emergency_contact_phone text,
    license_number text not null,
    license_issue_date text,
    license_expiry_date text not null,
    assigned_vehicle_id text references public.vehicles(id) on delete set null,
    assigned_vehicle_name text,
    status text not null default 'Active',
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

-- Enable RLS
alter table public.drivers enable row level security;

-- Drop policy if exists to allow running script multiple times without error
drop policy if exists "Allow all CRUD operations for authenticated users on drivers" on public.drivers;

-- Policies for drivers
create policy "Allow all CRUD operations for authenticated users on drivers"
    on public.drivers for all
    to authenticated
    using (true)
    with check (true);

-- -----------------------------------------------------------------------------
-- 10. INVOICES TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.invoices (
    id text primary key,
    invoice_number text not null unique,
    trip_id text references public.trips(id) on delete set null,
    customer_id text references public.customers(id) on delete set null,
    customer_name text not null,
    customer_phone text,
    customer_email text,
    customer_address text,
    invoice_date date not null default current_date,
    due_date date not null,
    subtotal numeric not null default 0,
    tax_rate numeric default 0,
    tax_amount numeric default 0,
    total_amount numeric not null default 0,
    amount_paid numeric default 0,
    balance_due numeric default 0,
    payment_status text not null default 'Draft',
    payment_method text,
    payment_date date,
    reference_number text,
    notes text,
    company_details jsonb default '{}'::jsonb,
    trip_details jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    created_by text,
    user_id uuid references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.invoices enable row level security;

-- Drop policy if exists to allow running script multiple times without error
drop policy if exists "Allow all CRUD operations for authenticated users on invoices" on public.invoices;

-- Policies for invoices
create policy "Allow all CRUD operations for authenticated users on invoices"
    on public.invoices for all
    to authenticated
    using (true)
    with check (true);

-- -----------------------------------------------------------------------------
-- 11. FINANCE TRANSACTIONS TABLE
-- -----------------------------------------------------------------------------
create table if not exists public.finance_transactions (
    id text primary key,
    type text not null check (type in ('Income', 'Expense')),
    category text not null,
    amount numeric not null check (amount >= 0),
    description text not null,
    payment_method text not null default 'Cash',
    transaction_date date not null default current_date,
    customer_id text references public.customers(id) on delete set null,
    trip_id text references public.trips(id) on delete set null,
    invoice_id text references public.invoices(id) on delete set null,
    vehicle_id text references public.vehicles(id) on delete set null,
    vendor text,
    reference_number text,
    receipt_path text,
    notes text,
    created_by text,
    created_at timestamptz not null default now(),
    user_id uuid references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.finance_transactions enable row level security;

-- Drop policy if exists to allow running script multiple times without error
drop policy if exists "Allow all CRUD operations for authenticated users on finance_transactions" on public.finance_transactions;

-- Policies for finance_transactions
create policy "Allow all CRUD operations for authenticated users on finance_transactions"
    on public.finance_transactions for all
    to authenticated
    using (true)
    with check (true);

-- Enable Realtime replication for all core application tables including finance_transactions
alter publication supabase_realtime set table customers, vehicles, trips, maintenance, payments, transactions, company_profile, drivers, invoices, finance_transactions;
