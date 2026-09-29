-- Replace the demo window so this script can be safely rerun.
delete from public.current_readings
 where reading ->> 'timestamp' >= '2026-09-29T00:00:00+08:00'
   and reading ->> 'timestamp' < '2026-10-01T00:00:00+08:00'
   and reading ->> 'room' in ('Sala', 'Master Room', 'Living Room');

insert into public.current_readings (reading)
values
  (jsonb_build_object('room', 'Sala', 'kWh', 1.25, 'timestamp', '2026-09-29T14:30:00+08:00')),
  (jsonb_build_object('room', 'Sala', 'kWh', 1.42, 'timestamp', '2026-09-29T16:30:00+08:00')),
  (jsonb_build_object('room', 'Sala', 'kWh', 1.68, 'timestamp', '2026-09-29T18:30:00+08:00')),
  (jsonb_build_object('room', 'Sala', 'kWh', 1.11, 'timestamp', '2026-09-29T20:30:00+08:00')),
  (jsonb_build_object('room', 'Master Room', 'kWh', 2.10, 'timestamp', '2026-09-29T14:30:00+08:00')),
  (jsonb_build_object('room', 'Master Room', 'kWh', 2.35, 'timestamp', '2026-09-29T18:30:00+08:00')),
  (jsonb_build_object('room', 'Master Room', 'kWh', 2.75, 'timestamp', '2026-09-29T22:30:00+08:00')),
  (jsonb_build_object('room', 'Master Room', 'kWh', 1.95, 'timestamp', '2026-09-30T02:30:00+08:00')),
  (jsonb_build_object('room', 'Living Room', 'kWh', 1.80, 'timestamp', '2026-09-29T14:30:00+08:00')),
  (jsonb_build_object('room', 'Living Room', 'kWh', 2.20, 'timestamp', '2026-09-29T17:30:00+08:00')),
  (jsonb_build_object('room', 'Living Room', 'kWh', 2.65, 'timestamp', '2026-09-29T19:30:00+08:00')),
  (jsonb_build_object('room', 'Living Room', 'kWh', 2.05, 'timestamp', '2026-09-29T21:30:00+08:00'));

-- Expected totals: Sala 5.46, Master Room 9.15, Living Room 8.70,
-- Overall 23.31 kWh.
