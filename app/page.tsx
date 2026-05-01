import { getFeaturedListings } from "@/lib/supabase/client";
import Link from "next/link";

const fmt = (p: number) => `${Math.round(p).toLocaleString("fr-TN")} DT`;
export const revalidate = 60;

export default async function HomePage() {
  let listings: any[] = [];
  try { listings = await getFeaturedListings(); } catch {}

  return (
    <div style={{ background:"#F7F3EE", minHeight:"100vh", fontFamily:"'Georgia', serif" }}>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"#1B2B3A", borderBottom:"1px solid rgba(212,175,100,.2)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", height:64, gap:20 }}>
          {/* Logo */}
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#1B2B3A"/>
              <path d="M18 6 C11 6 6 12 6 18 C6 24 11 30 18 30 C25 30 30 24 30 18 C30 12 25 6 18 6Z" fill="none" stroke="#D4AF64" strokeWidth="1"/>
              <path d="M10 22 L10 16 L18 10 L26 16 L26 22" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="15" y="18" width="6" height="7" fill="#D4AF64" opacity="0.8"/>
              <path d="M8 24 C12 20 14 18 18 22 C22 18 24 20 28 24" fill="none" stroke="#D4AF64" strokeWidth="1" opacity="0.5"/>
            </svg>
            <div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:400, color:"#F7F3EE", letterSpacing:"0.05em" }}>HESTIA</div>
              <div style={{ fontSize:8, color:"#D4AF64", letterSpacing:"0.15em", marginTop:-2 }}>FIND YOUR HOME</div>
            </div>
          </Link>
          <div style={{ flex:1 }} />
          <Link href="/listings" style={{ padding:"7px 16px", borderRadius:6, color:"rgba(247,243,238,.7)", fontSize:13, textDecoration:"none" }}>Annonces</Link>
          <Link href="/listings" style={{ padding:"8px 20px", borderRadius:6, background:"#D4AF64", color:"#1B2B3A", fontSize:13, fontWeight:600, textDecoration:"none" }}>Publier</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ minHeight:"88vh", position:"relative", display:"flex", alignItems:"center", background:"linear-gradient(135deg,#1B2B3A 0%,#243647 50%,#1B2B3A 100%)", overflow:"hidden" }}>
        {/* Geometric pattern */}
        <div style={{ position:"absolute", inset:0, opacity:.04, backgroundImage:"repeating-linear-gradient(45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px),repeating-linear-gradient(-45deg,#D4AF64 0,#D4AF64 1px,transparent 1px,transparent 40px)", backgroundSize:"40px 40px" }} />
        {/* Big H watermark */}
        <div style={{ position:"absolute", right:"-2%", top:"50%", transform:"translateY(-50%)", fontFamily:"Georgia,serif", fontSize:"clamp(200px,35vw,500px)", color:"rgba(212,175,100,.04)", fontWeight:400, lineHeight:1, userSelect:"none" }}>H</div>
        {/* Gold arc decoration */}
        <div style={{ position:"absolute", top:40, right:80, width:300, height:300, borderRadius:"50% 50% 0 0", border:"1px solid rgba(212,175,100,.1)", borderBottom:"none" }} />
        <div style={{ position:"absolute", top:60, right:100, width:260, height:260, borderRadius:"50% 50% 0 0", border:"1px solid rgba(212,175,100,.06)", borderBottom:"none" }} />

        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 40px", position:"relative", zIndex:2, width:"100%" }}>
          <div style={{ maxWidth:620 }}>
            {/* Badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(212,175,100,.1)", border:"1px solid rgba(212,175,100,.25)", borderRadius:40, padding:"6px 16px", marginBottom:24 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#D4AF64" }} />
              <span style={{ color:"#D4AF64", fontSize:11, fontWeight:400, letterSpacing:"0.1em" }}>N°1 IMMOBILIER · TUNISIE 2026</span>
            </div>
            <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(40px,5vw,66px)", fontWeight:400, color:"#F7F3EE", lineHeight:1.1, marginBottom:16, letterSpacing:"-0.5px" }}>
              Trouvez votre<br />
              <em style={{ color:"#D4AF64", fontStyle:"italic" }}>chez-vous</em><br />
              au Maghreb
            </h1>
            <p style={{ color:"rgba(247,243,238,.55)", fontSize:16, lineHeight:1.8, marginBottom:36, fontWeight:300 }}>
              La déesse du foyer guide votre recherche immobilière.<br />
              Estimation IA · WhatsApp direct · 24 wilayas
            </p>

            {/* Search */}
            <div style={{ background:"#F7F3EE", borderRadius:12, padding:20, boxShadow:"0 24px 60px rgba(0,0,0,.35)" }}>
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                {["Acheter","Louer"].map((t,i)=>(
                  <button key={t} style={{ padding:"8px 20px", borderRadius:7, fontWeight:500, fontSize:13, cursor:"pointer", background:i===0?"#1B2B3A":"transparent", color:i===0?"#F7F3EE":"#6B7B8A", border:`1px solid ${i===0?"#1B2B3A":"#D4C4B0"}`, fontFamily:"Georgia,serif" }}>{t}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <div style={{ flex:2, minWidth:180, display:"flex", alignItems:"center", gap:8, background:"#FFF", borderRadius:8, padding:"10px 14px", border:"1px solid #D4C4B0" }}>
                  <span style={{ color:"#D4AF64" }}>📍</span>
                  <input placeholder="Ville, quartier, wilaya..." style={{ border:"none", background:"transparent", outline:"none", fontSize:14, color:"#1B2B3A", width:"100%", fontFamily:"Georgia,serif" }} />
                </div>
                <Link href="/listings" style={{ padding:"10px 24px", borderRadius:8, background:"#D4AF64", color:"#1B2B3A", fontWeight:600, fontSize:14, whiteSpace:"nowrap", textDecoration:"none", display:"flex", alignItems:"center", gap:6, fontFamily:"Georgia,serif" }}>
                  🔍 Chercher
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:32, marginTop:28 }}>
              {[["12k+","Annonces"],["3.2k","Agents"],["24","Wilayas"]].map(([n,l])=>(
                <div key={l}>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:400, color:"#D4AF64" }}>{n}</div>
                  <div style={{ fontSize:11, color:"rgba(247,243,238,.4)", letterSpacing:"0.05em" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED LISTINGS */}
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"72px 24px 48px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:400, color:"#D4AF64", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>· Sélection du moment ·</div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:32, fontWeight:400, color:"#1B2B3A" }}>Biens en vedette</h2>
          </div>
          <Link href="/listings" style={{ padding:"9px 20px", borderRadius:7, border:"1.5px solid #1B2B3A", color:"#1B2B3A", fontSize:13, textDecoration:"none", fontFamily:"Georgia,serif" }}>Voir tout →</Link>
        </div>

        {listings.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#9A8878" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏛</div>
            <div style={{ fontSize:15 }}>Chargement des annonces...</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:20 }}>
            {listings.map((l:any)=>(
              <Link key={l.id} href={`/listings/${l.id}`} style={{ display:"block", textDecoration:"none" }}>
                <div style={{ background:"#FDFAF6", borderRadius:14, overflow:"hidden", border:"1px solid #E8DDD0", transition:"all .25s" }}>
                  <div style={{ position:"relative", height:200 }}>
                    <img src={l.primary_image_url||"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500"} alt={l.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 45%,rgba(27,43,58,.65))" }} />
                    <div style={{ position:"absolute", top:12, left:12, display:"flex", gap:6 }}>
                      {l.is_featured&&<span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:600, background:"#1B2B3A", color:"#D4AF64", letterSpacing:"0.05em" }}>PREMIUM</span>}
                      <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:600, background:l.action==="vente"?"rgba(45,106,79,.9)":"rgba(26,86,164,.9)", color:"#fff" }}>
                        {l.action==="vente"?"Vente":"Location"}
                      </span>
                    </div>
                    <div style={{ position:"absolute", bottom:12, left:14 }}>
                      <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:400, color:"#fff" }}>{fmt(l.price)}</div>
                      {l.action==="location"&&<div style={{ fontSize:10, color:"rgba(255,255,255,.65)" }}>/mois</div>}
                    </div>
                  </div>
                  <div style={{ padding:"14px 16px" }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1B2B3A", marginBottom:4, fontFamily:"Georgia,serif" }}>{l.title}</div>
                    <div style={{ fontSize:11, color:"#9A8878", marginBottom:12 }}>📍 {l.city}, {l.wilaya}</div>
                    <div style={{ display:"flex", gap:14, paddingTop:10, borderTop:"1px solid #E8DDD0", fontSize:11, color:"#6B5B4E" }}>
                      {l.rooms>0&&<span>🛏 {l.rooms} pièces</span>}
                      <span>📐 {l.area_m2}m²</span>
                      {l.ai_signal&&<span style={{ marginLeft:"auto", color:l.ai_signal==="underpriced"?"#2D6A4F":"#9A8878", fontWeight:600 }}>
                        {l.ai_signal==="underpriced"?"↓ Sous-évalué":l.ai_signal==="overpriced"?"↑ Sur-évalué":"✓ Juste"}
                      </span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* WHY HESTIA */}
      <div style={{ background:"#1B2B3A", padding:"72px 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:10, color:"#D4AF64", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:12 }}>· Pourquoi Hestia ·</div>
          <h2 style={{ fontFamily:"Georgia,serif", fontSize:36, fontWeight:400, color:"#F7F3EE", marginBottom:48 }}>La déesse du foyer à votre service</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:24 }}>
            {[["🤖","IA d'estimation","Valorisation basée sur les données du marché tunisien"],["📲","WhatsApp natif","Contactez votre agent en 1 clic"],["🕌","Filtres locaux","Mosquée, école, distance, wilaya"],["📋","Titre foncier","Titre Bleu, Arabe, Henchir filtrable"]].map(([icon,title,desc])=>(
              <div key={title} style={{ padding:28, borderRadius:14, background:"rgba(247,243,238,.04)", border:"1px solid rgba(212,175,100,.12)", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:14 }}>{icon}</div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:17, color:"#F7F3EE", marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:12, color:"rgba(247,243,238,.4)", lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background:"#141F29", padding:"36px 24px", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:12 }}>
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
            <path d="M10 22 L10 16 L18 10 L26 16 L26 22" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="15" y="18" width="6" height="7" fill="#D4AF64" opacity="0.8"/>
          </svg>
          <span style={{ fontFamily:"Georgia,serif", fontSize:16, color:"#F7F3EE", letterSpacing:"0.08em" }}>HESTIA</span>
        </div>
        <p style={{ fontSize:11, color:"rgba(247,243,238,.25)", letterSpacing:"0.05em" }}>© 2026 HESTIA · TOUS DROITS RÉSERVÉS · TUNISIE</p>
      </footer>
    </div>
  );
}
