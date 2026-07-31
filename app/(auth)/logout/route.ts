// app/admin/logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  // Clears the session server-side, which also removes the sb-* cookie
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url));
}