/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  serverExternalPackages: ['@prisma/client', 'prisma', 'tesseract.js'],
};

export default nextConfig;
