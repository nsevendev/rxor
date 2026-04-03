import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/core/index.ts',
      'react/index': 'src/react/index.ts',
      'store/index': 'src/store/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: true,
    treeshake: true,
    external: ['react', 'react-dom'],
  },
])
