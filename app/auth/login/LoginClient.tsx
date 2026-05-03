"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithOTP, verifyOTP, signInWithGoogle } from "@/lib/auth";

// ── ImmoScout24-style steps ───────────────────────────────────────────────────
type Step = "email" | "otp" | "success";

// ── Benefits carousel (shown on left panel) ───────────────────────────────────
const SLIDES = [
  {
    headline: "Trouvez votre chez-vous",
    sub: "Les meilleures annonces immobilières de Tunis à Sfax, avec estimation IA intégrée.",
    emoji: "🏛",
  },
  {
    headline: "Alertes en temps réel",
    sub: "Sauvegardez vos critères et soyez notifié dès qu'un bien correspond.",
    emoji: "🔔",
  },
  {
    headline: "Comparaison intelligente",
    sub: "Comparez jusqu'à 3 biens côte à côte — prix/m², équipements, trajet.",
    emoji: "⚖",
  },
];

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") || "/";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-rotate left panel carousel
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await signInWithOTP(email.trim().toLowerCase());
    setLoading(false);
    if (err) {
      setError("Impossible d'envoyer le code. Réessayez.");
      return;
    }
    setStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ── Step 2: verify 6-digit code ─────────────────────────────────────────────
  const handleOtpInput = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    // Auto-submit when all 6 filled
    if (val && next.every(d => d !== "") && i === 5) {
      handleOtpSubmit(next.join(""));
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      handleOtpSubmit(paste);
    }
  };

  const handleOtpSubmit = async (code?: string) => {
    const token = code || otp.join("");
    if (token.length !== 6) { setError("Entrez le code à 6 chiffres."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await verifyOTP(email, token);
    setLoading(false);
    if (err) {
      setError("Code incorrect ou expiré. Réessayez.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      return;
    }
    setStep("success");
    setTimeout(() => router.push(returnTo === "/" ? "/" : returnTo), 1500);
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    await signInWithOTP(email);
    setLoading(false);
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Lifestyle image + rotating benefit ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-navy overflow-hidden flex-col">
        {/* Background geometric pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px),repeating-linear-gradient(-45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px)",backgroundSize:"40px 40px"}}/>

        {/* Large H watermark */}
        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 font-display text-[clamp(250px,40vw,500px)] text-gold/[0.03] leading-none select-none pointer-events-none">H</div>

        {/* Logo top-left */}
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
              <path d="M10 24 L10 17 L18 11 L26 17 L26 24" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="15" y="19" width="6" height="5" rx="1" fill="#D4AF64" opacity="0.85"/>
            </svg>
            <div>
              <div className="font-display text-2xl text-cream tracking-widest leading-none">HESTIA</div>
              <div className="text-[9px] text-gold tracking-[0.2em] mt-1 leading-none">FIND YOUR HOME</div>
            </div>
          </Link>
        </div>

        {/* Centered benefit content */}
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-14 pb-20">
          {SLIDES.map((s, i) => (
            <div key={i}
              className={`absolute transition-all duration-700 ease-out ${
                i === slide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
              }`}>
              <div className="text-6xl mb-6">{s.emoji}</div>
              <h2 className="font-display text-[clamp(32px,4vw,52px)] text-cream font-normal leading-[1.1] mb-4">
                {s.headline}
              </h2>
              <p className="text-cream/50 text-[16px] leading-relaxed max-w-md">{s.sub}</p>
            </div>
          ))}

          {/* Slide dots */}
          <div className="absolute bottom-14 left-14 flex gap-2">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`h-1 rounded-full transition-all duration-300 ${i === slide ? "w-8 bg-gold" : "w-2 bg-cream/20"}`}/>
            ))}
          </div>
        </div>

        {/* Bottom trust badge */}
        <div className="relative z-10 px-14 pb-8">
          <div className="flex items-center gap-2 text-cream/30 text-[11px]">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0L1 2.5v4C1 9.5 3.3 11.7 6 12c2.7-.3 5-2.5 5-5.5v-4L6 0z"/>
            </svg>
            Cette connexion est sécurisée
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#FDFAF6]">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-navy/8">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
              <path d="M10 24 L10 17 L18 11 L26 17 L26 24" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="15" y="19" width="6" height="5" rx="1" fill="#D4AF64" opacity="0.85"/>
            </svg>
            <span className="font-display text-[18px] text-navy tracking-widest">HESTIA</span>
          </Link>
          <Link href="/" className="text-[12px] text-cream-muted hover:text-navy transition-colors">
            ← Retour
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">

            {/* ── Step: email ──────────────────────────────────────────── */}
            {step === "email" && (
              <div className="animate-fade-up">
                <h1 className="font-display text-[32px] text-navy font-semibold leading-tight mb-1">
                  Votre bien idéal<br/>vous attend.
                </h1>
                <p className="text-cream-muted text-[14px] mb-8">Se connecter ou créer un compte</p>

                {/* Google OAuth */}
                <button onClick={handleGoogle} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-navy text-[14px] font-semibold hover:bg-cream hover:border-navy/25 transition-all mb-3 disabled:opacity-50">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuer avec Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-navy/10"/>
                  <span className="text-[12px] text-cream-muted">ou</span>
                  <div className="flex-1 h-px bg-navy/10"/>
                </div>

                {/* Email form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/60 mb-1.5">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="votre@email.com"
                      autoFocus
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-navy/15 bg-white text-[14px] text-navy placeholder:text-cream-muted/50 focus:outline-none focus:border-navy/40 focus:ring-4 focus:ring-navy/5 transition-all"
                    />
                  </div>

                  {error && (
                    <p className="text-[12px] text-rose-500 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <button type="submit" disabled={loading || !email.trim()}
                    className="w-full py-3.5 rounded-xl bg-navy text-gold text-[14px] font-bold hover:bg-navy/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
                    ) : (
                      <>Continuer <span className="opacity-60">→</span></>
                    )}
                  </button>
                </form>

                <p className="text-center text-[11px] text-cream-muted mt-6 leading-relaxed">
                  En continuant, vous acceptez nos{" "}
                  <Link href="/legal" className="text-navy hover:text-gold transition-colors underline underline-offset-2">
                    Conditions générales
                  </Link>
                  {" "}et notre{" "}
                  <Link href="/legal" className="text-navy hover:text-gold transition-colors underline underline-offset-2">
                    Politique de confidentialité
                  </Link>.
                </p>
              </div>
            )}

            {/* ── Step: OTP ────────────────────────────────────────────── */}
            {step === "otp" && (
              <div className="animate-fade-up">
                {/* Back button */}
                <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
                  className="flex items-center gap-2 text-cream-muted hover:text-navy transition-colors mb-8 text-[13px]">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Modifier l'email
                </button>

                {/* Email icon */}
                <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-6 text-3xl">
                  📧
                </div>

                <h2 className="font-display text-[28px] text-navy font-semibold mb-2">
                  Vérifiez votre boîte mail
                </h2>
                <p className="text-cream-muted text-[14px] mb-2">
                  Un code à 6 chiffres a été envoyé à
                </p>
                <p className="text-navy font-semibold text-[14px] mb-8">{email}</p>

                {/* 6-digit OTP boxes */}
                <div className="flex gap-2.5 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`flex-1 aspect-square text-center text-[22px] font-bold rounded-xl border-2 transition-all focus:outline-none ${
                        digit
                          ? "border-navy bg-navy text-gold"
                          : "border-navy/20 bg-white text-navy focus:border-navy/50 focus:ring-4 focus:ring-navy/5"
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-[12px] text-rose-500 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg mb-4">{error}</p>
                )}

                {/* Manual submit */}
                <button
                  onClick={() => handleOtpSubmit()}
                  disabled={loading || otp.some(d => !d)}
                  className="w-full py-3.5 rounded-xl bg-navy text-gold text-[14px] font-bold hover:bg-navy/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mb-5">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
                  ) : "Vérifier le code"}
                </button>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-[12px] text-cream-muted mb-2">Vous n'avez pas reçu le code ?</p>
                  <button onClick={handleResend} disabled={loading}
                    className="text-[13px] text-navy font-semibold hover:text-gold transition-colors underline underline-offset-2 disabled:opacity-50">
                    Renvoyer le code
                  </button>
                </div>

                {/* Security note */}
                <div className="mt-8 flex items-center gap-2 text-[11px] text-cream-muted">
                  <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M7 0L1 2.5v4C1 9.5 3.3 11.7 6 12h1c2.7-.3 5-2.5 5-5.5v-4L7 0z"/>
                  </svg>
                  Code valable 10 minutes · Connexion sécurisée
                </div>
              </div>
            )}

            {/* ── Step: success ────────────────────────────────────────── */}
            {step === "success" && (
              <div className="animate-fade-up text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 text-4xl">
                  ✅
                </div>
                <h2 className="font-display text-[28px] text-navy font-semibold mb-2">Connexion réussie !</h2>
                <p className="text-cream-muted text-[14px]">Redirection en cours…</p>
                <div className="mt-6 flex justify-center">
                  <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
