import withPWA from '@ducanh2912/next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: { document: '/~offline' },
  workboxOptions: { 
    runtimeCaching: [
      // REMOVED the API caching rule entirely
      // Keep only static asset caching
      {
        urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|woff2)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
          }
        }
      }
    ] 
  }
});

const nextConfig = { reactStrictMode: true };
export default pwaConfig(nextConfig);
