import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
