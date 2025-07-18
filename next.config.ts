import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uncomment if Mentra OS serves the app under a subpath
  // basePath: '/sistachat',
  
  // Allow ngrok and other dev origins
  allowedDevOrigins: ['f2d5ae0bbc82.ngrok-free.app'],
  
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
};

export default nextConfig;
