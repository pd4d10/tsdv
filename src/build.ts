import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { build as viteBuild } from 'vite'
import { execa } from 'execa'
import { ResolvedConfig } from './config.js'
import { prepareApiExtractor, readExternalDeps } from './utils.js'
import { IConfigFile } from '@microsoft/api-extractor'

export async function buildJs(config: ResolvedConfig, watch = false) {
  const externalDeps = readExternalDeps(config.packageJson)

  await viteBuild({
    root: config.root,
    // logLevel: 'silent',
    clearScreen: false,
    build: {
      emptyOutDir: false,
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

export async function buildDts(config: ResolvedConfig, watch = false) {
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
  const { Extractor, ExtractorConfig, ExtractorLogLevel } =
    await prepareApiExtractor()

  const externalDeps = readExternalDeps(config.packageJson)
  const entry = (config.entry ?? 'src/index.ts')
    .replace('src', 'dist/types')
    .replace('.ts', '.d.ts') // TODO:
  const typeOut = path.resolve(os.tmpdir(), 'out.d.ts')

  const aeConfig: IConfigFile = {
    mainEntryPointFilePath: path.resolve(config.root, entry),
    projectFolder: config.root,
    apiReport: { enabled: false },
    docModel: { enabled: false },
    tsdocMetadata: { enabled: false },
    dtsRollup: {
      enabled: true,
      untrimmedFilePath: typeOut,
    },
    bundledPackages: externalDeps,
    messages: {
      compilerMessageReporting: {
        default: { logLevel: ExtractorLogLevel.None },
      },
      extractorMessageReporting: {
        default: { logLevel: ExtractorLogLevel.None },
      },
      tsdocMessageReporting: {
        default: { logLevel: ExtractorLogLevel.None },
      },
    },
  }
  const aeConfigFile = path.resolve(os.tmpdir(), 'api-extractor.json')
  await fs.writeJson(aeConfigFile, aeConfig)

  const configObject = ExtractorConfig.loadFile(aeConfigFile)
  const extractorConfig = ExtractorConfig.prepare({
    configObject,
    configObjectFullPath: aeConfigFile,
    packageJsonFullPath: path.resolve(config.root, 'package.json'),
  })
  Extractor.invoke(extractorConfig)
}
