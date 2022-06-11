import fs from 'fs-extra'
import { runTsc, buildJs, bundleDts } from './build.js'
import { InlineConfig, resolveConfig } from './config.js'
import { runTest } from './test.js'

export async function watch(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  await fs.emptyDir(resolved.outDir)
  await Promise.all([
    buildJs(resolved, true, 'es'),
    buildJs(resolved, true, 'cjs'),
    buildJs(resolved, true, 'umd'),
    resolved.tsc !== false ? runTsc(resolved, true) : Promise.resolve(),
  ])
}

export async function build(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  if (resolved.tsc !== false) await runTsc(resolved)
  const { writeDts } = await bundleDts(resolved)
  await fs.emptyDir(resolved.outDir)

  for (let format of resolved.formats) {
    await buildJs(resolved, false, format)
  }

  await writeDts()
}

export async function test(config: InlineConfig) {
  const resolved = await resolveConfig(config)

  await runTest(resolved)
}

export type { UserConfig } from './config.js'
export { defineConfig } from './config.js'
