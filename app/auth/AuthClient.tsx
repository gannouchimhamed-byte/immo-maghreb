"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/auth";
import { getDeviceId } from "@/lib/saved-searches";
import { migrateDeviceSearches } from "@/lib/auth";

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step = "email" | "otp" | "success";

// ─── OTP digit input ──────────────────────────────────────────────────────────
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const digits = 6;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 1);
    const arr = value.split("");
    arr[i] = clean;
    const next = arr.join("").slice(0, digits);
    onChange(next.padEnd ? next : next);
    if (clean && i < digits - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!value[i] && i > 0) {
        inputsRef.current[i - 1]?.focus();
        const arr = value.split("");
        arr[i - 1] = "";
        onChange(arr.join(""));
      } else {
        const arr = value.split("");
        arr[i] = "";
        onChange(arr.join(""));
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < digits - 1) inputsRef.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, digits);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, digits - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: digits }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-12 h-14 text-center text-[22px] font-bold rounded-xl border-2 transition-all outline-none
            font-mono text-navy
            ${value[i]
              ? "border-gold bg-gold/8 shadow-sm"
              : "border-navy/20 bg-white"
            }
            focus:border-gold focus:bg-gold/5 focus:shadow-md
            disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label={`Chiffre ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Main auth component ───────────────────────────────────────────────────────
export default function AuthClient({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === "otp") {
      handleVerifyOtp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || loading) return;
    const emailTrimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Adresse email invalide");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await sendEmailOtp(emailTrimmed);
    setLoading(false);
    if (err) { setError("Erreur d'envoi. Vérifiez votre email."); return; }
    setStep("otp");
    setResendCooldown(60);
  }, [email, loading]);

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    const { user, error: err } = await verifyEmailOtp(email.trim().toLowerCase(), otp);
    if (err || !user) {
      setLoading(false);
      setError("Code invalide ou expiré. Vérifiez votre email.");
      setOtp("");
      return;
    }
    // Migrate device saved searches to real account
    const deviceId = getDeviceId();
    if (deviceId && deviceId !== user.id) {
      await migrateDeviceSearches(deviceId, user.id);
    }
    setStep("success");
    setTimeout(() => router.push(returnTo === "/" ? "/" : returnTo), 1200);
  }, [otp, email, loading, router, returnTo]);

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || loading) return;
    setOtp("");
    setError("");
    setLoading(true);
    await sendEmailOtp(email.trim().toLowerCase());
    setLoading(false);
    setResendCooldown(60);
  }, [email, loading, resendCooldown]);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-navy/8 bg-[#FDFAF6]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
            <path d="M10 24 L10 17 L18 11 L26 17 L26 24" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="15" y="19" width="6" height="5" rx="1" fill="#D4AF64" opacity="0.85"/>
          </svg>
          <span className="font-display text-[18px] text-navy tracking-widest">HESTIA</span>
        </Link>
        <Link href={returnTo} className="text-[13px] text-cream-muted hover:text-navy transition-colors">
          Continuer sans connexion →
        </Link>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* ── Step: EMAIL ─────────────────────────────────────────────── */}
          {step === "email" && (
            <div className="animate-fade-up">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gold" viewBox="0 0 32 32" fill="none">
                  <path d="M4 8h24v16a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 8l12 10L28 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              <h1 className="font-display text-[28px] text-navy font-semibold text-center leading-tight mb-2">
                Connexion à Hestia
              </h1>
              <p className="text-[14px] text-cream-muted text-center leading-relaxed mb-8">
                Entrez votre email. Nous vous envoyons un code à 6 chiffres.
                <br/>Aucun mot de passe requis.
              </p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">
                    Adresse email
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="votre@email.com"
                    autoFocus
                    autoComplete="email"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-[15px] text-navy placeholder:text-cream-muted/50 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[12px] text-rose-600">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full py-4 rounded-xl bg-navy text-gold text-[15px] font-bold disabled:opacity-40 hover:bg-navy/90 transition-all flex items-center justify-center gap-2.5"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      Recevoir le code
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-navy/10"/>
                <span className="text-[11px] text-cream-muted font-medium">ou continuer avec</span>
                <div className="flex-1 h-px bg-navy/10"/>
              </div>

              {/* Google SSO button — placeholder (can wire with Supabase Google OAuth later) */}
              <button
                onClick={async () => {
                  const sb = (await import("@/lib/supabase/client")).createClient();
                  await sb.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                  });
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-navy text-[14px] font-semibold hover:bg-cream hover:border-navy/30 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>

              <p className="text-center text-[11px] text-cream-muted mt-6 leading-relaxed">
                En continuant, vous acceptez nos{" "}
                <Link href="#" className="text-navy/60 hover:text-gold transition-colors">Conditions d'utilisation</Link>
                {" "}et notre{" "}
                <Link href="#" className="text-navy/60 hover:text-gold transition-colors">Politique de confidentialité</Link>.
              </p>
            </div>
          )}

          {/* ── Step: OTP ───────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="animate-fade-up">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gold" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="10" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 10V8a5 5 0 0110 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="16" cy="18" r="2" fill="currentColor"/>
                  <path d="M16 20v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              <h2 className="font-display text-[28px] text-navy font-semibold text-center leading-tight mb-2">
                Vérifiez votre email
              </h2>
              <p className="text-[14px] text-cream-muted text-center leading-relaxed mb-2">
                Code envoyé à
              </p>
              <p className="text-[14px] font-semibold text-navy text-center mb-8">{email}</p>

              {/* 6-digit input */}
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[12px] text-rose-600 mt-4">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                className="w-full mt-6 py-4 rounded-xl bg-navy text-gold text-[15px] font-bold disabled:opacity-40 hover:bg-navy/90 transition-all flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
                    Vérification…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Confirmer le code
                  </>
                )}
              </button>

              {/* Resend */}
              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-[13px] text-cream-muted hover:text-navy disabled:opacity-40 transition-colors"
                >
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                </button>
                <span className="text-cream-muted">·</span>
                <button
                  onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                  className="text-[13px] text-cream-muted hover:text-navy transition-colors"
                >
                  Changer d'email
                </button>
              </div>

              {/* Tip */}
              <div className="mt-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-navy/5 border border-navy/8">
                <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 110 1.5A.75.75 0 018 4zm-.75 2.75h1.5v5h-1.5v-5z"/>
                </svg>
                <p className="text-[12px] text-navy/60 leading-relaxed">
                  Le code expire dans <strong>10 minutes</strong>. Vérifiez aussi vos spams si vous ne le voyez pas.
                </p>
              </div>
            </div>
          )}

          {/* ── Step: SUCCESS ────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="animate-fade-up text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 40 40" fill="none">
                  <path d="M8 20l8 8 16-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-display text-[28px] text-navy font-semibold mb-2">Connexion réussie !</h2>
              <p className="text-[14px] text-cream-muted">Redirection en cours…</p>
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mt-6"/>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-navy/8">
        <p className="text-[11px] text-cream-muted tracking-widest">© 2026 HESTIA · FIND YOUR HOME</p>
      </div>
    </div>
  );
}
