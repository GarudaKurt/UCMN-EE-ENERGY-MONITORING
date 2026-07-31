"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TABLE_NAME = "patient_status";

interface UseFallStatusResult {
  hasFall: boolean;
  fullname: string;
  error: string | null;
}

/**
 * Reads the current user's fall/emergency status and name from Supabase,
 * subscribing to realtime updates so the UI stays in sync without polling.
 *
 * Requires:
 *  - `patient_status.user_id` linking each row to auth.users(id)
 *  - Realtime enabled for `patient_status` (Database > Replication)
 *  - RLS policy allowing the logged-in user to SELECT their own row
 */
export function useFallStatus(): UseFallStatusResult {
  const [hasFall, setHasFall] = useState(false);
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (isMounted) setError("Not logged in");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select("hasFall, fullname")
        .eq("user_id", user.id)
        .single();

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const row = data as Record<string, unknown> | null;
        setHasFall(Boolean(row?.hasFall));
        setFullname(typeof row?.fullname === "string" ? row.fullname : "");
      }

      channel = supabase
        .channel(`${TABLE_NAME}-changes-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: TABLE_NAME,
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;
            const row = payload.new as Record<string, unknown>;
            setHasFall(Boolean(row.hasFall));
            setFullname(typeof row.fullname === "string" ? row.fullname : "");
            setError(null);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { hasFall, fullname, error };
}