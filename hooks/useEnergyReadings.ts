"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeCurrentReadingRows,
  normalizeSensorRows,
  CurrentReading,
  CurrentReadingRow,
  SensorRow,
} from "@/lib/energy/readings";

export function useEnergyReadings() {
  const supabase = useMemo(() => createClient(), []);
  const [readings, setReadings] = useState<CurrentReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const withCurrentReadings = await supabase
        .from("current_readings")
        .select("id, reading")
        .order("created_at", { ascending: true });

      const currentRows: CurrentReadingRow[] = (withCurrentReadings.data ?? []) as CurrentReadingRow[];
      let loadError = withCurrentReadings.error;

      // Keep existing deployments usable while the dedicated table is being deployed.
      if (withCurrentReadings.error?.code === "PGRST204" || withCurrentReadings.error?.code === "PGRST205") {
        const legacyResult = await supabase
          .from("nodered_sensors")
          .select("id, created_at, sensors")
          .order("created_at", { ascending: true });
        const rows = (legacyResult.data ?? []) as SensorRow[];
        loadError = legacyResult.error;

        if (!legacyResult.error) {
          setReadings(normalizeSensorRows(rows));
        }
      }

      if (cancelled) return;

      if (loadError) {
        setError("Couldn’t load sensor readings.");
      } else if (!withCurrentReadings.error) {
        setReadings(normalizeCurrentReadingRows(currentRows));
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { readings, loading, error };
}
