const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    // fishfarms.geojson은 크기가 크므로 첫 fetch 후 캐싱
    runtimeCaching: [
      {
        urlPattern: /\/fishfarms\.geojson$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'geojson-cache',
          expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
