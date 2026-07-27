import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [75, 90],
    // Trimmed from the Next.js defaults ([640,750,828,1080,1200,1920,2048,3840] /
    // [16,32,48,64,96,128,256,384]) to only the widths this site can ever render:
    // layout breakpoints are 720px (gallery) and 1024px (lg:), and the content
    // column caps at 1200px (--max-width in styles.css). 1920/2560 cover 1x/2x
    // full-bleed cover images at that max width; nothing on the site goes wider.
    deviceSizes: [640, 750, 1080, 1200, 1920, 2560],
    // Icon/logo <Image>s render at 14-40px (TechChip, timeline logos, avatars),
    // so 96px (their ~2x DPR ceiling) is the largest bucket actually needed.
    imageSizes: [16, 32, 48, 64, 96],
    // Vercel's default is 60s, which regenerates (and re-bills) every cached
    // variant roughly every minute under steady traffic. 30 days matches the
    // monthly transformation-quota cycle while avoiding the year-long staleness
    // risk if a Media file is ever replaced in place under the same filename.
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
