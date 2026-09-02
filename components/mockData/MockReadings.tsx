// Mock reading generator matching the exact shape RoomEnergyCard expects
// back from Supabase ({ id, created_at, sensors: { device_id, energy_kwh } }).
// Useful for previewing the UI locally without a live Supabase connection —
// e.g. in Storybook, a quick test page, or by temporarily swapping the
// `.from("nodered_sensors")...` call in RoomEnergyCard for a Promise that
// resolves to `data: generateMockReadings(room.deviceId, viewMonth)`.

interface MockSensorRow {
  id: number;
  created_at: string;
  sensors: {
    device_id: string;
    energy_kwh: number;
  };
}

// Base hourly load (kWh) and a day-part shape per room, mirroring
// seed-mock-readings.sql so the two stay consistent with each other.
const ROOM_PROFILES: Record<
  string,
  { baseKwh: number; multiplier: (hour: number, dow: number) => number }
> = {
  "PZEM-MASTER-BEDROOM": {
    baseKwh: 0.35,
    multiplier: (hour) => (hour >= 22 || hour <= 6 ? 1.6 : 0.4),
  },
  "PZEM-SALA": {
    baseKwh: 0.18,
    multiplier: () => 1.0,
  },
  "PZEM-LIVING-ROOM": {
    baseKwh: 0.28,
    multiplier: (hour, dow) => {
      if (hour >= 18 && hour <= 22) return 1.8;
      if ((dow === 0 || dow === 6) && hour >= 13 && hour <= 17) return 1.4;
      return 0.5;
    },
  },
};

/**
 * Generates one hourly reading per hour between `from` and `to` (inclusive
 * of `from`, exclusive of `to`) for the given device, with a per-room
 * day-part shape and +/-15% random noise.
 */
export function generateMockReadings(
  deviceId: string,
  from: Date,
  to: Date
): MockSensorRow[] {
  const profile = ROOM_PROFILES[deviceId] ?? { baseKwh: 0.2, multiplier: () => 1 };
  const rows: MockSensorRow[] = [];

  let idCounter = 1;
  for (let ts = new Date(from); ts < to; ts = new Date(ts.getTime() + 60 * 60 * 1000)) {
    const hour = ts.getHours();
    const dow = ts.getDay();
    const noise = 0.85 + Math.random() * 0.3;
    const energy = Number((profile.baseKwh * profile.multiplier(hour, dow) * noise).toFixed(3));

    rows.push({
      id: idCounter++,
      created_at: ts.toISOString(),
      sensors: { device_id: deviceId, energy_kwh: energy },
    });
  }

  return rows;
}

/** Convenience: mock readings for a whole calendar month. */
export function generateMockReadingsForMonth(deviceId: string, monthDate: Date) {
  const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  return generateMockReadings(deviceId, from, to);
}