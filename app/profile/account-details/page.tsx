"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/page-header/PageHeader";
import FormField from "@/components/form-field/FormFields";
import BottomNav from "@/components/bottom-nav/BottomNav";
import { createClient } from "@/lib/supabase/client";

export default function AccountDetailsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [cellphone, setCellphone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load the current user's data on mount
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Could not load your account. Please log in again.");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");

      const { data: row, error: rowError } = await supabase
        .from("patient_status")
        .select("fullname, cellphone")
        .eq("user_id", user.id)
        .single();

      if (rowError) {
        // A missing row just means this user hasn't saved details yet —
        // not necessarily a real error, so don't block the form on it.
        console.warn("No existing patient_status row yet:", rowError.message);
      } else {
        setFullname(row?.fullname ?? "");
        setCellphone(row?.cellphone ?? "");
      }

      setLoading(false);
    };

    loadProfile();
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
        email: user.email,
        fullname,
        cellphone,
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
        <p className="text-sm text-neutral-500">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <PageHeader title="Account Details" showBack />

      <form onSubmit={handleSave} className="flex flex-1 flex-col px-5 pt-2">
        <div className="flex-1">
          <FormField
            label="Name"
            name="fullname"
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            disabled
            trailing={
              <button
                type="button"
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                Verify
              </button>
            }
          />

          <FormField
            label="Mobile Number"
            name="cellphone"
            type="tel"
            value={cellphone}
            onChange={(e) => setCellphone(e.target.value)}
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