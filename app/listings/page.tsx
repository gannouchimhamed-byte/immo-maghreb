import { searchListings as getListings } from "@/lib/supabase/client";
import Link from "next/link";

const fmt = (p: number) => `${Math.round(p).toLocaleString("fr-TN")} DT`;
export const revalidate = 30;

export default async function ListingsPage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  let listings: any[] = [];
  try { listings = await getListings({ action: params.action, type: params.type, wilaya: params.wilaya }); } catch {}

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
          <Link href="/" style={{ fontSize:12, color:"rgba(247,243,238,.6)", textDecoration:"none", letterSpacing:"0.05em" }}>← ACCUEIL</Link>
        </div>
      </nav>

      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px 24px" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:10, color:"#D4AF64", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>· Annonces ·</div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:400, color:"#1B2B3A" }}>Tous les biens</h1>
          <p style={{ color:"#9A8878", fontSize:13, marginTop:4 }}>{listings.length} biens disponibles</p>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:8, marginBottom:28, flexWrap:"wrap" }}>
          {["Tous","Vente","Location"].map(f=>(
            <Link key={f} href={f==="Tous"?"/listings":`/listings?action=${f.toLowerCase()}`}
              style={{ padding:"7px 16px", borderRadius:7, fontSize:12, fontWeight:500, letterSpacing:"0.05em",
                background:(!params.action&&f==="Tous")||(params.action===f.toLowerCase())?"#1B2B3A":"#FDFAF6",
                color:(!params.action&&f==="Tous")||(params.action===f.toLowerCase())?"#D4AF64":"#6B5B4E",
                border:"1px solid #D4C4B0", textDecoration:"none" }}>
              {f.toUpperCase()}
            </Link>
          ))}
          <div style={{ width:1, background:"#D4C4B0", margin:"0 4px" }}/>
          {["Appartement","Villa","Terrain","Bureau"].map(t=>(
            <Link key={t} href={`/listings?type=${t.toLowerCase()}`}
              style={{ padding:"7px 16px", borderRadius:7, fontSize:12,
                background:params.type===t.toLowerCase()?"#D4AF64":"#FDFAF6",
                color:params.type===t.toLowerCase()?"#1B2B3A":"#6B5B4E",
                border:"1px solid #D4C4B0", textDecoration:"none" }}>
              {t}
            </Link>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:20 }}>
          {listings.map((l:any)=>(
            <Link key={l.id} href={`/listings/${l.id}`} style={{ display:"block", textDecoration:"none" }}>
              <div style={{ background:"#FDFAF6", borderRadius:14, overflow:"hidden", border:"1px solid #E8DDD0" }}>
                <div style={{ position:"relative", height:200 }}>
                  <img src={l.primary_image_url||"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500"} alt={l.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 45%,rgba(27,43,58,.65))" }} />
                  <div style={{ position:"absolute", top:12, left:12, display:"flex", gap:6 }}>
                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:600, background:l.action==="vente"?"rgba(45,106,79,.9)":"rgba(26,86,164,.9)", color:"#fff" }}>
                      {l.action==="vente"?"VENTE":"LOCATION"}
                    </span>
                  </div>
                  {l.ai_signal==="underpriced"&&<span style={{ position:"absolute", top:12, right:12, padding:"3px 10px", borderRadius:20, fontSize:9, fontWeight:700, background:"rgba(45,106,79,.9)", color:"#fff" }}>SOUS-ÉVALUÉ</span>}
                  <div style={{ position:"absolute", bottom:12, left:14, fontFamily:"Georgia,serif", fontSize:20, color:"#fff" }}>{fmt(l.price)}</div>
                </div>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#1B2B3A", marginBottom:4, fontFamily:"Georgia,serif" }}>{l.title}</div>
                  <div style={{ fontSize:11, color:"#9A8878", marginBottom:12 }}>📍 {l.city}, {l.wilaya}</div>
                  <div style={{ display:"flex", gap:14, paddingTop:10, borderTop:"1px solid #E8DDD0", fontSize:11, color:"#6B5B4E" }}>
                    {l.rooms>0&&<span>🛏 {l.rooms}p</span>}
                    <span>📐 {l.area_m2}m²</span>
                    <span style={{ marginLeft:"auto", color:"#9A8878" }}>👁 {l.view_count||0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <footer style={{ background:"#141F29", padding:"24px", textAlign:"center", marginTop:48 }}>
        <p style={{ fontSize:11, color:"rgba(247,243,238,.25)", letterSpacing:"0.05em" }}>© 2026 HESTIA · TOUS DROITS RÉSERVÉS</p>
      </footer>
    </div>
  );
}
