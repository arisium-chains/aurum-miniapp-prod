/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@tensorflow/tfjs-node', 'onnxruntime-node'],
  output: 'standalone',
  compress: true, // Enable gzip compression
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Enable minimization in production
    if (!dev && !isServer) {
      config.optimization.minimize = true;
    }
    return config;
  }
}

export default nextConfig
