import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin } from "lucide-react";

const footerLinks = {
  Acheter: [
    { label: "Appartements à Tunis", href: "/listings?type=sale&property=apartment&wilaya=tunis" },
    { label: "Villas à La Marsa", href: "/listings?type=sale&property=villa&delegation=la-marsa" },
    { label: "Terrains constructibles", href: "/listings?type=sale&property=land" },
    { label: "Locaux commerciaux", href: "/listings?type=sale&property=commercial" },
    { label: "Nouvelles constructions", href: "/listings?status=new" },
  ],
  Louer: [
    { label: "Appartements meublés", href: "/listings?type=rent&furnished=true" },
    { label: "Studios", href: "/listings?type=rent&property=studio" },
    { label: "Location saisonnière", href: "/listings?type=rent&duration=short" },
    { label: "Bureaux et coworking", href: "/listings?type=rent&property=office" },
  ],
  Services: [
    { label: "Estimation IA gratuite", href: "/estimate" },
    { label: "Trouver un SAMSAR", href: "/agents" },
    { label: "Promoteurs & projets", href: "/developers" },
    { label: "Publier une annonce", href: "/post" },
    { label: "Guide de l'acheteur", href: "/guide/achat" },
  ],
  Société: [
    { label: "À propos", href: "/about" },
    { label: "Carrières", href: "/careers" },
    { label: "Presse", href: "/press" },
    { label: "Blog immobilier", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-charcoal-900 text-sand-200">
      {/* Top section */}
      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-3xl font-semibold text-sand-50">Immo</span>
              <span className="font-display text-3xl font-light text-gold-500">NA</span>
            </Link>
            <p className="font-body text-sm text-sand-400 leading-relaxed max-w-xs mb-6">
              La référence de l&apos;immobilier en Tunisie et Afrique du Nord. 
              Powered by intelligence artificielle.
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href="tel:+21671000000"
                className="flex items-center gap-2.5 font-body text-sm text-sand-300 hover:text-gold-400 transition-colors"
              >
                <Phone size={13} className="text-gold-500" />
                +216 71 000 000
              </a>
              <a
                href="mailto:contact@immo-na.tn"
                className="flex items-center gap-2.5 font-body text-sm text-sand-300 hover:text-gold-400 transition-colors"
              >
                <Mail size={13} className="text-gold-500" />
                contact@immo-na.tn
              </a>
              <span className="flex items-center gap-2.5 font-body text-sm text-sand-400">
                <MapPin size={13} className="text-gold-500" />
                Les Berges du Lac II, Tunis
              </span>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-sand-700 text-sand-400 hover:border-gold-500 hover:text-gold-400 transition-all duration-200"
                  aria-label="Social"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="lg:col-span-1">
              <h4 className="font-display text-base font-medium text-sand-100 mb-4">
                {title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-sand-400 hover:text-gold-400 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Markets bar */}
      <div className="border-t border-sand-800/50">
        <div className="container-site py-4 flex flex-wrap items-center gap-4">
          <span className="font-body text-xs text-sand-500 uppercase tracking-widest">
            Marchés
          </span>
          {["Tunis", "Sfax", "Sousse", "Nabeul", "Bizerte", "Monastir", "Annaba", "Casablanca"].map(
            (city) => (
              <Link
                key={city}
                href={`/listings?city=${city.toLowerCase()}`}
                className="font-body text-xs text-sand-400 hover:text-gold-400 transition-colors"
              >
                {city}
              </Link>
            )
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-sand-800/50">
        <div className="container-site py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-sand-500">
            © 2026 Immo NA SARL. Tous droits réservés.
          </p>
          <div className="flex items-center gap-5">
            {["Conditions d'utilisation", "Confidentialité", "Cookies", "Légal"].map((item) => (
              <Link
                key={item}
                href="#"
                className="font-body text-xs text-sand-500 hover:text-sand-300 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
