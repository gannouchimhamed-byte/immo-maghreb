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
  const waMsg = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce: ${listing.title} (${fmt(listing.price)}). Pouvez-vous me donner plus d'informations ?`);
  const waPhone = (listing.users?.whatsapp_phone || listing.users?.phone || "").replace(/\D/g,"");

  return (
    <div style={{ background:"#F7F2E9", minHeight:"100vh" }}>
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"#FDFBF7", borderBottom:"1px solid #EDE5D4", boxShadow:"0 1px 12px rgba(28,18,8,.06)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", height:60, gap:16 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:7, background:"#C4611F", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#fff", fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>م</span>
            </div>
            <span style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:600, color:"#1C1208" }}>ImmoMaghreb</span>
          </Link>
          <div style={{ flex:1 }} />
          <Link href="/listings" style={{ fontSize:13, color:"#5C3D1E" }}>← Annonces</Link>
        </div>
      </nav>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:28 }}>
          <div>
            <div style={{ borderRadius:16, overflow:"hidden", height:380, marginBottom:18 }}>
              <img src={listing.primary_image_url||"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"} alt={listing.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <div style={{ background:"#FDFBF7", borderRadius:16, padding:28, border:"1px solid #EDE5D4", marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:20 }}>
                <div>
                  <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:300, color:"#1C1208", marginBottom:6 }}>{listing.title}</h1>
                  <div style={{ fontSize:13, color:"#9A8070" }}>📍 {listing.city}, {listing.wilaya}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:32, fontWeight:600, color:"#C4611F" }}>{fmt(listing.price)}</div>
                  {listing.action==="vente"&&<div style={{ fontSize:12, color:"#9A8070" }}>{fmt(Math.round(listing.price/listing.area_m2))}/m²</div>}
                </div>
              </div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
                {[[listing.area_m2+"m²","Surface"],[listing.rooms>0&&listing.rooms+"p","Pièces"],[listing.deed?.replace("_"," "),"Titre"]].filter(x=>x[0]).map(([v,k])=>(
                  <div key={k as string} style={{ padding:"10px 14px", background:"#F7F2E9", borderRadius:9, border:"1px solid #EDE5D4" }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1C1208" }}>{v as string}</div>
                    <div style={{ fontSize:10, color:"#9A8070" }}>{k as string}</div>
                  </div>
                ))}
              </div>
              {listing.description&&<p style={{ fontSize:14, color:"#5C3D1E", lineHeight:1.7 }}>{listing.description}</p>}
            </div>
            {listing.ai_estimate&&(
              <div style={{ background:"#1C1208", borderRadius:16, padding:24, border:"1px solid rgba(212,168,83,.2)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:24 }}>🤖</span>
                  <div>
                    <div style={{ fontFamily:"Georgia,serif", fontSize:17, color:"#fff" }}>Estimation IA</div>
                    <div style={{ fontSize:11, color:"rgba(253,251,247,.4)" }}>Basée sur le marché {listing.wilaya}</div>
                  </div>
                  <div style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:20, background:"rgba(45,106,79,.3)", color:"#2D6A4F", fontSize:11, fontWeight:600 }}>
                    {listing.ai_signal==="underpriced"?"Sous-évalué":listing.ai_signal==="overpriced"?"Sur-évalué":"Prix juste"}
                  </div>
                </div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:26, color:"#D4A853" }}>{fmt(listing.ai_estimate)}</div>
                <div style={{ fontSize:11, color:"rgba(253,251,247,.4)", marginTop:4 }}>Confiance: {Math.round((listing.ai_confidence||0)*100)}%</div>
              </div>
            )}
          </div>
          {/* Sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, position:"sticky", top:70, alignSelf:"flex-start" }}>
            <div style={{ background:"#FDFBF7", borderRadius:16, padding:22, border:"1px solid #EDE5D4" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#C4611F,#8B3A0F)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:18, color:"#fff", flexShrink:0 }}>
                  {(listing.users?.full_name||"A").split(" ").map((n:string)=>n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:"#1C1208" }}>{listing.users?.full_name||"Agent ImmoMaghreb"}</div>
                  <div style={{ fontSize:11, color:"#9A8070" }}>Agent SAMSAR Certifié</div>
                  <div style={{ fontSize:11, color:"#D4A853", marginTop:2 }}>⭐ {listing.agent_profiles?.rating||"4.8"}</div>
                </div>
              </div>
              {waPhone&&(
                <a href={`https://wa.me/${waPhone}?text=${waMsg}`} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"14px", borderRadius:10, background:"#25D366", color:"#fff", fontWeight:600, fontSize:14, marginBottom:9, textDecoration:"none", boxShadow:"0 4px 14px rgba(37,211,102,.3)" }}>
                  📲 WhatsApp Direct
                </a>
              )}
              <button style={{ width:"100%", padding:"12px", borderRadius:10, background:"#F7F2E9", color:"#1C1208", fontWeight:500, fontSize:13, border:"1.5px solid #EDE5D4" }}>
                📞 Appeler l'agent
              </button>
              <div style={{ marginTop:14, padding:10, background:"#F7F2E9", borderRadius:7, fontSize:11, color:"#9A8070" }}>
                Répond sous <strong style={{ color:"#1C1208" }}>30 min</strong> · 7j/7
              </div>
            </div>
            {[listing.mosque_distance&&["🕌","Mosquée",listing.mosque_distance+"m"],listing.school_distance&&["🏫","École",listing.school_distance+"m"],listing.beach_distance&&["🏖","Plage",listing.beach_distance+"m"]].filter(Boolean).length>0&&(
              <div style={{ background:"#FDFBF7", borderRadius:16, padding:18, border:"1px solid #EDE5D4" }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#1C1208", marginBottom:12, textTransform:"uppercase", letterSpacing:1 }}>Proximité</div>
                {[[listing.mosque_distance,"🕌","Mosquée"],[listing.school_distance,"🏫","École"],[listing.beach_distance,"🏖","Plage"]].filter(([v])=>v).map(([dist,icon,label])=>(
                  <div key={label as string} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:13 }}>
                    <span>{icon}</span><span style={{ color:"#5C3D1E" }}>{label}</span>
                    <span style={{ marginLeft:"auto", color:"#9A8070" }}>{dist}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
