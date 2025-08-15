import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uncomment if Mentra OS serves the app under a subpath
  // basePath: '/sistachat',
  
  // Allow ngrok and other dev origins
  allowedDevOrigins: ['f2d5ae0bbc82.ngrok-free.app'],
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eywldyeoffgpinitacys.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add a more generic pattern for any Supabase project
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Reduce memory usage during build
    largePageDataBytes: 128 * 1000, // 128KB
  },
  
  // Webpack configuration
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
      config.externals.push(
        {
          'utf-8-validate': 'commonjs utf-8-validate',
          'bufferutil': 'commonjs bufferutil',
        }
      );
    }
    
    return config;
  },
  
  // Output configuration
  output: 'standalone',
};

export default nextConfig;
