-- WILKAXYZ: jalankan seluruh file ini di Supabase > SQL Editor
-- Admin: wilkaaffah@gmail.com

create table if not exists public.admins (email text primary key);
insert into public.admins (email) values ('wilkaaffah@gmail.com')
  on conflict do nothing;
alter table public.admins enable row level security; -- tanpa policy = tertutup

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create table if not exists public.media_items (
  id bigint primary key,
  title text not null,
  subtitle text default '',
  category text default '',
  kind text not null,
  tags text[] default '{}',
  image text,
  date text,
  size text,
  size_bytes bigint,
  ratio text default 'landscape',
  owner_id uuid references auth.users(id) on delete set null,
  owner_name text,
  owner_email text,
  created_at timestamptz default now()
);

alter table public.media_items enable row level security;

-- semua orang (login atau tidak) boleh melihat
create policy "read all" on public.media_items for select using (true);
-- upload: wajib login Google, dan harus atas nama sendiri
create policy "insert own" on public.media_items for insert to authenticated
  with check (owner_id = auth.uid());
-- ubah/hapus: pemilik item atau admin
create policy "update own or admin" on public.media_items for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "delete own or admin" on public.media_items for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

alter publication supabase_realtime add table public.media_items;

-- Storage untuk foto (publik dibaca, upload hanya ke folder sendiri)
insert into storage.buckets (id, name, public, file_size_limit)
  values ('media', 'media', true, 20971520) on conflict (id) do nothing;

create policy "media read" on storage.objects for select using (bucket_id = 'media');
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
