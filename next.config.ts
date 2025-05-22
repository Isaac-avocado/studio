import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // <-- Configuracion para exportar
  trailingSlash: true, // <-- Configuracion para exportar
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,

  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    unoptimized: true, // Disable Image Optimization for static export
  },
};

export default nextConfig;
