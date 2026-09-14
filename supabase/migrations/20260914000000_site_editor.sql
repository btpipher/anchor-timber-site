create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

create table if not exists public.site_content (
  id text primary key check (id in ('business', 'sawmill', 'firewood')),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

grant select on table public.site_content to anon, authenticated;
grant insert, update on table public.site_content to authenticated;

create policy "Public site content is readable"
on public.site_content for select
to anon, authenticated
using (true);

create policy "Only site administrators can add content"
on public.site_content for insert
to authenticated
with check (
  (select public.is_site_admin())
);

create policy "Only site administrators can update content"
on public.site_content for update
to authenticated
using (
  (select public.is_site_admin())
)
with check (
  (select public.is_site_admin())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Site images are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-images');

create policy "Only site administrators can upload images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);

create policy "Only site administrators can update images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
)
with check (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);

create policy "Only site administrators can delete images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_site_admin())
);
