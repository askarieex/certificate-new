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

    // CORS headers (only works for Next.js API routes, not static exports)
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
        ];
    },

    // Environmental variables for the client
    env: {
        NEXT_PUBLIC_SITE_URL: 'https://grey-frog-921983.hostingersite.com',
        NEXT_PUBLIC_IS_STATIC: 'true'
    },

    // Redirects and rewrites for static hosting
    async rewrites() {
        return {
            fallback: [
                // Use the 404 page to handle certificate paths
                {
                    source: '/output/:path*',
                    destination: '/404.html',
                },
            ],
        };
    },
};

module.exports = nextConfig; 