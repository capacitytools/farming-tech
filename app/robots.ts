import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.SITE_URL || "https://farming-tech.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/inbox", "/login"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}