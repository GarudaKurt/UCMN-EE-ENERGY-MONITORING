-- Store the latest batch of room readings alongside each Node-RED sensor row.
-- The value is a JSONB array of:
-- { "room": "Sala", "kWh": 1.25, "timestamp": "2026-09-29T14:30:00+08:00" }
alter table public.nodered_sensors
  add column if not exists current_readings jsonb not null default '[]'::jsonb;

alter table public.nodered_sensors
  drop constraint if exists nodered_sensors_current_readings_is_array;

alter table public.nodered_sensors
  add constraint nodered_sensors_current_readings_is_array
  check (jsonb_typeof(current_readings) = 'array');
