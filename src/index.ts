import deepmerge from 'deepmerge'
import fs from 'fs-extra'
import path from 'path'
import { InlineConfig, UserConfig } from './config.js'

export async function sync(config: InlineConfig) {
  const { resolveConfig } = await import('./config.js')
  const resolved = await resolveConfig(config)

  const tsconfig = deepmerge(
    {
      include: ['src'],
      compilerOptions: {
        rootDir: 'src',
        outDir: 'dist',
        skipLibCheck: true,
        target: 'ESNext',
        module: 'ESNext',
        strict: true,
        moduleResolution: 'node',
        esModuleInterop: true,
        resolveJsonModule: true,
        composite: true,
        emitDeclarationOnly: true,
      },
    },
    resolved.tsconfig
  )

  console.log('xxxxxxxxxxxx')

  await fs.writeFile(
    path.resolve(resolved.root, 'tsconfig.json'),
    '// Genenrated by `tsdv sync`, do not edit by hand\n' +
      JSON.stringify(tsconfig, null, 2)
  )
}

export async function watch(config: InlineConfig) {
  const { resolveConfig } = await import('./config.js')
  const resolved = await resolveConfig(config)
  const { runTsc, buildJs } = await import('./build.js')

  await fs.emptyDir(resolved.outDir)
  await Promise.all([
    ...resolved.formats.map((format) => buildJs(resolved, true, format)),
    resolved.tsc !== false ? runTsc(resolved, true) : Promise.resolve(),
  ])
}

export async function build(config: InlineConfig) {
  const { resolveConfig } = await import('./config.js')
  const resolved = await resolveConfig(config)
  const { runTsc, buildJs, bundleDts } = await import('./build.js')

  if (resolved.tsc !== false) await runTsc(resolved)

  const { writeDts } = await bundleDts(resolved)
  await fs.emptyDir(resolved.outDir)

  for (let format of resolved.formats) {
    await buildJs(resolved, false, format)
  }
  await writeDts()
}

export type { UserConfig }

export function defineConfig(config: UserConfig) {
  return config
}
