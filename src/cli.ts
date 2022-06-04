import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { watch, build } from './index.js'
import { readConfig } from './config.js'

yargs(hideBin(process.argv))
  .command(
    'watch',
    '',
    () => {},
    async () => {
      const config = await readConfig()
      watch(config)
    }
  )

  .command(
    'build',
    '',
    () => {},
    async () => {
      const config = await readConfig()
      build(config)
    }
  )

  .version()
  .help()
  .parse()
