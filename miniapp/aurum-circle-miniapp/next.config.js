/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // For Docker deployment, creates a standalone output
  // output: 'export', // Alternative for static export if needed, but not for full SSR
  env: {
    NEXT_PUBLIC_WORLDCOIN_APP_ID: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
    WORLDCOIN_APP_SECRET: process.env.WORLDCOIN_APP_SECRET,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_API_GATEWAY_URL:
      process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8081/api",
    // Add other environment variables as needed
  },
  images: {
    // Important: Add domains for any external image sources used in the app
    domains: ["ipfs.io", "gateway.pinata.cloud", "your-cdn.com"], // Replace with your actual CDN
    unoptimized: false, // Disable Next.js image optimization if you have a custom solution or want to rely on external CDN
    // formats: ['image/webp', 'image/avif'], // Enable modern image formats
  },
  compress: true, // Enable gzip compression
  // basePath: '/aurum-miniapp', // Set if deploying under a subpath
  // assetPrefix: 'https://your-cdn.com/aurum-miniapp', // For CDN serving of assets

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.worldcoin.org https://*.vercel.app; style-src 'self' 'unsafe-inline' https://*.vercel.app; img-src 'self' data: https:; connect-src 'self' http://localhost:8081 https://*.alchemy.com https://*.worldcoin.org https://*.walletconnect.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';", // Adjust as per your actual needs
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Handle node modules that are not compatible with Next.js SSR or client-side
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        // Add other Node.js modules if your client-side code tries to import them
      };
    }

    // Optimization for production builds
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
          },
        },
      };
    }

    // Example: Exclude specific large libraries from being bundled into client-side JS if they are server-only or loaded dynamically
    // config.externals = config.externals || []
    // if (!isServer) {
    //   config.externals.push({
    //       'module-name': 'commonjs module-name'
    //   })
    // }

    return config;
  },

  // Experimental features (if needed)
  // experimental: {
  //   // serverActions: true, // If using Server Actions
  //   // serverComponentsExternalPackages: ['some-package'], // If using external packages with server components
  // },
};

module.exports = nextConfig;
