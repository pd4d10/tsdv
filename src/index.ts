import fs from 'fs-extra'
import { InlineConfig, UserConfig } from './config.js'

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

export async function test(config: InlineConfig) {
  const { resolveConfig } = await import('./config.js')
  const resolved = await resolveConfig(config)

  const { runTest } = await import('./test.js')
  await runTest(resolved)
}

export type { UserConfig }

export function defineConfig(config: UserConfig) {
  return config
}
