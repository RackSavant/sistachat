/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Reduce memory usage during build
    largePageDataBytes: 128 * 1000, // 128KB
  },
  
  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Reduce client bundle size
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Optimize for Solana packages
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    return config;
  },
  
  // Reduce build output
  output: 'standalone',
  
  // Disable telemetry
  telemetry: {
    disabled: true
  }
};

module.exports = nextConfig;
