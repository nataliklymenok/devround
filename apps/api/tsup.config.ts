import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  target: 'node24',
  platform: 'node',
  clean: true,
  // Bundle the workspace package (shipped as TypeScript source); keep npm deps external.
  noExternal: ['@devround/shared'],
})
