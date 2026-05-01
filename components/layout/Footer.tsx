import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "#1C1208", borderTop: "1px solid rgba(255,255,255,.06)", padding: "40px 24px 20px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 30 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: "#C4611F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>م</span>
              </div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#fff" }}>ImmoMaghreb</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(253,251,247,.4)", maxWidth: 200, lineHeight: 1.6 }}>N°1 de l'immobilier en Tunisie et au Maghreb.</p>
          </div>
          <div style={{ flex: 1 }} />
          {[["Acheter", ["Appartements","Villas","Terrains","Bureaux"]], ["Louer", ["Appartements","Villas","Studios"]], ["Société", ["À propos","Contact","Blog"]]].map(([title, links]) => (
            <div key={title as string}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(253,251,247,.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{title as string}</div>
              {(links as string[]).map(l => (
                <Link key={l} href="/listings" style={{ display: "block", fontSize: 13, color: "rgba(253,251,247,.55)", marginBottom: 8 }}>{l}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 16, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "rgba(253,251,247,.25)" }}>© 2026 ImmoMaghreb · Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
