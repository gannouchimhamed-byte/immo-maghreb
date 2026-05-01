/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { domains: ["images.unsplash.com", "icmfvoximdrnglfwjxat.supabase.co"] },
};
module.exports = nextConfig;
