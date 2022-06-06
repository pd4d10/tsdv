import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { watch, build, test } from './index.js'
import { readConfig } from './config.js'

yargs(hideBin(process.argv))
  .command(
    'watch',
    '',
    () => {},
    async () => {
      const { default: config } = await readConfig()
      watch(config)
    }
  )

  .command(
    'build',
    '',
    () => {},
    async () => {
      const { default: config } = await readConfig()
      build(config)
    }
  )

  .command(
    'test',
    '',
    () => {},
    async () => {
      const { default: config } = await readConfig()
      test(config)
    }
  )

  .version()
  .help()
  .parse()
