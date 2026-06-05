-- Run in Supabase SQL editor, or locally: npm run db:setup

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  full_name text not null default '',
  phone text not null default '',
  picture_url text not null default '',
  locale text not null default '',
  email_verified text not null default '',
  google_id text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists prospects_email_unique_idx on public.prospects (lower(email));

insert into storage.buckets (id, name, public)
values ('prospect-photos', 'prospect-photos', true)
on conflict (id) do nothing;

create policy "Public read prospect photos"
on storage.objects for select
using (bucket_id = 'prospect-photos');
