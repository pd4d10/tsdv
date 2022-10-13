import { ResolvedConfig } from './config.js'
import { getViteConfig } from './utils.js'

export async function runTest(config: ResolvedConfig) {
  const { startVitest } = await import('vitest/node')
  const { mergeConfig } = await import('vite')

  await startVitest(
    'test',
    [],
    // @ts-ignore
    config.test,
    mergeConfig(
      { root: config.root },
      getViteConfig(config.vite, { format: 'iife' })
    )
  )
}
