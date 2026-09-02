"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateMockReadings } from "../mockData/MockReadings";
// Set NEXT_PUBLIC_USE_MOCK_ENERGY_DATA=true in .env.local to preview this
// component with generated data instead of hitting Supabase. Flip it back
// to unset/false (or delete the line) to go live — no code changes needed.
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_ENERGY_DATA === "true";

export function generateMockReadingsForMonth(deviceId: string, monthDate: Date) {
  const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  return generateMockReadings(deviceId, from, to);
}

export interface RoomConfig {
  id: string;
  label: string;
  /** value stored in sensors.device_id for this PZEM meter */
  deviceId: string;
  icon: LucideIcon;
  /** muted accent used for this room's icon chip + calendar highlights */
  accent: {
    chipBg: string;
    chipText: string;
    ring: string;
    dot: string;
  };
}

interface SensorRow {
  id: number;
  created_at: string;
  sensors: {
    device_id?: string;
    energy_kwh?: number;
    energy?: number;
  };
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Mon-first-blank-padded 6x7 grid of the given month, nulls outside the month */
function buildMonthGrid(viewMonth: Date): (Date | null)[][] {
  const first = startOfMonth(viewMonth);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = first.getDay(); // 0 = Sunday

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function RoomEnergyCard({ room }: { room: RoomConfig }) {
  const supabase = createClient();
  const Icon = room.icon;

  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [dailyTotals, setDailyTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const todayKey = dateKey(new Date());

  // Fetch and sum readings for the currently viewed month.
  // Runs on mount (so the collapsed card can show "today") and whenever
  // the room or the viewed month changes.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      let rows: SensorRow[];

      if (USE_MOCK_DATA) {
        // Local/offline preview path — no Supabase call at all.
        rows = generateMockReadingsForMonth(room.deviceId, viewMonth);
      } else {
        const from = startOfMonth(viewMonth).toISOString();
        const to = startOfNextMonth(viewMonth).toISOString();

        const { data, error: fetchError } = await supabase
          .from("nodered_sensors")
          .select("id, created_at, sensors")
          .contains("sensors", { device_id: room.deviceId })
          .gte("created_at", from)
          .lt("created_at", to)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (fetchError) {
          setError("Couldn't load this meter's readings.");
          setDailyTotals(new Map());
          setLoading(false);
          return;
        }

        rows = (data ?? []) as SensorRow[];
      }

      if (cancelled) return;

      const totals = new Map<string, number>();
      for (const row of rows) {
        const kwh = row.sensors?.energy_kwh ?? row.sensors?.energy ?? 0;
        const key = dateKey(new Date(row.created_at));
        totals.set(key, (totals.get(key) ?? 0) + kwh);
      }

      setDailyTotals(totals);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, room.deviceId, viewMonth]);

  const todayTotal = dailyTotals.get(todayKey) ?? 0;

  const monthTotal = useMemo(
    () => Array.from(dailyTotals.values()).reduce((sum, v) => sum + v, 0),
    [dailyTotals]
  );

  const tableRows = useMemo(
    () =>
      Array.from(dailyTotals.entries())
        .sort((a, b) => (a[0] < b[0] ? 1 : -1)),
    [dailyTotals]
  );

  const weeks = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const goToMonth = useCallback((offset: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setSelectedDay(null);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${room.accent.chipBg}`}
        >
          <Icon className={`h-5 w-5 ${room.accent.chipText}`} strokeWidth={1.75} />
        </span>

        <span className="flex-1">
          <span className="block text-sm font-medium text-neutral-900">{room.label}</span>
          <span className="block text-xs text-neutral-500">Today's usage</span>
        </span>

        <span className="text-right">
          <span className="block text-lg font-semibold tabular-nums text-neutral-900">
            {todayTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="ml-1 text-xs font-normal text-neutral-500">kWh</span>
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
          {error ? (
            <p className="py-4 text-sm text-red-600">{error}</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToMonth(-1)}
                  aria-label="Previous month"
                  className="rounded-full px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-50 focus-visible:ring-2"
                >
                  ‹
                </button>
                <span className="text-sm font-medium text-neutral-900">
                  {monthLabel(viewMonth)}
                </span>
                <button
                  type="button"
                  onClick={() => goToMonth(1)}
                  aria-label="Next month"
                  className="rounded-full px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-50 focus-visible:ring-2"
                >
                  ›
                </button>
              </div>

              {/* Calendar — each cell shows only the day's kWh total */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAY_LABELS.map((w, i) => (
                  <div key={i} className="pb-1 text-[11px] text-neutral-400">
                    {w}
                  </div>
                ))}

                {weeks.flatMap((week, wi) =>
                  week.map((day, di) => {
                    if (!day) return <div key={`${wi}-${di}`} />;
                    const key = dateKey(day);
                    const kwh = dailyTotals.get(key);
                    const isToday = key === todayKey;
                    const isSelected = key === selectedDay;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDay(key === selectedDay ? null : key)}
                        className={`flex flex-col items-center rounded-lg py-1.5 text-[11px] focus:outline-none focus-visible:ring-2 ${
                          isSelected
                            ? `${room.accent.chipBg} ${room.accent.chipText}`
                            : "text-neutral-700 hover:bg-neutral-50"
                        } ${isToday && !isSelected ? `ring-1 ${room.accent.ring}` : ""}`}
                      >
                        <span>{day.getDate()}</span>
                        <span
                          className={`mt-0.5 tabular-nums ${
                            kwh ? "" : "text-neutral-300"
                          }`}
                        >
                          {kwh ? kwh.toFixed(1) : "–"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>Month total</span>
                <span className="tabular-nums font-medium text-neutral-900">
                  {monthTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
                </span>
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-neutral-100">
                {loading ? (
                  <p className="px-3 py-6 text-center text-sm text-neutral-500">Loading…</p>
                ) : tableRows.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-neutral-500">
                    No readings recorded this month.
                  </p>
                ) : (
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-400">
                        <th className="px-3 py-2 text-xs font-medium">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-medium">kWh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map(([key, kwh]) => {
                        const d = new Date(`${key}T00:00:00`);
                        const isSelected = key === selectedDay;
                        return (
                          <tr
                            key={key}
                            className={`border-b border-neutral-50 last:border-0 ${
                              isSelected ? room.accent.chipBg : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-neutral-700">
                              {d.toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-neutral-900">
                              {kwh.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}