import { getListingById } from "@/lib/supabase/client";
import Link from "next/link";
import { notFound } from "next/navigation";

const fmt = (p: number) => `${Math.round(p).toLocaleString("fr-TN")} DT`;
export const revalidate = 60;

export default async function ListingDetailPage({ params }: { params: any }) {
  const { id } = await params;
  let listing: any;
  try { listing = await getListingById(id); } catch { notFound(); }
  if (!listing) notFound();

  const waMsg = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce sur Hestia: ${listing.title} (${fmt(listing.price)}). Pouvez-vous me donner plus d'informations ?`);
  const waPhone = (listing.agent_phone || "").replace(/\D/g,"");

  return (
    <div style={{ background:"#F7F3EE", minHeight:"100vh" }}>
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"#1B2B3A", borderBottom:"1px solid rgba(212,175,100,.2)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", height:64, gap:16 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
              <path d="M10 22 L10 16 L18 10 L26 16 L26 22" fill="none" stroke="#D4AF64" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="15" y="18" width="6" height="7" fill="#D4AF64" opacity="0.8"/>
            </svg>
            <span style={{ fontFamily:"Georgia,serif", fontSize:18, color:"#F7F3EE", letterSpacing:"0.05em" }}>HESTIA</span>
          </Link>
          <div style={{ flex:1 }} />
          <Link href="/listings" style={{ fontSize:12, color:"rgba(247,243,238,.6)", textDecoration:"none" }}>← ANNONCES</Link>
        </div>
      </nav>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"28px 24px 60px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:32, alignItems:"start" }}>

          {/* LEFT */}
          <div>
            <div style={{ borderRadius:16, overflow:"hidden", height:420, marginBottom:20 }}>
              <img src={listing.primary_image_url||"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"} alt={listing.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>

            <div style={{ background:"#FDFAF6", borderRadius:16, padding:30, border:"1px solid #E8DDD0", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:10, color:"#D4AF64", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8 }}>
                    {listing.type} · {listing.action==="vente"?"À vendre":"À louer"}
                  </div>
                  <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:400, color:"#1B2B3A", marginBottom:6 }}>{listing.title}</h1>
                  <div style={{ fontSize:13, color:"#9A8878" }}>📍 {listing.city}, Wilaya de {listing.wilaya}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:34, fontWeight:400, color:"#D4AF64" }}>{fmt(listing.price)}</div>
                  {listing.action==="vente"&&<div style={{ fontSize:12, color:"#9A8878" }}>{fmt(Math.round(listing.price/listing.area_m2))}/m²</div>}
                </div>
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
                {[[listing.area_m2+"m²","Surface"],[listing.rooms>0&&listing.rooms+"p","Pièces"],[listing.deed?.replace(/_/g," "),"Titre"],[listing.wilaya,"Wilaya"]].filter(x=>x[0]).map(([v,k]:any)=>(
                  <div key={k} style={{ padding:"12px 16px", background:"#F7F3EE", borderRadius:10, border:"1px solid #E8DDD0" }}>
                    <div style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:400, color:"#1B2B3A" }}>{v}</div>
                    <div style={{ fontSize:10, color:"#9A8878", letterSpacing:"0.05em", textTransform:"uppercase", marginTop:2 }}>{k}</div>
                  </div>
                ))}
              </div>

              {listing.description&&<p style={{ fontSize:14, color:"#6B5B4E", lineHeight:1.8, borderTop:"1px solid #E8DDD0", paddingTop:20 }}>{listing.description}</p>}
            </div>

            {/* AI Block */}
            {listing.ai_estimate&&(
              <div style={{ background:"#1B2B3A", borderRadius:16, padding:28, border:"1px solid rgba(212,175,100,.2)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:"rgba(212,175,100,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🤖</div>
                  <div>
                    <div style={{ fontFamily:"Georgia,serif", fontSize:17, color:"#F7F3EE" }}>Estimation Hestia IA</div>
                    <div style={{ fontSize:11, color:"rgba(247,243,238,.4)" }}>Marché {listing.wilaya} · Mis à jour cette semaine</div>
                  </div>
                  <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:20, background:"rgba(45,106,79,.25)", color:"#4ade80", fontSize:11, fontWeight:600 }}>
                    {listing.ai_signal==="underpriced"?"Sous-évalué":listing.ai_signal==="overpriced"?"Sur-évalué":"Prix juste"}
                  </div>
                </div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:28, color:"#D4AF64" }}>{fmt(listing.ai_estimate)}</div>
                <div style={{ fontSize:11, color:"rgba(247,243,238,.35)", marginTop:6 }}>Confiance: {Math.round((listing.ai_confidence||0.85)*100)}%</div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ position:"sticky", top:80, display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"#FDFAF6", borderRadius:16, padding:24, border:"1px solid #E8DDD0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#1B2B3A,#2D4A63)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:20, color:"#D4AF64" }}>H</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:"#1B2B3A", fontFamily:"Georgia,serif" }}>Agent Hestia</div>
                  <div style={{ fontSize:11, color:"#9A8878" }}>Certifié · SAMSAR</div>
                  <div style={{ fontSize:11, color:"#D4AF64", marginTop:2 }}>⭐ 4.9 · Répond en 30 min</div>
                </div>
              </div>
              {waPhone?(
                <a href={`https://wa.me/${waPhone}?text=${waMsg}`} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"14px", borderRadius:10, background:"#25D366", color:"#fff", fontWeight:600, fontSize:14, marginBottom:10, textDecoration:"none", boxShadow:"0 4px 14px rgba(37,211,102,.3)", fontFamily:"Georgia,serif" }}>
                  📲 WhatsApp Direct
                </a>
              ):(
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"14px", borderRadius:10, background:"#25D366", color:"#fff", fontWeight:600, fontSize:14, marginBottom:10, fontFamily:"Georgia,serif", cursor:"pointer" }}>
                  📲 Contacter l'agent
                </div>
              )}
              <button style={{ width:"100%", padding:"12px", borderRadius:10, background:"#F7F3EE", color:"#1B2B3A", fontWeight:500, fontSize:13, border:"1.5px solid #D4C4B0", cursor:"pointer", fontFamily:"Georgia,serif" }}>
                📞 Appeler
              </button>
            </div>

            {(listing.mosque_distance||listing.school_distance)&&(
              <div style={{ background:"#FDFAF6", borderRadius:16, padding:20, border:"1px solid #E8DDD0" }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#9A8878", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>Proximité</div>
                {listing.mosque_distance&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B5B4E", marginBottom:10 }}><span>🕌 Mosquée</span><span style={{ color:"#1B2B3A", fontWeight:600 }}>{listing.mosque_distance}m</span></div>}
                {listing.school_distance&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B5B4E" }}><span>🏫 École</span><span style={{ color:"#1B2B3A", fontWeight:600 }}>{listing.school_distance}m</span></div>}
              </div>
            )}

            <div style={{ background:"linear-gradient(135deg,#1B2B3A,#243647)", borderRadius:16, padding:22, border:"1px solid rgba(212,175,100,.15)" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:17, color:"#F7F3EE", marginBottom:8 }}>Alerte similaire</div>
              <div style={{ fontSize:12, color:"rgba(247,243,238,.5)", marginBottom:16, lineHeight:1.6 }}>Recevez les biens similaires sur WhatsApp dès leur publication.</div>
              <button style={{ width:"100%", padding:"11px", borderRadius:8, background:"#D4AF64", color:"#1B2B3A", fontWeight:600, fontSize:13, border:"none", cursor:"pointer", fontFamily:"Georgia,serif" }}>Créer une alerte</button>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background:"#141F29", padding:"24px", textAlign:"center" }}>
        <p style={{ fontSize:11, color:"rgba(247,243,238,.25)", letterSpacing:"0.05em" }}>© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
      </footer>
    </div>
  );
}
