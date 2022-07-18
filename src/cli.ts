import { cac } from 'cac'
import { watch, build, test } from './index.js'
import { readConfig } from './config.js'

const cli = cac('tsdv').help()

cli.command('watch').action(async () => {
  const { config } = await readConfig()
  await watch(config ?? {})
})

cli.command('build').action(async () => {
  const { config } = await readConfig()
  await build(config ?? {})
})

cli.command('test').action(async () => {
  const { config = {} } = await readConfig()
  await test(config ?? {})
})

cli.parse()
