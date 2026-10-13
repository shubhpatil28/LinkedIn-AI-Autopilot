/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure Vercel's file tracer bundles the TTF fonts used by @resvg/resvg-js
  // into every serverless function that calls convertSvgToPngBuffer().
  // Without this the fonts won't be present in the Lambda filesystem at runtime.
  outputFileTracingIncludes: {
    '/api/cron': ['./public/fonts/**'],
    '/api/publish': ['./public/fonts/**'],
    '/api/linkedin': ['./public/fonts/**'],
  },
};

export default nextConfig;
