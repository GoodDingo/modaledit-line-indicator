/**
 * esbuild configuration for VS Code extension
 * Single source of truth for build configuration
 *
 * Modern best practice (2025):
 * - esbuild for bundling and minification (10-100x faster than webpack)
 * - Single bundled file for faster extension loading
 * - Production: minified, no source maps
 * - Development: source maps for debugging
 */

const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
    target: 'es2020',
    define: {
      'process.env.NODE_ENV': production ? '"production"' : '"development"',
    },
  });

  if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log(`Build complete (${production ? 'production' : 'development'} mode)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
