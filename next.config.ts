import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // The e2e suite builds into its own directory (tests/e2e/serve.ts). The
  // data cache lives under distDir and its keys don't include the database,
  // so a shared `.next` let an e2e build and a regular build serve each
  // other's content.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    // All <Image> sources are Payload media served directly from the R2
    // custom domain (see generateFileURL in payload.config.ts) — there's no
    // /public imagery left for Vercel to optimize. Skipping the optimizer
    // entirely removes both the transformation count AND the Fast Origin
    // Transfer cost of that route, since the browser fetches straight from
    // R2/Cloudflare instead of round-tripping through a Vercel function.
    // next/image still renders explicit width/height + lazy-loading + alt,
    // it just stops generating resized/reformatted variants server-side.
    unoptimized: true,
    // Kept for reference / an easy revert to per-image `unoptimized={false}`
    // later — inert while images.unoptimized is true above.
    qualities: [75, 90],
    deviceSizes: [640, 750, 1080, 1200, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 2592000,
  },
  // Baseline security headers. Deliberately not a full Content-Security-Policy:
  // Next injects inline bootstrap scripts and this layout renders an inline
  // <style> plus a JSON-LD block, so a real CSP needs nonce plumbing through
  // the proxy and testing against the admin panel — worth doing, but not
  // something to switch on blind. HSTS is left to Vercel, which sets it on
  // custom domains; declaring it here too would just duplicate the header.
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    // Framing. The admin and the API are never embedded: framing the panel is
    // a clickjacking route to authenticated actions. The site's pages and the
    // preview route are framed by one thing only, the admin's Live Preview,
    // on the same origin — so same-origin framing, for both the legacy header
    // and CSP. Disjoint sources, so no header is sent twice.
    {
      source: '/((?!fr(?:/|$)|en(?:/|$)|api/preview$).*)',
      headers: [{ key: 'X-Frame-Options', value: 'DENY' }],
    },
    // The generated share cards stay out of image search, like the uploads
    // (media.zolangivre.com sends the same header). Social crawlers ignore it.
    {
      source: '/:path(.*opengraph-image.*)',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
    },
    ...['/:locale(fr|en)', '/:locale(fr|en)/:path*', '/api/preview'].map((source) => ({
      source,
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      ],
    })),
  ],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
