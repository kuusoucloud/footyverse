/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  webpack: (config, { isServer }) => {
    // Exclude Supabase functions from webpack processing
    config.externals = config.externals || [];
    config.externals.push({
      'supabase/functions': 'commonjs supabase/functions'
    });
    
    // Ignore Supabase functions directory entirely
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**']
    };
    
    return config;
  },
  // Exclude supabase functions from compilation
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'].map(ext => 
    `!(**/supabase/functions/**).${ext}`
  ).concat(['js', 'jsx', 'ts', 'tsx'])
};

module.exports = nextConfig;