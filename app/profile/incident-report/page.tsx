"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/bottom-nav/BottomNav";
import { createClient } from "@/lib/supabase/client";

interface SensorReading {
  id: number;
  created_at: string;
  sensors: {
    device_id?: string;
    timestamp?: number;
    temperature?: number;
    humidity?: number;
    lat?: string | number;
    lon?: string | number;
  };
}

const PAGE_SIZE = 10;

const IncidentReport = () => {
  const supabase = createClient();

  const [logs, setLogs] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-indexed
  const [totalCount, setTotalCount] = useState(0);

  // Step 1: resolve the user's device_id once
  useEffect(() => {
    const loadDevice = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Could not load your sensor logs. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: patient, error: patientError } = await supabase
        .from("patient_status")
        .select("device_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (patientError) {
        console.warn("Failed to look up patient:", patientError.message);
        setLoading(false);
        return;
      }

      if (!patient?.device_id) {
        console.warn("No linked device found for this user yet.");
        setLoading(false);
        return;
      }

      setDeviceId(patient.device_id);
    };

    loadDevice();
  }, [supabase]);

  // Step 2: fetch a page of readings whenever deviceId or page changes
  useEffect(() => {
    if (!deviceId) return;

    const loadPage = async () => {
      setLoading(true);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: rows, error: sensorError, count } = await supabase
        .from("nodered_sensors")
        .select("id, created_at, sensors", { count: "exact" })
        .contains("sensors", { device_id: deviceId })
        .order("created_at", { ascending: false }) // latest first
        .range(from, to);

      if (sensorError) {
        console.warn("Failed to load sensor readings:", sensorError.message);
        setLogs([]);
      } else {
        setLogs(rows ?? []);
        setTotalCount(count ?? 0);
      }

      setLoading(false);
    };

    loadPage();
  }, [supabase, deviceId, page]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLocation = (lat?: string | number, lon?: string | number) => {
    if (lat === undefined || lon === undefined) return "Unknown";
    return `${lat}, ${lon}`;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-neutral-500">Loading sensor logs...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="px-5 py-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  } else if (logs.length === 0) {
    content = (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-neutral-500">No sensor readings recorded yet.</p>
      </div>
    );
  } else {
    content = (
      <>
        <div className="overflow-x-auto px-5 pt-2">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="py-2 pr-4 font-medium">Detected At</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">Temp (°C)</th>
                <th className="py-2 font-medium">Humidity (%)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-100">
                  <td className="py-3 pr-4 text-neutral-700">{formatDate(log.created_at)}</td>
                  <td className="py-3 pr-4 text-neutral-700">
                    {formatLocation(log.sensors?.lat, log.sensors?.lon)}
                  </td>
                  <td className="py-3 pr-4 text-neutral-700">{log.sensors?.temperature ?? "—"}</td>
                  <td className="py-3 text-neutral-700">{log.sensors?.humidity ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!canPrev}
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-600 transition disabled:opacity-40 hover:bg-neutral-50"
          >
            Previous
          </button>
          <span className="text-xs text-neutral-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={!canNext}
            className="rounded-full border bg-blue-400 text-white px-4 py-2 text-xs font-semibold text-neutral-600 transition disabled:opacity-40 hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <main className="flex-1">{content}</main>
      <BottomNav />
    </div>
  );
};

export default IncidentReport;