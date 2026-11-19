/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // TensorFlow.js has some code for Node.js (fs, path). The browser never uses it,
  // so we tell webpack to ignore those modules in the browser bundle.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

export default nextConfig;
