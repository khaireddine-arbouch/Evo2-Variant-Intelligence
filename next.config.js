/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Radix UI packages for compatibility
  transpilePackages: [
    '@radix-ui/react-dialog',
    '@radix-ui/react-slider',
    '@radix-ui/react-tabs',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-select',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-slot',
  ],
  // Webpack configuration for pnpm symlink resolution (needed for builds)
  webpack: (config, { isServer }) => {
    // Resolve symlinks properly for pnpm (critical for Windows)
    config.resolve.symlinks = true
    
    // Ensure proper module resolution
    if (!config.resolve.modules) {
      config.resolve.modules = []
    }
    config.resolve.modules.push('node_modules')
    
    // Better handling of pnpm's nested structure
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    }
    
    return config
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Headers for security and SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

