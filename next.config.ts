import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用源映射
  productionBrowserSourceMaps: true,
  
  // 压缩配置
  compress: true,
  
  // SWC 压缩配置
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 实验性功能
  experimental: {
    // 启用更详细的源映射
    esmExternals: true,
    // 优化包大小
    optimizePackageImports: ['lucide-react', 'framer-motion', 'react-icons'],
  },
  
  // 优化图片
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack 配置
  webpack: (config, { dev, isServer }) => {
    // 在生产环境中生成源映射
    if (!dev && !isServer) {
      config.devtool = 'source-map';
    }
    
    // 优化包大小和压缩
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer,
          // 添加 Terser 压缩配置
          new (require('terser-webpack-plugin'))({
            terserOptions: {
              compress: {
                drop_console: true, // 移除 console.log
                drop_debugger: true, // 移除 debugger
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // 移除特定函数调用
                passes: 3, // 多次压缩
                unsafe: true, // 启用不安全的优化
                unsafe_comps: true, // 不安全的比较优化
                unsafe_math: true, // 不安全的数学优化
                unsafe_proto: true, // 不安全的原型优化
                dead_code: true, // 移除死代码
                unused: true, // 移除未使用的变量
                side_effects: false, // 假设没有副作用
              },
              mangle: {
                safari10: true, // Safari 10 兼容性
                properties: {
                  regex: /^_/, // 混淆以下划线开头的属性
                },
              },
              format: {
                comments: false, // 移除注释
                ascii_only: true, // 只使用 ASCII 字符
              },
            },
            extractComments: false, // 不提取注释到单独文件
            parallel: true, // 并行压缩
          }),
        ],
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // 将大的库分离到单独的 chunk
            gsap: {
              test: /[\\/]node_modules[\\/](gsap)[\\/]/,
              name: 'gsap',
              chunks: 'all',
              priority: 20,
            },
            three: {
              test: /[\\/]node_modules[\\/](three)[\\/]/,
              name: 'three',
              chunks: 'all',
              priority: 20,
            },
            reactIcons: {
              test: /[\\/]node_modules[\\/](react-icons)[\\/]/,
              name: 'react-icons',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob: https:",
              "connect-src 'self' https://api.firebase.com https://*.firebase.com https://*.googleapis.com wss:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  }
};

export default nextConfig;
