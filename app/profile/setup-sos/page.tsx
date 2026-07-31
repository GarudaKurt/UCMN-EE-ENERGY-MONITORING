"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/page-header/PageHeader";
import FormField from "@/components/form-field/FormFields";
import BottomNav from "@/components/bottom-nav/BottomNav";
import ToggleField from "@/components/toggle-field/ToggleField";
import { createClient } from "@/lib/supabase/client";

export default function PatientInfo() {
  const router = useRouter();
  const supabase = createClient();

  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [patientCell, setPatientCell] = useState("");
  const [gyroSensorEnabled, setGyroSensorEnabled] = useState(false);
  const [alertPersonnelEnabled, setAlertPersonnelEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load the current user's saved SOS setup on mount
  useEffect(() => {
    const loadPatientInfo = async () => {
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
        .from("patient_status")
        .select("patient_name, age, patient_cell, enabled_sensor, enabled_alert")
        .eq("user_id", user.id)
        .single();

      if (rowError) {
        console.warn("No existing patient_status row yet:", rowError.message);
      } else {
        setPatientName(row?.patient_name ?? "");
        setAge(row?.age != null ? String(row.age) : "");
        setPatientCell(row?.patient_cell ?? "");
        setGyroSensorEnabled(row?.enabled_sensor ?? false);
        setAlertPersonnelEnabled(row?.enabled_alert ?? false);
      }

      setLoading(false);
    };

    loadPatientInfo();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

    const { error: upsertError } = await supabase.from("patient_status").upsert(
      {
        user_id: user.id,
        patient_name: patientName,
        age: age === "" ? null : Number(age),
        patient_cell: patientCell,
        enabled_sensor: gyroSensorEnabled,
        enabled_alert: alertPersonnelEnabled,
      },
      { onConflict: "user_id" }
    );

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.push("/profile");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <p className="text-sm text-neutral-500">Loading patient info...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <PageHeader title="Setup SOS" showBack />

      <form onSubmit={handleSave} className="flex flex-1 flex-col px-5 pt-2">
        <div className="flex-1">
          <FormField
            label="Patient Name"
            name="name"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />

          <FormField
            label="Age"
            name="age"
            type="text"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <FormField
            label="Mobile Number"
            name="mobile"
            type="tel"
            value={patientCell}
            onChange={(e) => setPatientCell(e.target.value)}
          />

          <ToggleField
            label="Enabled Gyro Sensor"
            name="gyroSensorEnabled"
            checked={gyroSensorEnabled}
            onChange={(e) => setGyroSensorEnabled(e.target.checked)}
          />

          <ToggleField
            label="Enabled Alert Personnel"
            name="alertPersonnelEnabled"
            checked={alertPersonnelEnabled}
            onChange={(e) => setAlertPersonnelEnabled(e.target.checked)}
          />

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
            className="flex-1 rounded-full bg-red-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
      <BottomNav />
    </div>
  );
}