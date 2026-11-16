-- Use pzem_switches as the single source of truth for room toggle state.
-- Expected columns: device_id, sensor, is_on, updated_at.

create unique index if not exists pzem_switches_device_sensor_uidx
  on public.pzem_switches (device_id, sensor);

alter table public.pzem_switches enable row level security;

drop policy if exists pzem_switches_select_authenticated on public.pzem_switches;
create policy pzem_switches_select_authenticated
  on public.pzem_switches for select to authenticated
  using (true);

drop policy if exists pzem_switches_select_anon on public.pzem_switches;
create policy pzem_switches_select_anon
  on public.pzem_switches for select to anon
  using (true);

drop policy if exists pzem_switches_update_authenticated on public.pzem_switches;
create policy pzem_switches_update_authenticated
  on public.pzem_switches for update to authenticated
  using (true)
  with check (true);

drop policy if exists pzem_switches_update_anon on public.pzem_switches;
create policy pzem_switches_update_anon
  on public.pzem_switches for update to anon
  using (true)
  with check (true);

grant select, update on table public.pzem_switches to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'pzem_switches'
  ) then
    alter publication supabase_realtime add table public.pzem_switches;
  end if;
end;
$$;
