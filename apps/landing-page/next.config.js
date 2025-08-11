/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Extend the shared TypeScript configuration
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // ESLint configuration
    dirs: ['app', 'components', 'styles'],
  },
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Image optimization
  images: {
    domains: [],
  },
  // Headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Redirects
  async redirects() {
    return [];
  },
  // Rewrites
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
