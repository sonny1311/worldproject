-- WorldProject: Langzeit-Expansion, Standorte, Management und Ausbaustufen
alter table public.companies add column if not exists location_class text not null default 'smallTown';
alter table public.companies add column if not exists property_mode text not null default 'rent';
alter table public.companies add column if not exists property_size_level integer not null default 1;
alter table public.companies add column if not exists upgrades jsonb not null default '{}'::jsonb;
alter table public.companies add column if not exists management_staff jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists asset_value numeric(18,2) not null default 0;
alter table public.companies add column if not exists debt numeric(18,2) not null default 0;
alter table public.companies add column if not exists founded_at timestamptz not null default now();
create index if not exists idx_companies_user_founded on public.companies(user_id, founded_at);
comment on column public.companies.upgrades is 'Langzeit-Ausbaustufen des Betriebs; Balancingwerte werden spaeter angepasst.';
comment on column public.companies.management_staff is 'Managementstruktur fuer mehrere Betriebe.';
