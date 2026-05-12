import { MetadataRoute } from 'next';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/secret/'],
    },
    sitemap: 'https://ilusion.io/sitemap.xml',
  };
}
