import { cac } from 'cac'
import { readConfig } from './config.js'
import { build, sync, test, watch } from './index.js'

const cli = cac('tsdv').help()

cli.command('sync').action(async () => {
  const { config } = await readConfig()
  await sync(config ?? {})
})

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
