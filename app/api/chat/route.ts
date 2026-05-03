import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/supabase/client";

const SYSTEM_PROMPT = `Tu es Hestia IA, l'assistant immobilier intelligent de la plateforme Hestia — la référence de l'immobilier en Tunisie.

Ton rôle :
- Aider les utilisateurs à trouver des biens immobiliers en Tunisie (appartements, villas, terrains, bureaux, duplex, studios)
- Expliquer les signaux IA de prix (Sous-évalué = bonne affaire, Sur-évalué = attention, Juste prix = marché)
- Donner des conseils sur le marché immobilier tunisien
- Expliquer comment utiliser la plateforme Hestia
- Répondre principalement en français, mais tu comprends l'arabe et l'anglais

Quand l'utilisateur cherche un bien, extrait : action (vente/location), type (appartement/villa/terrain/bureau/duplex/studio), wilaya, budget max en TND, pièces.
Si tu détectes une intention de recherche, commence ta réponse avec ce JSON EXACT sur une ligne :
SEARCH:{"action":"vente","type":"villa","wilaya":"Sousse","maxPrice":500000,"rooms":null}

Puis continue avec ta réponse normale en français. Incarne l'excellence de la marque Hestia. Maximum 3 phrases sauf si une liste est nécessaire.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    let replyText = "";

    if (apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: messages.map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
          }),
        }
      );
      const data = await res.json();
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    if (!replyText) {
      replyText = smartFallback(messages[messages.length - 1]?.content ?? "");
    }

    let searchParams: Record<string, any> | null = null;
    if (replyText.includes("SEARCH:")) {
      const match = replyText.match(/SEARCH:(\{[^\n]+\})/);
      if (match) {
        try { searchParams = JSON.parse(match[1]); } catch {}
        replyText = replyText.replace(/SEARCH:\{[^\n]+\}\n?/, "").trim();
      }
    }

    let listings: any[] = [];
    if (searchParams) {
      listings = await searchListings({
        action: searchParams.action ?? null,
        type: searchParams.type ?? null,
        wilaya: searchParams.wilaya ?? null,
        maxPrice: searchParams.maxPrice ?? null,
        rooms: searchParams.rooms ?? null,
        limit: 6,
      });
    }

    return NextResponse.json({ reply: replyText, listings });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "Une erreur est survenue. Veuillez réessayer.", listings: [] },
      { status: 500 }
    );
  }
}

function smartFallback(message: string): string {
  const lower = message.toLowerCase();

  const isSearch =
    /villa|appartement|terrain|bureau|duplex|studio/.test(lower) ||
    /cherche|trouve|annonce|bien/.test(lower) ||
    /tunis|sousse|sfax|nabeul|monastir|hammamet|bizerte/.test(lower) ||
    /location|louer|vente|acheter/.test(lower);

  if (isSearch) {
    const action = /locat|louer/.test(lower) ? "location" : "vente";
    const type = /villa/.test(lower) ? "villa"
      : /terrain/.test(lower) ? "terrain"
      : /bureau/.test(lower) ? "bureau"
      : /duplex/.test(lower) ? "duplex"
      : /studio/.test(lower) ? "studio"
      : "appartement";
    const wilaya = /sousse/.test(lower) ? "Sousse"
      : /sfax/.test(lower) ? "Sfax"
      : /nabeul|hammamet/.test(lower) ? "Nabeul"
      : /monastir/.test(lower) ? "Monastir"
      : /bizerte/.test(lower) ? "Bizerte"
      : /tunis/.test(lower) ? "Tunis"
      : null;
    const pm = lower.match(/(\d+)\s*k/);
    const maxPrice = pm ? parseInt(pm[1]) * 1000 : null;
    return `SEARCH:${JSON.stringify({ action, type, wilaya, maxPrice, rooms: null })}\nVoici les biens correspondant à votre recherche :`;
  }

  if (/sous.?évalué|sur.?évalué|juste prix|signal/.test(lower)) {
    return "Les **signaux IA** de Hestia analysent le prix de chaque bien par rapport au marché local :\n\n🟢 **Sous-évalué** — Bonne affaire, prix inférieur au marché\n🔴 **Sur-évalué** — Prix au-dessus du marché, négociez !\n🟡 **Juste prix** — Prix conforme au marché";
  }
  if (/publier|poster|vendre mon|mettre en vente/.test(lower)) {
    return "Pour publier un bien sur Hestia, cliquez sur **« Publier »** en haut à droite. Il vous suffit de créer un compte, puis de remplir le formulaire avec les photos et détails de votre bien.";
  }
  if (/favori|sauvegard/.test(lower)) {
    return "Cliquez sur le ❤️ sur n'importe quelle annonce pour la sauvegarder dans vos **Favoris**, accessibles depuis le menu principal.";
  }
  if (/alerte|notification|whatsapp/.test(lower)) {
    return "Activez les **alertes Hestia** pour être notifié dès qu'un bien correspond à vos critères — par WhatsApp, email ou notification push.";
  }
  if (/estimation|estimer|valeur|combien vaut/.test(lower)) {
    return "Hestia IA peut estimer la valeur de votre bien ! Consultez notre **widget d'estimation** sur la page d'une annonce similaire.";
  }
  return "Bonjour 👋 Je suis **Hestia IA**, votre assistant immobilier en Tunisie. Je peux vous aider à :\n\n🔍 Trouver des biens (*«villa à Sousse < 500K»*)\n💡 Comprendre nos signaux de prix IA\n📝 Publier ou estimer votre bien\n\nQue recherchez-vous ?";
}
