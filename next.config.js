/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'out',
    images: {
        unoptimized: true, // For static export
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'grey-frog-921983.hostingersite.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    // Base path for static hosting (if you're not hosting at the root)
    // basePath: '/certificate-generator',
    // If you're using a custom domain, you don't need basePath

    // Define trailing slash behavior
    trailingSlash: true,

    // Disable linting during builds
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Disable TypeScript checks during builds
    typescript: {
        ignoreBuildErrors: true,
    },

    // Environmental variables for the client
    env: {
        NEXT_PUBLIC_SITE_URL: 'https://grey-frog-921983.hostingersite.com',
        NEXT_PUBLIC_IS_STATIC: 'true'
    },

    // Static page generation configuration
    generateStaticParams: async () => {
        return [
            { path: '/' },
            { path: '/login' }
        ];
    }
};

module.exports = nextConfig; 