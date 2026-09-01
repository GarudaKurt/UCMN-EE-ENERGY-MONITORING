"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/page-header/PageHeader";
import FormField from "@/components/form-field/FormFields";
import BottomNav from "@/components/bottom-nav/BottomNav";
import DateCalendarField from "@/components/monthcalendar-field/DateCalendarField";
import { createClient } from "@/lib/supabase/client";
import { GroupId, ENERGY_GROUP_DEFS } from "@/components/energy/Energy";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

type RoomKwh = Record<GroupId, string>;

export default function EnergyTargetSetup() {
  const router = useRouter();
  const supabase = createClient();

  const [targetStartDate, setTargetStartDate] = useState(todayIso());
  const [targetEndDate, setTargetEndDate] = useState(todayIso());
  const [roomKwh, setRoomKwh] = useState<RoomKwh>({
    sala: "",
    "living-room": "",
    "master-bedroom": "",
  });
  const [ratePerKwh, setRatePerKwh] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTarget = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Could not load your info. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: row, error: rowError } = await supabase
        .from("energy_targets")
        .select(
          "target_start_date, target_end_date, sala_kwh, living_room_kwh, master_bedroom_kwh, rate_per_kwh"
        )
        .eq("user_id", user.id)
        .single();

      if (rowError) {
        console.warn("No existing energy_targets row yet:", rowError.message);
      } else {
        setTargetStartDate(row?.target_start_date ?? todayIso());
        setTargetEndDate(row?.target_end_date ?? todayIso());
        setRoomKwh({
          sala: row?.sala_kwh != null ? String(row.sala_kwh) : "",
          "living-room": row?.living_room_kwh != null ? String(row.living_room_kwh) : "",
          "master-bedroom": row?.master_bedroom_kwh != null ? String(row.master_bedroom_kwh) : "",
        });
        setRatePerKwh(row?.rate_per_kwh != null ? String(row.rate_per_kwh) : "");
      }

      setLoading(false);
    };

    loadTarget();
  }, [supabase]);

  const totalKwh =
    toNumber(roomKwh.sala) + toNumber(roomKwh["living-room"]) + toNumber(roomKwh["master-bedroom"]);
  const totalPeso = totalKwh * toNumber(ratePerKwh);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (targetEndDate < targetStartDate) {
      setError("End date can't be before the start date.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Your session expired. Please log in again.");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from("energy_targets").upsert(
      {
        user_id: user.id,
        target_start_date: targetStartDate,
        target_end_date: targetEndDate,
        sala_kwh: toNumber(roomKwh.sala),
        living_room_kwh: toNumber(roomKwh["living-room"]),
        master_bedroom_kwh: toNumber(roomKwh["master-bedroom"]),
        rate_per_kwh: toNumber(ratePerKwh),
      },
      { onConflict: "user_id" }
    );

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push("/energy");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm text-neutral-500">Loading energy target...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <PageHeader title="Setup Energy Target" showBack />

      <form onSubmit={handleSave} className="flex flex-1 flex-col px-5 pt-2">
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateCalendarField
              label="Start Date"
              name="targetStartDate"
              value={targetStartDate}
              onChange={setTargetStartDate}
            />
            <DateCalendarField
              label="End Date"
              name="targetEndDate"
              value={targetEndDate}
              onChange={setTargetEndDate}
            />
          </div>

          {ENERGY_GROUP_DEFS.map((group) => (
            <div key={group.id} className="mb-4 flex items-center gap-3">
              <span
                className="mt-6 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <div className="flex-1">
                <FormField
                  label={`${group.name} Target (kWh)`}
                  name={`${group.id}Kwh`}
                  type="text"
                  inputMode="decimal"
                  value={roomKwh[group.id]}
                  onChange={(e) =>
                    setRoomKwh((prev) => ({ ...prev, [group.id]: e.target.value }))
                  }
                />
              </div>
            </div>
          ))}

          <FormField
            label="Rate (₱ per kWh)"
            name="ratePerKwh"
            type="text"
            inputMode="decimal"
            value={ratePerKwh}
            onChange={(e) => setRatePerKwh(e.target.value)}
          />

          <div className="mb-4 rounded-xl bg-neutral-900 px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Total target</span>
              <span className="text-sm font-semibold">
                {totalKwh.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-neutral-400">Estimated cost</span>
              <span className="text-lg font-semibold">
                ₱{totalPeso.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 pb-[100px] sm:pb-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full border border-neutral-300 bg-neutral-100 py-3.5 text-sm font-semibold text-neutral-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white shadow-md shadow-neutral-300 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
      <BottomNav />
    </div>
  );
}