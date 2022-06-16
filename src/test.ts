import { ResolvedConfig } from './config.js'

export async function runTest(config: ResolvedConfig) {
  const { startVitest } = await import('vitest/node')
  const { mergeConfig } = await import('vite')

  await startVitest(
    [],
    // @ts-ignore
    config.test,
    mergeConfig({ root: config.root }, config.vite)
  )
}
