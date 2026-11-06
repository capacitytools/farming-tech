import { MetadataRoute } from 'next';

// 🚨 FIXED: Hardcoded the new primary domain
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://farmingtechbusiness.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block private areas from being crawled
        disallow: [
          '/admin', 
          '/wallet', 
          '/inbox', 
          '/login',
          '/api/' // Block API routes
        ],
      },
    ],
    sitemap: SITE + '/sitemap.xml',
  };
}