import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

function prependClientDirective() {
  for (const file of ['lib/index.js', 'lib/index.cjs']) {
    const source = readFileSync(file, 'utf8');
    if (source.startsWith("'use client'") || source.startsWith('"use client"')) continue;
    writeFileSync(file, `'use client';\n${source}`);
  }
}

const shared = {
  format: ['esm', 'cjs'] as ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: false,
  target: 'es2018' as const,
  outDir: 'lib',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'next', 'next/script'],
  splitting: false,
  treeshake: true,
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    onSuccess: prependClientDirective,
  },
  {
    ...shared,
    entry: { server: 'src/server.ts' },
  },
]);
