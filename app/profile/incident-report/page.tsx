"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/bottom-nav/BottomNav";
import { createClient } from "@/lib/supabase/client";

interface EventLog {
  timestamp: string;       // ISO string, when the fall/incident was detected
  location?: {
    lat: number;
    lng: number;
  } | string;              // adjust if you're storing lat/lng vs. a plain address string
  rescueTimestamp?: string | null; // ISO string when help arrived, null/undefined if still pending
}

const IncidentReport = () => {
  const supabase = createClient();

  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Could not load your incident reports. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: row, error: rowError } = await supabase
        .from("patient_status")
        .select("eventLogs")
        .eq("user_id", user.id)
        .single();

      if (rowError) {
        console.warn("No existing patient_status row yet:", rowError.message);
        setLogs([]);
      } else {
        const eventLogs: EventLog[] = Array.isArray(row?.eventLogs) ? row.eventLogs : [];
        // Most recent incident first
        const sorted = [...eventLogs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sorted);
      }

      setLoading(false);
    };

    loadLogs();
  }, [supabase]);

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

  const formatLocation = (location?: EventLog["location"]) => {
    if (!location) return "Unknown";
    if (typeof location === "string") return location;
    return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-neutral-500">Loading incident reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-neutral-500">No incidents recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto px-5 pt-2">
      <table className="w-full min-w-[500px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2 pr-4 font-medium">Detected At</th>
            <th className="py-2 pr-4 font-medium">Location</th>
            <th className="py-2 pr-4 font-medium">Rescued At</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => {
            const isResolved = Boolean(log.rescueTimestamp);
            return (
              <tr key={index} className="border-b border-neutral-100">
                <td className="py-3 pr-4 text-neutral-700">{formatDate(log.timestamp)}</td>
                <td className="py-3 pr-4 text-neutral-700">{formatLocation(log.location)}</td>
                <td className="py-3 pr-4 text-neutral-700">{formatDate(log.rescueTimestamp)}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isResolved
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {isResolved ? "Resolved" : "Pending"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    <BottomNav/>
    </div>
    
  );
};

export default IncidentReport;