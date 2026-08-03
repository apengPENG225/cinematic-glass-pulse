create extension if not exists pgcrypto with schema extensions;

-- 1. Bilik: penanda kunci + simpanan rahsia berasingan
alter table public.bilik add column if not exists ada_kata_laluan boolean not null default false;

create table if not exists public.bilik_rahsia (
  bilik_id uuid primary key references public.bilik(id) on delete cascade,
  cincang text not null,
  created_at timestamptz not null default now()
);
grant all on public.bilik_rahsia to service_role;
alter table public.bilik_rahsia enable row level security;

-- 2. Laporan mesej
create table if not exists public.laporan (
  id uuid primary key default gen_random_uuid(),
  mesej_id uuid references public.mesej(id) on delete cascade,
  pos_id uuid references public.pos(id) on delete cascade,
  pelapor uuid not null references auth.users(id) on delete cascade,
  sebab text not null,
  nota text,
  status text not null default 'baharu',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists laporan_unik_mesej on public.laporan(mesej_id, pelapor) where mesej_id is not null;
create unique index if not exists laporan_unik_pos on public.laporan(pos_id, pelapor) where pos_id is not null;

grant select, insert on public.laporan to authenticated;
grant all on public.laporan to service_role;
alter table public.laporan enable row level security;

create policy "Pelapor lihat laporan sendiri" on public.laporan
  for select to authenticated using (pelapor = auth.uid());

create policy "Pemilik bilik lihat laporan biliknya" on public.laporan
  for select to authenticated using (
    exists (
      select 1 from public.mesej m
      join public.bilik b on b.id = m.bilik_id
      where m.id = laporan.mesej_id and b.pemilik = auth.uid()
    )
  );

create policy "Pengguna hantar laporan" on public.laporan
  for insert to authenticated with check (pelapor = auth.uid());

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists laporan_updated_at on public.laporan;
create trigger laporan_updated_at before update on public.laporan
  for each row execute function public.update_updated_at_column();

-- 3. Status baca
create table if not exists public.bacaan (
  bilik_id uuid not null references public.bilik(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dibaca_pada timestamptz not null default now(),
  primary key (bilik_id, user_id)
);
grant select, insert, update on public.bacaan to authenticated;
grant all on public.bacaan to service_role;
alter table public.bacaan enable row level security;

create policy "Ahli lihat status baca" on public.bacaan
  for select to authenticated using (public.adalah_ahli(bilik_id, auth.uid()));
create policy "Simpan status baca sendiri" on public.bacaan
  for insert to authenticated with check (user_id = auth.uid() and public.adalah_ahli(bilik_id, auth.uid()));
create policy "Kemas kini status baca sendiri" on public.bacaan
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Anti-spam + kuota media
create or replace function public.had_mesej()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n_10s int;
  n_60s int;
  n_ulang int;
  n_imej int;
begin
  select count(*) into n_10s from public.mesej
    where user_id = new.user_id and created_at > now() - interval '10 seconds';
  if n_10s >= 5 then
    raise exception 'Terlalu laju. Sila tunggu beberapa saat sebelum menghantar mesej lagi.'
      using errcode = 'P0001';
  end if;

  select count(*) into n_60s from public.mesej
    where user_id = new.user_id and created_at > now() - interval '1 minute';
  if n_60s >= 25 then
    raise exception 'Had 25 mesej seminit dicapai. Sila berehat sebentar.'
      using errcode = 'P0001';
  end if;

  if coalesce(new.kandungan, '') <> '' then
    select count(*) into n_ulang from (
      select kandungan from public.mesej
        where user_id = new.user_id and bilik_id = new.bilik_id
        order by created_at desc limit 3
    ) t where t.kandungan = new.kandungan;
    if n_ulang >= 3 then
      raise exception 'Mesej berulang dikesan. Sila tulis sesuatu yang baharu.'
        using errcode = 'P0001';
    end if;
  end if;

  if new.imej_url is not null then
    select count(*) into n_imej from public.mesej
      where user_id = new.user_id and imej_url is not null
        and created_at > now() - interval '24 hours';
    if n_imej >= 20 then
      raise exception 'Kuota muat naik gambar (20 sehari) telah habis.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists had_mesej_trg on public.mesej;
create trigger had_mesej_trg before insert on public.mesej
  for each row execute function public.had_mesej();

create or replace function public.had_pos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n_60s int;
  n_imej int;
begin
  select count(*) into n_60s from public.pos
    where user_id = new.user_id and created_at > now() - interval '1 minute';
  if n_60s >= 10 then
    raise exception 'Terlalu banyak pos dalam masa singkat. Sila tunggu sebentar.'
      using errcode = 'P0001';
  end if;

  if new.imej_url is not null then
    select count(*) into n_imej from public.pos
      where user_id = new.user_id and imej_url is not null
        and created_at > now() - interval '24 hours';
    if n_imej >= 20 then
      raise exception 'Kuota muat naik gambar (20 sehari) telah habis.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists had_pos_trg on public.pos;
create trigger had_pos_trg before insert on public.pos
  for each row execute function public.had_pos();

-- 5. Cipta bilik (dengan kata laluan pilihan)
create or replace function public.cipta_bilik(_nama text, _tajuk text, _kod text, _kata_laluan text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_ada boolean := _kata_laluan is not null and length(trim(_kata_laluan)) >= 4;
begin
  if auth.uid() is null then
    raise exception 'Perlu log masuk.';
  end if;
  insert into public.bilik (nama, tajuk, kod, pemilik, ada_kata_laluan)
    values (trim(_nama), nullif(trim(coalesce(_tajuk,'')),''), lower(trim(_kod)), auth.uid(), v_ada)
    returning id into v_id;

  if v_ada then
    insert into public.bilik_rahsia (bilik_id, cincang)
      values (v_id, extensions.crypt(_kata_laluan, extensions.gen_salt('bf')));
  end if;

  insert into public.ahli_bilik (bilik_id, user_id, peranan)
    values (v_id, auth.uid(), 'hos')
    on conflict do nothing;

  return lower(trim(_kod));
end;
$$;

revoke all on function public.cipta_bilik(text, text, text, text) from public, anon;
grant execute on function public.cipta_bilik(text, text, text, text) to authenticated;

-- 6. Sertai bilik dengan kata laluan
drop function if exists public.sertai_bilik(text);

create or replace function public.sertai_bilik(_kod text, _kata_laluan text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  b public.bilik%rowtype;
  v_cincang text;
begin
  if auth.uid() is null then
    raise exception 'Perlu log masuk.';
  end if;

  select * into b from public.bilik where kod = lower(trim(_kod));
  if not found then
    raise exception 'Kod bilik tidak sah.' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.ahli_bilik where bilik_id = b.id and user_id = auth.uid()) then
    return b.id::text;
  end if;

  if b.ada_kata_laluan then
    select cincang into v_cincang from public.bilik_rahsia where bilik_id = b.id;
    if _kata_laluan is null or v_cincang is null
       or extensions.crypt(_kata_laluan, v_cincang) <> v_cincang then
      raise exception 'KATA_LALUAN_SALAH' using errcode = 'P0001';
    end if;
  end if;

  insert into public.ahli_bilik (bilik_id, user_id, peranan)
    values (b.id, auth.uid(), 'ahli')
    on conflict do nothing;

  return b.id::text;
end;
$$;

revoke all on function public.sertai_bilik(text, text) from public, anon;
grant execute on function public.sertai_bilik(text, text) to authenticated;

-- 7. Semak sama ada bilik berkunci (sebelum sertai)
create or replace function public.bilik_berkunci(_kod text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select ada_kata_laluan from public.bilik where kod = lower(trim(_kod))), false);
$$;

revoke all on function public.bilik_berkunci(text) from public, anon;
grant execute on function public.bilik_berkunci(text) to authenticated;

-- 8. Tetapkan / buang kata laluan (pemilik sahaja)
create or replace function public.tetap_kata_laluan(_bilik uuid, _kata_laluan text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from public.bilik where id = _bilik and pemilik = auth.uid()) then
    raise exception 'Hanya pemilik bilik boleh menukar kata laluan.';
  end if;

  if _kata_laluan is null or length(trim(_kata_laluan)) = 0 then
    delete from public.bilik_rahsia where bilik_id = _bilik;
    update public.bilik set ada_kata_laluan = false where id = _bilik;
    return false;
  end if;

  if length(trim(_kata_laluan)) < 4 then
    raise exception 'Kata laluan mesti sekurang-kurangnya 4 aksara.';
  end if;

  insert into public.bilik_rahsia (bilik_id, cincang)
    values (_bilik, extensions.crypt(_kata_laluan, extensions.gen_salt('bf')))
    on conflict (bilik_id) do update set cincang = excluded.cincang;
  update public.bilik set ada_kata_laluan = true where id = _bilik;
  return true;
end;
$$;

revoke all on function public.tetap_kata_laluan(uuid, text) from public, anon;
grant execute on function public.tetap_kata_laluan(uuid, text) to authenticated;

alter publication supabase_realtime add table public.bacaan;