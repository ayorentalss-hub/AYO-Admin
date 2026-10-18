/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ayo-platform-api-1015630533512.europe-west1.run.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
