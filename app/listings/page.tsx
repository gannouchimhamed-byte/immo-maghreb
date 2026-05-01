import { getListings } from "@/lib/supabase/client";
import Link from "next/link";

const fmt = (p: number) => `${Math.round(p).toLocaleString("fr-TN")} DT`;
export const revalidate = 30;

export default async function ListingsPage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  let listings: any[] = [];
  try {
    listings = await getListings({
      action: params.action, type: params.type,
      wilaya: params.wilaya, limit: 24,
    });
  } catch {}

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
          <Link href="/" style={{ fontSize:13, color:"#5C3D1E" }}>← Accueil</Link>
        </div>
      </nav>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"32px 24px" }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:300, color:"#1C1208" }}>Toutes les annonces</h1>
          <p style={{ color:"#9A8070", fontSize:13, marginTop:4 }}>{listings.length} biens trouvés</p>
        </div>
        {/* Quick filters */}
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
          {["Tous","Vente","Location"].map(f=>(
            <Link key={f} href={f==="Tous"?"/listings":`/listings?action=${f.toLowerCase()}`}
              style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:500,
                background:(!params.action&&f==="Tous")||(params.action===f.toLowerCase())?"#C4611F":"#FDFBF7",
                color:(!params.action&&f==="Tous")||(params.action===f.toLowerCase())?"#fff":"#5C3D1E",
                border:"1px solid #EDE5D4" }}>
              {f}
            </Link>
          ))}
          <div style={{ width:1, background:"#EDE5D4", margin:"0 4px" }}/>
          {["Appartement","Villa","Terrain","Bureau"].map(t=>(
            <Link key={t} href={`/listings?type=${t.toLowerCase()}`}
              style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:500,
                background:params.type===t.toLowerCase()?"#1C1208":"#FDFBF7",
                color:params.type===t.toLowerCase()?"#D4A853":"#5C3D1E",
                border:"1px solid #EDE5D4" }}>
              {t}
            </Link>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:18 }}>
          {listings.map((l:any)=>(
            <Link key={l.id} href={`/listings/${l.id}`} style={{ display:"block", background:"#FDFBF7", borderRadius:14, overflow:"hidden", border:"1px solid #EDE5D4", textDecoration:"none" }}>
              <div style={{ position:"relative", height:190 }}>
                <img src={l.primary_image_url||"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"} alt={l.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 50%,rgba(28,18,8,.5))" }} />
                <span style={{ position:"absolute", top:10, left:10, padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700, background:l.action==="vente"?"#2D6A4F":"#1A56A4", color:"#fff" }}>
                  {l.action==="vente"?"Vente":"Location"}
                </span>
                {l.ai_signal&&<span style={{ position:"absolute", top:10, right:10, padding:"3px 9px", borderRadius:20, fontSize:9, fontWeight:700, background:l.ai_signal==="underpriced"?"rgba(45,106,79,.9)":"rgba(196,97,31,.9)", color:"#fff" }}>
                  {l.ai_signal==="underpriced"?"Sous-évalué":l.ai_signal==="overpriced"?"Sur-évalué":"Juste"}
                </span>}
                <div style={{ position:"absolute", bottom:10, left:12, fontFamily:"Georgia,serif", fontSize:20, fontWeight:600, color:"#fff" }}>{fmt(l.price)}</div>
              </div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1C1208", marginBottom:3 }}>{l.title}</div>
                <div style={{ fontSize:11, color:"#9A8070", marginBottom:10 }}>📍 {l.city}, {l.wilaya}</div>
                <div style={{ display:"flex", gap:12, paddingTop:8, borderTop:"1px solid #EDE5D4", fontSize:11, color:"#5C3D1E" }}>
                  {l.rooms>0&&<span>🛏 {l.rooms}p</span>}
                  <span>📐 {l.area_m2}m²</span>
                  <span style={{ marginLeft:"auto", color:"#9A8070" }}>👁 {l.view_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
