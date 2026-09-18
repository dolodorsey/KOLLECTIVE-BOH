-- Ambassador packet system
-- Applied to KOLLECTIVE BOH production on 2026-09-18.
-- Public RLS is enabled with no public policies by design; service/admin access only.

create table if not exists public.growth_ambassador_packet_templates (
  id uuid primary key default gen_random_uuid(),
  packet_key text not null unique,
  program_id uuid references public.growth_ambassador_programs(id) on delete set null,
  enterprise_entity_id uuid references public.enterprise_directory_records(id) on delete set null,
  brand_key text not null,
  role_key text not null default 'ambassador',
  display_name text not null,
  version text not null default '2026.09',
  status text not null default 'draft',
  legal_review_status text not null default 'jurisdiction_review_required',
  origin_story_status text not null default 'unverified_do_not_publish',
  source_docx_name text,
  source_pdf_name text,
  compensation_status text not null default 'personalization_required',
  regulated_category text,
  public_link text,
  content jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_ambassador_packet_templates_brand_idx
  on public.growth_ambassador_packet_templates (brand_key, role_key, status);
alter table public.growth_ambassador_packet_templates enable row level security;

create table if not exists public.growth_ambassador_program_links (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.growth_ambassador_programs(id) on delete cascade,
  brand_key text not null,
  link_type text not null,
  label text not null,
  url text,
  status text not null default 'pending',
  qr_enabled boolean not null default false,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_key, link_type, label)
);
create index if not exists growth_ambassador_program_links_program_idx
  on public.growth_ambassador_program_links (program_id, status);
alter table public.growth_ambassador_program_links enable row level security;

create table if not exists public.growth_ambassador_referrals (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.growth_ambassador_programs(id) on delete set null,
  referrer_member_id uuid references public.growth_ambassador_members(id) on delete set null,
  brand_key text not null,
  referred_name text not null,
  referred_handle text,
  referred_email text,
  referred_city text,
  referral_reason text,
  status text not null default 'submitted',
  converted_member_id uuid references public.growth_ambassador_members(id) on delete set null,
  reward_status text not null default 'not_applicable_until_approved',
  reward_terms jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  recommended_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_ambassador_referrals_referrer_idx
  on public.growth_ambassador_referrals (referrer_member_id, status);
create index if not exists growth_ambassador_referrals_brand_idx
  on public.growth_ambassador_referrals (brand_key, status);
alter table public.growth_ambassador_referrals enable row level security;

create table if not exists public.growth_ambassador_role_profiles (
  id uuid primary key default gen_random_uuid(),
  brand_key text not null,
  role_key text not null,
  display_name text not null,
  category text not null,
  status text not null default 'active',
  compensation_model jsonb not null default '{}'::jsonb,
  posting_plan jsonb not null default '{}'::jsonb,
  deliverables jsonb not null default '{}'::jsonb,
  agreement_controls jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_key, role_key)
);
alter table public.growth_ambassador_role_profiles enable row level security;
