"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ENERGY_GROUP_DEFS, EnergyGroup, GroupId } from "../energy/Energy";
const TABLE = "pzem_status";

function toGroups(rows: any[]): EnergyGroup[] {
  return ENERGY_GROUP_DEFS.map((def) => {
    const row = rows.find((r) => r.group_id === def.id);
    return {
      id: def.id,
      name: def.name,
      color: def.color,
      isOn: row?.is_on ?? false,
      reading: {
        ampere: Number(row?.ampere ?? 0),
        power: Number(row?.power ?? 0),
        energy: Number(row?.energy ?? 0),
      },
    };
  });
}

export function useEnergyStatus() {
  const supabase = createClient();
  const [groups, setGroups] = useState<EnergyGroup[]>(toGroups([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const togglingRef = useRef<Set<GroupId>>(new Set());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from(TABLE)
        .select("group_id, ampere, power, energy, is_on");

      if (fetchError) {
        console.warn("Could not load pzem_status:", fetchError.message);
        setError("Could not load live readings.");
      } else {
        setGroups(toGroups(data ?? []));
      }
      setLoading(false);
    };

    load();

    // Live sensor updates as PZEM modules push new readings.
    channel = supabase
      .channel("pzem_status_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        (payload) => {
          setGroups((prev) => {
            const row: any = payload.new ?? payload.old;
            if (!row?.group_id) return prev;
            // Ignore echoes of our own optimistic toggle while it's in flight.
            if (togglingRef.current.has(row.group_id) && payload.eventType === "UPDATE") {
              togglingRef.current.delete(row.group_id);
            }
            return prev.map((g) =>
              g.id === row.group_id
                ? {
                    ...g,
                    isOn: row.is_on ?? g.isOn,
                    reading: {
                      ampere: Number(row.ampere ?? g.reading.ampere),
                      power: Number(row.power ?? g.reading.power),
                      energy: Number(row.energy ?? g.reading.energy),
                    },
                  }
                : g
            );
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  const toggleGroup = async (id: GroupId) => {
    const current = groups.find((g) => g.id === id);
    if (!current) return;

    const nextOn = !current.isOn;
    togglingRef.current.add(id);
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, isOn: nextOn } : g)));
    setError(null);

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ is_on: nextOn })
      .eq("group_id", id);

    if (updateError) {
      console.error("Failed to toggle group:", updateError);
      setError(`Could not switch ${current.name}. Please try again.`);
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, isOn: !nextOn } : g)));
      togglingRef.current.delete(id);
    }
  };

  return { groups, loading, error, toggleGroup };
}