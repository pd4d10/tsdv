import { emptyDir } from 'fs-extra'
import { buildDts, buildJs, bundleDts } from './build.js'
import { InlineConfig, resolveConfig } from './config.js'

export async function watch(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  await emptyDir(resolved.outDir)
  await Promise.all([buildJs(resolved, true), buildDts(resolved, true)])
}

export async function build(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  await emptyDir(resolved.outDir)
  await buildJs(resolved)
  await buildDts(resolved)
  await bundleDts(resolved)
}

export type { UserConfig } from './config.js'
export { defineConfig } from './config.js'
