/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app lives under src/. Next.js App Router routes are in src/app/.
  // src/web (UI components), src/series, src/data, src/rules, src/ai, src/api,
  // src/ingestion, src/auth, src/billing are internal modules imported via "@/...".
};

export default nextConfig;
