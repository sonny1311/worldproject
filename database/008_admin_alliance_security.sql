-- WorldProject: serverseitige Admin-/Allianz-Sicherheit
-- Allianz bleibt standardmäßig deaktiviert und ohne öffentliche Player-Policy.

create table if not exists public.admin_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','moderator','support','economy')),
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.admin_feature_flags(key,enabled,config) values
 ('alliances',false,'{"playerVisible":false,"creationEnabled":false,"applicationsEnabled":false,"publicRanking":false}'::jsonb),
 ('global_chat',false,'{}'::jsonb),
 ('maintenance_mode',false,'{}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.alliances (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  tag text not null unique,
  language text not null default 'de',
  description text not null default '',
  status text not null default 'active',
  settings jsonb not null default '{"joinMode":"invite","maxMembers":50}'::jsonb,
  treasury numeric(18,2) not null default 0 check (treasury >= 0),
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.alliance_members (
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid,
  role text not null default 'member' check (role in ('leader','officer','treasurer','member')),
  contribution numeric(18,2) not null default 0,
  joined_at timestamptz not null default now(),
  primary key(alliance_id,user_id),
  unique(user_id)
);

create table if not exists public.alliance_invites (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id),
  status text not null default 'open',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.alliance_projects (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  title text not null,
  project_type text not null default 'community',
  target numeric(18,2) not null check(target > 0),
  progress numeric(18,2) not null default 0 check(progress >= 0),
  status text not null default 'active',
  deadline timestamptz,
  created_at timestamptz not null default now()
);

alter table public.admin_staff enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.admin_feature_flags enable row level security;
alter table public.alliances enable row level security;
alter table public.alliance_members enable row level security;
alter table public.alliance_invites enable row level security;
alter table public.alliance_projects enable row level security;

create or replace function public.is_worldproject_admin(required_roles text[] default array['owner','admin'])
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_staff s where s.user_id=auth.uid() and s.active=true and s.role=any(required_roles));
$$;

-- Admin Tabellen: nur autorisierte Rollen.
drop policy if exists admin_staff_read on public.admin_staff;
create policy admin_staff_read on public.admin_staff for select using (public.is_worldproject_admin(array['owner','admin']));
drop policy if exists admin_staff_write on public.admin_staff;
create policy admin_staff_write on public.admin_staff for all using (public.is_worldproject_admin(array['owner'])) with check (public.is_worldproject_admin(array['owner']));

drop policy if exists admin_audit_read on public.admin_audit_log;
create policy admin_audit_read on public.admin_audit_log for select using (public.is_worldproject_admin(array['owner','admin','moderator']));
drop policy if exists admin_audit_insert on public.admin_audit_log;
create policy admin_audit_insert on public.admin_audit_log for insert with check (public.is_worldproject_admin(array['owner','admin','moderator','support','economy']));

drop policy if exists admin_flags_read on public.admin_feature_flags;
create policy admin_flags_read on public.admin_feature_flags for select using (public.is_worldproject_admin(array['owner','admin']));
drop policy if exists admin_flags_write on public.admin_feature_flags;
create policy admin_flags_write on public.admin_feature_flags for all using (public.is_worldproject_admin(array['owner','admin'])) with check (public.is_worldproject_admin(array['owner','admin']));

-- Allianz ist vor Launch ausschließlich für Admins erreichbar.
-- Beim späteren Einschalten werden gezielt zusätzliche Player-Policies ergänzt;
-- bis dahin kann kein normaler Spieler Allianz-Daten lesen oder schreiben.
drop policy if exists alliances_admin_only on public.alliances;
create policy alliances_admin_only on public.alliances for all using (public.is_worldproject_admin(array['owner','admin'])) with check (public.is_worldproject_admin(array['owner','admin']));
drop policy if exists alliance_members_admin_only on public.alliance_members;
create policy alliance_members_admin_only on public.alliance_members for all using (public.is_worldproject_admin(array['owner','admin'])) with check (public.is_worldproject_admin(array['owner','admin']));
drop policy if exists alliance_invites_admin_only on public.alliance_invites;
create policy alliance_invites_admin_only on public.alliance_invites for all using (public.is_worldproject_admin(array['owner','admin'])) with check (public.is_worldproject_admin(array['owner','admin']));
drop policy if exists alliance_projects_admin_only on public.alliance_projects;
create policy alliance_projects_admin_only on public.alliance_projects for all using (public.is_worldproject_admin(array['owner','admin'])) with check (public.is_worldproject_admin(array['owner','admin']));
