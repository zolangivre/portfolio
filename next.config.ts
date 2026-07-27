import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
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
