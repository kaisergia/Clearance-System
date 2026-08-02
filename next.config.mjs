/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "192.168.1.38",
    "clearance-system.local",
    "*.trycloudflare.com",
    "baseball-reproduce-fruits-journal.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      {
        // YouTube video thumbnails used in the VideoSection carousel
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      {
        // Google profile photos
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
