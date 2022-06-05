import fs from 'fs-extra'
import path from 'path'
import { build as viteBuild } from 'vite'
import { execa } from 'execa'
import { ResolvedConfig } from './config.js'
import {
  resolveTempFile,
  prepareApiExtractor,
  readExternalDeps,
} from './utils.js'
import type { IConfigFile } from '@microsoft/api-extractor'

export async function buildJs(config: ResolvedConfig, watch = false) {
  const externalDeps = readExternalDeps(config.packageJson)

  await viteBuild({
    root: config.root,
    // logLevel: 'silent',
    clearScreen: false,
    build: {
      outDir: config.outDir,
      emptyOutDir: !watch,
      target: config.target,
      minify: config.minify,
      sourcemap: config.sourcemap,
      watch: watch ? {} : null,
      lib: {
        entry: config.entry,
        name: config.name,
        formats: config.formats,
        fileName: config.fileName,
      },
      rollupOptions: {
        external: [
          ...externalDeps,
          ...externalDeps.map((dep) => new RegExp(`^${dep}\/`)),
        ],
      },
    },
  })
}

export async function runTsc(config: ResolvedConfig, watch = false) {
  await execa(
    'tsc',
    [
      ...(watch ? ['--watch', '--preserveWatchOutput'] : []),
      '--outDir',
      config.outDir,
      '--rootDir',
      'src',
      '--declaration',
      '--emitDeclarationOnly',
    ],
    {
      stdio: 'inherit',
      cwd: config.root,
    }
  )
}

export async function bundleDts(config: ResolvedConfig) {
  const { Extractor, ExtractorConfig } = await prepareApiExtractor()

  const externalDeps = readExternalDeps(config.packageJson)
  const entry = config.entry
    .replace('src', config.outDir)
    .replace('.ts', '.d.ts')
  const messageLevel: any = {
    default: { logLevel: 'none' },
  }

  const outFile = resolveTempFile(config, entry)

  const aeConfig: IConfigFile = {
    mainEntryPointFilePath: path.resolve(config.root, entry),
    projectFolder: config.root,
    apiReport: { enabled: false },
    docModel: { enabled: false },
    tsdocMetadata: { enabled: false },
    dtsRollup: {
      enabled: true,
      untrimmedFilePath: outFile,
    },
    bundledPackages: externalDeps,
    messages: {
      compilerMessageReporting: messageLevel,
      extractorMessageReporting: messageLevel,
      tsdocMessageReporting: messageLevel,
    },
  }
  const aeConfigFile = resolveTempFile(config, 'api-extractor.json')
  await fs.writeJson(aeConfigFile, aeConfig)

  const configObject = ExtractorConfig.loadFile(aeConfigFile)
  const extractorConfig = ExtractorConfig.prepare({
    configObject,
    configObjectFullPath: aeConfigFile,
    packageJsonFullPath: path.resolve(config.root, 'package.json'),
  })
  Extractor.invoke(extractorConfig)

  return {
    async writeDts() {
      await fs.copy(
        outFile,
        path.resolve(config.root, config.outDir, path.basename(outFile))
      )
    },
  }
}
