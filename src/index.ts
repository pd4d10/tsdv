import { buildDts, buildJs, bundleDts } from './build.js'
import { InlineConfig, resolveConfig } from './config.js'

export async function watch(config: InlineConfig) {
  const resolved = await resolveConfig(config)
  await Promise.all([buildJs(resolved, true), buildDts(resolved, true)])
}

export async function build(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  await buildJs(resolved)
  await buildDts(resolved)
  await bundleDts(resolved)
}

export { UserConfig, defineConfig } from './config.js'
