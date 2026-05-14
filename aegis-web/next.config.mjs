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
    runtimeCaching: [{ 
      urlPattern: /^https:\/\/.*\.onrender\.com\/api\/v1\/.*/, 
      handler: 'NetworkFirst', 
      options: { cacheName: 'api-cache', expiration: { maxEntries: 100 }, networkTimeoutSeconds: 8 } 
    }] 
  }
});

const nextConfig = { reactStrictMode: true };
export default pwaConfig(nextConfig);
