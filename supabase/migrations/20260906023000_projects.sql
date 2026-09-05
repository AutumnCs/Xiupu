create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_guest_id text not null,
  share_token text not null unique,
  title text not null default '未命名节目',
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_guest_id_idx on public.projects (owner_guest_id);
create index if not exists projects_share_token_idx on public.projects (share_token);

alter table public.projects enable row level security;
revoke all on public.projects from anon, authenticated;
grant all on public.projects to service_role;

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  summary text not null default '工作台保存',
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create index if not exists project_versions_project_id_idx on public.project_versions (project_id, version desc);
alter table public.project_versions enable row level security;
revoke all on public.project_versions from anon, authenticated;
grant all on public.project_versions to service_role;
