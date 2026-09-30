import { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farming-tech.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/wallet', '/inbox', '/login'],
      },
    ],
    sitemap: SITE + '/sitemap.xml',
  };
}