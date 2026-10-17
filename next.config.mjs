/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://costly-internidal-moses.ngrok-free.dev/api/:path*',
      },
    ];
  },
};

export default nextConfig;
