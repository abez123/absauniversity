import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@shared\/(.*)/ }, (args) => {
      const importPath = args.path.replace('@shared/', '');
      return {
        path: path.join(__dirname, 'shared', importPath),
      };
    });
  },
};

esbuild.build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  plugins: [aliasPlugin],
  external: [
    'mysql2',
    'drizzle-orm',
    'express',
    '@trpc/server',
    '@trpc/client',
  ],
}).catch(() => process.exit(1));
