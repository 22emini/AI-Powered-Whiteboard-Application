import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blankcanvas.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/signin", "/signup", "/forgot-password"],
        disallow: ["/dashboard", "/dashboard/*", "/board/*", "/reset-password/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
