import { getFeaturedListings } from "@/lib/supabase/client";
import Link from "next/link";

const fmt = (p: number) => `${Math.round(p).toLocaleString("fr-TN")} DT`;

export const revalidate = 60;

export default async function HomePage() {
  let listings: any[] = [];
  try { listings = await getFeaturedListings(); } catch {}

  return (
    <div style={{ background:"#F7F2E9", minHeight:"100vh" }}>
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"#FDFBF7", borderBottom:"1px solid #EDE5D4", boxShadow:"0 1px 12px rgba(28,18,8,.06)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", height:60, gap:20 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:7, background:"#C4611F", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#fff", fontFamily:"Georgia,serif", fontSize:18, fontWeight:700 }}>م</span>
            </div>
            <span style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:600, color:"#1C1208" }}>ImmoMaghreb</span>
          </Link>
          <div style={{ flex:1 }} />
          <Link href="/listings" style={{ padding:"7px 16px", borderRadius:8, background:"#EDE5D4", color:"#5C3D1E", fontSize:13, fontWeight:500 }}>Annonces</Link>
          <Link href="/listings" style={{ padding:"7px 16px", borderRadius:8, background:"#C4611F", color:"#fff", fontSize:13, fontWeight:600 }}>Publier</Link>
        </div>
      </nav>
      <div style={{ minHeight:"80vh", position:"relative", display:"flex", alignItems:"center", background:"linear-gradient(135deg,#1C1208,#3D1F08,#5C2E0A)" }}>
        <div style={{ position:"absolute", inset:0, opacity:.07, backgroundImage:"repeating-linear-gradient(45deg,#D4A853 0,#D4A853 1px,transparent 1px,transparent 40px),repeating-linear-gradient(-45deg,#D4A853 0,#D4A853 1px,transparent 1px,transparent 40px)", backgroundSize:"40px 40px" }} />
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 32px", position:"relative", zIndex:2, width:"100%" }}>
          <div style={{ maxWidth:600 }}>
            <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:300, color:"#fff", lineHeight:1.1, marginBottom:16, letterSpacing:"-1px" }}>
              Trouvez votre<br /><em style={{ color:"#D4A853" }}>bien idéal</em><br />au Maghreb
            </h1>
            <p style={{ color:"rgba(253,251,247,.6)", fontSize:16, lineHeight:1.7, marginBottom:32 }}>Appartements, villas, terrains — estimation IA, contact WhatsApp.</p>
            <div style={{ background:"#FDFBF7", borderRadius:14, padding:20, boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
              <div style={{ display:"flex", gap:8 }}>
                <input placeholder="Ville, quartier, wilaya..." style={{ flex:1, border:"1px solid #EDE5D4", background:"#F7F2E9", borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none" }} />
                <Link href="/listings" style={{ padding:"10px 22px", borderRadius:8, background:"#C4611F", color:"#fff", fontWeight:600, fontSize:14, whiteSpace:"nowrap" }}>Rechercher</Link>
              </div>
            </div>
            <div style={{ display:"flex", gap:28, marginTop:24 }}>
              {[["12k+","Annonces"],["3.2k","Agents"],["24","Wilayas"]].map(([n,l])=>(
                <div key={l}>
                  <div style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:600, color:"#D4A853" }}>{n}</div>
                  <div style={{ fontSize:11, color:"rgba(253,251,247,.5)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"60px 24px 40px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:"#C4611F", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Sélection du moment</div>
            <h2 style={{ fontFamily:"Georgia,serif", fontSize:32, fontWeight:300, color:"#1C1208" }}>Biens en vedette</h2>
          </div>
          <Link href="/listings" style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #C4611F", color:"#C4611F", fontSize:13, fontWeight:500 }}>Voir tout →</Link>
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
      <footer style={{ background:"#1C1208", padding:"30px 24px", textAlign:"center" }}>
        <p style={{ color:"rgba(253,251,247,.3)", fontSize:12 }}>© 2026 ImmoMaghreb · Tous droits réservés</p>
      </footer>
    </div>
  );
}
