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
    runtimeCaching: [] 
  }
});

const nextConfig = { reactStrictMode: true };
export default pwaConfig(nextConfig);
