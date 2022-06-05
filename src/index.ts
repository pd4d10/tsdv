import { runTsc, buildJs, bundleDts } from './build.js'
import { InlineConfig, resolveConfig } from './config.js'

export async function watch(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  await Promise.all([
    buildJs(resolved, true),
    resolved.tsc !== false ? runTsc(resolved, true) : Promise.resolve(),
  ])
}

export async function build(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  if (resolved.tsc !== false) await runTsc(resolved)
  const { writeDts } = await bundleDts(resolved)
  await buildJs(resolved)
  await writeDts()
}

export type { UserConfig } from './config.js'
export { defineConfig } from './config.js'
