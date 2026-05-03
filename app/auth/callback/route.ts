import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code        = requestUrl.searchParams.get("code");
  const returnTo    = requestUrl.searchParams.get("returnTo") || "/";
  const origin      = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()    { return cookieStore.getAll(); },
          setAll(cs)  { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Check if profile is complete — redirect to complete-profile if not
  return NextResponse.redirect(`${origin}${returnTo}`);
}
