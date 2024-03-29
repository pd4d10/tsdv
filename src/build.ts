import type { IConfigFile } from '@microsoft/api-extractor'
import nodeBuiltinModules from 'builtin-modules/static.js'
import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import {
  build as viteBuild,
  LibraryFormats,
  mergeConfig,
  UserConfig as ViteConfig,
} from 'vite'
import { ResolvedConfig } from './config.js'
import { getViteConfig, prepareApiExtractor, resolveTempFile } from './utils.js'

export async function buildJs(
  config: ResolvedConfig,
  watch = false,
  format: LibraryFormats
) {
  const legacy = format === 'umd' || format === 'iife'

  const externalDeps = [...nodeBuiltinModules]

  if (legacy) {
    externalDeps.push(
      ...Object.keys({ ...config.packageJson.peerDependencies })
    )
  } else if (format === 'es') {
    externalDeps.push(
      ...Object.keys({
        ...config.packageJson.peerDependencies,
        ...config.packageJson.dependencies,
      })
    )
  } else if (format === 'cjs') {
    const deps = Object.keys({ ...config.packageJson.dependencies })
      // exclude esm packages, bundle them to make it work for cjs
      .filter((dep) => {
        const pkgPath = path.resolve(
          config.root,
          'node_modules',
          dep,
          'package.json'
        )

        if (!fs.existsSync(pkgPath)) {
          throw new Error(`${dep} not exists, please install it`)
        }

        const { type: pkgType } = fs.readJsonSync(pkgPath)
        return pkgType !== 'module'
      })

    externalDeps.push(
      ...Object.keys({ ...config.packageJson.peerDependencies }),
      ...deps
    )
  }

  // console.log(type, externalDeps)

  const viteConfig: ViteConfig = {
    root: config.root,
    // logLevel: 'silent',
    clearScreen: false,
    build: {
      minify: legacy,
      outDir: config.outDir,
      emptyOutDir: false,
      // reportCompressedSize: false,
      target: config.target,
      watch: watch ? {} : null,
      lib: {
        entry: config.entry,
        name: config.name,
        formats: [format],
        fileName: path.basename(config.entry, path.extname(config.entry)),
      },
      rollupOptions: {
        external: [
          ...externalDeps,
          ...externalDeps.map((dep) => new RegExp(`^${dep}\/`)),
        ],
      },
    },
  }

  await viteBuild(
    mergeConfig(viteConfig, getViteConfig(config.vite, { format }))
  )
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

  const deps = Object.keys({
    ...config.packageJson.peerDependencies,
    ...config.packageJson.dependencies,
  })

  // also add types for peer dependencies, for example:
  // add @types/react as external for react
  const typeDeps = deps.flatMap((dep) => {
    return dep.startsWith('@') ? [] : ['@types/' + dep]
  })

  const entry = config.entry
    .replace('src', config.outDir)
    .replace('.ts', '.d.ts')
  const messageLevel: any = {
    default: { logLevel: 'none' },
  }

  const outFile = await resolveTempFile(config, entry)

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
    bundledPackages: [...deps, ...typeDeps],
    messages: {
      compilerMessageReporting: messageLevel,
      extractorMessageReporting: messageLevel,
      tsdocMessageReporting: messageLevel,
    },
    enumMemberOrder: 'by-name' as any,
  }
  const aeConfigFile = await resolveTempFile(config, 'api-extractor.json')
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
