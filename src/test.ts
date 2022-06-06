import { ResolvedConfig } from './config.js'

export async function runTest(config: ResolvedConfig) {
  const { startVitest } = await import('vitest/node')

  // @ts-ignore
  await startVitest([], config.test, {
    root: config.root,
    // @ts-ignore
    plugins: config.plugins,
  })
}
