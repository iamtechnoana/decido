import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Üst dizinlerdeki lockfile'lar yüzünden kök yanlış çıkarımını engelle.
  turbopack: { root: projectRoot },
  // Ürün görselleri herhangi bir alan adından gelebilir → uzak görsellere izin ver.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
