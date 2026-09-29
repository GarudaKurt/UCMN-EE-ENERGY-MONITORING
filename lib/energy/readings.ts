export type RoomName = "Sala" | "Master Room" | "Living Room";

export interface CurrentReading {
  room: RoomName;
  kWh: number;
  timestamp: string;
}

export interface SensorRow {
  id: number;
  created_at: string;
  sensors: Record<string, unknown> | null;
  current_readings?: unknown;
}

export interface CurrentReadingRow {
  id: number;
  reading: unknown;
}

const DEVICE_ROOM_MAP: Record<string, RoomName> = {
  "pzem-sala": "Sala",
  "pzem-master-bedroom": "Master Room",
  "pzem-master-room": "Master Room",
  "pzem-living-room": "Living Room",
};

function normalizeRoom(value: unknown): RoomName | null {
  if (typeof value !== "string") return null;

  const key = value.trim().toLowerCase().replace(/[_-]/g, " ");
  if (key === "sala") return "Sala";
  if (key === "master room" || key === "master bedroom") return "Master Room";
  if (key === "living room") return "Living Room";
  return null;
}

function asReading(value: unknown): CurrentReading | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const room = normalizeRoom(item.room);
  const kWh = typeof item.kWh === "number" ? item.kWh : Number(item.kWh);
  const timestamp = typeof item.timestamp === "string" ? item.timestamp : "";

  if (!room || !Number.isFinite(kWh) || !timestamp || Number.isNaN(Date.parse(timestamp))) {
    return null;
  }

  return { room, kWh, timestamp };
}

function legacyReading(row: SensorRow): CurrentReading | null {
  const deviceId = row.sensors?.device_id;
  const room = DEVICE_ROOM_MAP[String(deviceId ?? "").toLowerCase()];
  const rawKwh = row.sensors?.energy_kwh ?? row.sensors?.energy;
  const kWh = typeof rawKwh === "number" ? rawKwh : Number(rawKwh);

  if (!room || !Number.isFinite(kWh) || !row.created_at) return null;
  return { room, kWh, timestamp: row.created_at };
}

/** Convert both the new JSONB batch and legacy Node-RED rows into one history. */
export function normalizeSensorRows(rows: SensorRow[]): CurrentReading[] {
  const readings: CurrentReading[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const batch = Array.isArray(row.current_readings)
      ? row.current_readings.map(asReading).filter((reading): reading is CurrentReading => reading !== null)
      : [];
    const rowReadings = batch.length > 0 ? batch : [legacyReading(row)].filter(
      (reading): reading is CurrentReading => reading !== null
    );

    for (const reading of rowReadings) {
      const key = `${reading.room}|${reading.timestamp}|${reading.kWh}`;
      if (seen.has(key)) continue;
      seen.add(key);
      readings.push(reading);
    }
  }

  return readings.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export function normalizeCurrentReadingRows(rows: CurrentReadingRow[]): CurrentReading[] {
  const readings: CurrentReading[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const reading = asReading(row.reading);
    if (!reading) continue;

    const key = `${reading.room}|${reading.timestamp}|${reading.kWh}`;
    if (seen.has(key)) continue;
    seen.add(key);
    readings.push(reading);
  }

  return readings.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export function roomNameForId(id: string): RoomName | null {
  if (id === "sala") return "Sala";
  if (id === "master-bedroom") return "Master Room";
  if (id === "living-room") return "Living Room";
  return null;
}
