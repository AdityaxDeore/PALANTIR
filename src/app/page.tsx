import { FlightTracker } from "@/components/flight-tracker";

const siteUrl = "https://palantir.adityadeore.com";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#app`,
    name: "PALANTIR",
    url: siteUrl,
    description:
      "Track live flights in stunning 3D over the world's busiest airspaces. See real-time ADS-B data with altitude-aware rendering — low altitudes glow cyan, high altitudes shift to gold. Free and open source.",
    applicationCategory: "TravelApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires WebGL support",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
    },
    author: {
      "@type": "Person",
      name: "Aditya Deore",
      url: "https://github.com/AdityaxDeore",
    },
    featureList: [
      "Real-time 3D flight tracking",
      "Altitude-aware color rendering",
      "Live ADS-B data from multiple sources",
      "3D aircraft models",
      "City-based airspace views",
      "Live ATC audio streaming",
      "Flight trail visualization",
      "Aircraft photo lookup",
      "Dark mode interface",
    ],
    screenshot:
      "https://github.com/user-attachments/assets/9d1f50ed-be4e-4ef5-95ac-257e9129f8c8",
    softwareVersion: "0.1.0",
    isAccessibleForFree: true,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "PALANTIR",
    url: siteUrl,
    description:
      "Real-time 3D flight tracking — altitude-aware, visually stunning, and completely free.",
    inLanguage: "en",
    publisher: {
      "@type": "Person",
      name: "Aditya Deore",
      url: "https://github.com/AdityaxDeore",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "PALANTIR — Real-Time 3D Flight Tracking",
        item: siteUrl,
      },
    ],
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <FlightTracker />
    </>
  );
}
