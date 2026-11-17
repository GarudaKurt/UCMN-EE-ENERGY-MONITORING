"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HOME_GROUP_DEFS, EnergyGroup, GroupId, SENSOR_TO_GROUP } from "../energy/Energy";

const LIVE_TABLE = "live_sensor_readings";
const TOGGLE_TABLE = "pzem_switches";
const SWITCH_DEVICE_ID = "esp32-monitoring";
const GROUP_TO_SWITCH_SENSOR: Record<GroupId, string> = {
  sala: "sala",
  "living-room": "livingroom",
  "master-bedroom": "master",
};

interface LiveSensorRow {
  device_id?: string;
  sensor?: string;
  voltage_v?: number | string | null;
  current_a?: number | string | null;
  voltage?: number | string | null;
  current?: number | string | null;
  power_w?: number | string | null;
  energy_kwh?: number | string | null;
  recorded_at?: string | null;
  updated_at?: string | null;
}

interface ToggleRow {
  device_id?: string;
  sensor?: string;
  is_on?: boolean | null;
}

function toGroups(liveRows: LiveSensorRow[], toggleRows: ToggleRow[]): EnergyGroup[] {
  return HOME_GROUP_DEFS.map((def) => {
    const matchingRows = liveRows.filter((row) => SENSOR_TO_GROUP[row.sensor ?? ""] === def.id);
    const liveRow = matchingRows.sort((a, b) =>
      new Date(b.updated_at ?? b.recorded_at ?? 0).getTime() -
      new Date(a.updated_at ?? a.recorded_at ?? 0).getTime()
    )[0];
    const toggleRow = toggleRows.find((row) => row.sensor === GROUP_TO_SWITCH_SENSOR[def.id]);

    return {
      id: def.id,
      name: def.name,
      color: def.color,
      isOn: toggleRow?.is_on ?? false,
      reading: {
        voltage: Number(liveRow?.voltage_v ?? liveRow?.voltage ?? 0),
        ampere: Number(liveRow?.current_a ?? liveRow?.current ?? 0),
        power: Number(liveRow?.power_w ?? 0),
        energy: Number(liveRow?.energy_kwh ?? 0),
      },
      updatedAt: liveRow?.updated_at ?? liveRow?.recorded_at ?? undefined,
    };
  });
}

export function useEnergyStatus() {
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<EnergyGroup[]>(toGroups([], []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const togglingRef = useRef<Set<GroupId>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let liveChannel: ReturnType<typeof supabase.channel> | null = null;
    let toggleChannel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const [{ data: liveRows, error: liveError }, { data: toggleRows, error: toggleError }] =
        await Promise.all([
          supabase
            .from(LIVE_TABLE)
            .select("device_id, sensor, voltage_v, current_a, voltage, current, power_w, energy_kwh, recorded_at, updated_at")
            // Sensor names identify the monitoring zones. Do not hard-code a
            // device id here: the active Node-RED device is configurable and
            // may differ between deployments (for example esp32-iot-meter).
            .order("updated_at", { ascending: false }),
          supabase
            .from(TOGGLE_TABLE)
            .select("device_id, sensor, is_on")
            .eq("device_id", SWITCH_DEVICE_ID),
        ]);

      if (cancelled) return;

      if (liveError || toggleError) {
        setError("Could not load live readings.");
      } else {
        setGroups(toGroups((liveRows ?? []) as LiveSensorRow[], (toggleRows ?? []) as ToggleRow[]));
      }
      setLoading(false);
    };

    load();

    liveChannel = supabase
      .channel("live_sensor_readings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: LIVE_TABLE }, (payload) => {
        if (payload.eventType === "DELETE") return;
        const row = payload.new as LiveSensorRow | null;
        const groupId = SENSOR_TO_GROUP[row?.sensor ?? ""];
        if (!groupId) return;

        setGroups((prev) => prev.map((group) => {
          if (group.id !== groupId) return group;
          const incomingAt = row?.updated_at ?? row?.recorded_at ?? undefined;
          if (incomingAt && group.updatedAt && new Date(incomingAt).getTime() < new Date(group.updatedAt).getTime()) {
            return group;
          }
          return {
            ...group,
            updatedAt: incomingAt ?? group.updatedAt,
            reading: {
              voltage: Number(row?.voltage_v ?? row?.voltage ?? group.reading.voltage),
              ampere: Number(row?.current_a ?? row?.current ?? group.reading.ampere),
              power: Number(row?.power_w ?? group.reading.power),
              energy: Number(row?.energy_kwh ?? group.reading.energy),
            },
          };
        }));
      })
      .subscribe();

    toggleChannel = supabase
      .channel("pzem_switches_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: TOGGLE_TABLE, filter: `device_id=eq.${SWITCH_DEVICE_ID}` }, (payload) => {
        const row = (payload.new ?? payload.old) as ToggleRow | null;
        if (!row?.sensor) return;
        const groupId = (Object.entries(GROUP_TO_SWITCH_SENSOR).find(([, sensor]) => sensor === row.sensor)?.[0]) as GroupId | undefined;
        if (!groupId) return;
        togglingRef.current.delete(groupId);
        setGroups((prev) => prev.map((group) =>
          group.id === groupId ? { ...group, isOn: row.is_on ?? group.isOn } : group
        ));
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (liveChannel) supabase.removeChannel(liveChannel);
      if (toggleChannel) supabase.removeChannel(toggleChannel);
    };
  }, [supabase]);

  const toggleGroup = async (id: GroupId) => {
    const current = groups.find((group) => group.id === id);
    if (!current || togglingRef.current.has(id)) return;

    const nextOn = !current.isOn;
    togglingRef.current.add(id);
    setGroups((prev) => prev.map((group) => (group.id === id ? { ...group, isOn: nextOn } : group)));
    setError(null);

    const { error: updateError } = await supabase
      .from(TOGGLE_TABLE)
      .update({ is_on: nextOn, updated_at: new Date().toISOString() })
      .eq("device_id", SWITCH_DEVICE_ID)
      .eq("sensor", GROUP_TO_SWITCH_SENSOR[id]);

    if (updateError) {
      setError(`Could not switch ${current.name}. Please try again.`);
      setGroups((prev) => prev.map((group) => (group.id === id ? { ...group, isOn: !nextOn } : group)));
      togglingRef.current.delete(id);
    }
  };

  return { groups, loading, error, toggleGroup };
}
