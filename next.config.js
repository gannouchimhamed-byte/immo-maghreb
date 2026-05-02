/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "icmfvoximdrnglfwjxat.supabase.co" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};
module.exports = nextConfig;
