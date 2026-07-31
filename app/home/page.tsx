"use client";

import { useEffect, useState } from "react";
import HomeHeader from "@/components/home-header/HomeHeader";
import SosButton from "@/components/sos-button/SosAlert";
import StatusIndicator from "@/components/status-indicator/StatusIndicator";
import BottomNav from "@/components/bottom-nav/BottomNav";
import { useFallStatus } from "@/hooks/useFullStatus";
import { createClient } from "@/lib/supabase/client";

interface EventLog {
  timestamp: string;
  location?: { lat: number; lng: number } | string;
  rescueTimestamp?: string | null;
}

export default function HomePage() {
  const supabase = createClient();

  const { hasFall, fullname } = useFallStatus();

  const [manualActive, setManualActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sosActive = hasFall || manualActive;

  useEffect(() => {
    const loadCurrentStatus = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Could not load your status. Please log in again.");
        setInitializing(false);
        return;
      }

      const { data: row, error: rowError } = await supabase
        .from("patient_status")
        .select("hasFall")
        .eq("user_id", user.id)
        .single();

      if (rowError) {
        console.warn("No existing patient_status row yet:", rowError.message);
      } else {
        setManualActive(row?.hasFall ?? false);
      }

      setInitializing(false);
    };

    loadCurrentStatus();
  }, [supabase]);

  const handleSosPress = async () => {
    const nextState = !manualActive;
    setManualActive(nextState); // optimistic UI update
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("No authenticated user found.");
      }

      // Base update: just the hasFall flag
      const updatePayload: {
        hasFall: boolean;
        eventLogs?: EventLog[];
      } = { hasFall: nextState };

      // Only stamp a rescue when the alert is being turned OFF
      // (i.e. patient tapped the button to confirm they're safe).
      if (nextState === false) {
        const { data: row, error: fetchError } = await supabase
          .from("patient_status")
          .select("eventLogs")
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        const eventLogs: EventLog[] = Array.isArray(row?.eventLogs) ? row.eventLogs : [];

        // Find the most recent entry that hasn't been rescued yet.
        let targetIndex = -1;
        for (let i = eventLogs.length - 1; i >= 0; i--) {
          if (!eventLogs[i].rescueTimestamp) {
            targetIndex = i;
            break;
          }
        }

        if (targetIndex !== -1) {
          const updatedLogs = [...eventLogs];
          updatedLogs[targetIndex] = {
            ...updatedLogs[targetIndex],
            rescueTimestamp: new Date().toISOString(),
          };
          updatePayload.eventLogs = updatedLogs;
        }
        // If no open entry is found, we just update hasFall and leave
        // eventLogs untouched — nothing to close out.
      }

      const { error: updateError } = await supabase
        .from("patient_status")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error("Failed to update hasFall:", err);
      setError("Could not send alert. Please try again.");
      setManualActive((prev) => !prev); // revert optimistic update on failure
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm text-neutral-500">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <HomeHeader name={fullname || "there"} hasNotification />

      <main className="flex flex-1 flex-col items-center px-6 pt-6 text-center">
        <StatusIndicator alert={sosActive} />

        {sosActive ? (
          <p className="mt-3 text-sm text-neutral-600">
            <span className="font-semibold text-red-500">Alert sent.</span> Help is on
            the way — stay where you are if possible.
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-600">
            Help is just is in everywhere! If{" "}
            <span className="font-semibold text-red-500">SOS alert</span> occurs someone
            call the help.
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}

        <div className="flex flex-1 items-center justify-center">
          <SosButton active={sosActive} onPress={handleSosPress}/>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}