import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // Handle @shared/* imports
    build.onResolve({ filter: /^@shared\/(.*)/ }, (args) => {
      const importPath = args.path.replace('@shared/', '');
      const fullPath = path.join(__dirname, 'shared', importPath);
      
      // Try with .ts, .tsx, .js, .mjs extensions
      const extensions = ['.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.js'];
      
      for (const ext of extensions) {
        const tryPath = fullPath + ext;
        if (fs.existsSync(tryPath)) {
          return { path: tryPath };
        }
      }
      
      // If it's a directory, try index files
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        for (const ext of ['.ts', '.tsx', '.js', '.mjs']) {
          const indexPath = path.join(fullPath, `index${ext}`);
          if (fs.existsSync(indexPath)) {
            return { path: indexPath };
          }
        }
      }
      
      // Fallback: return the path as-is and let esbuild handle it
      return { path: fullPath };
    });

    // Handle @/* imports (client imports)
    build.onResolve({ filter: /^@\/(.*)/ }, (args) => {
      const importPath = args.path.replace('@/', '');
      return {
        path: path.join(__dirname, 'client/src', importPath),
      };
    });
  },
};

esbuild.build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outdir: 'dist',
  sourcemap: false,
  packages: 'external',
  conditions: ['node'],
  plugins: [aliasPlugin],
  external: [
    'mysql2',
    'drizzle-orm',
    'express',
    '@trpc/server',
    '@trpc/client',
    'react',
    'react-dom',
    'vite',
  ],
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
