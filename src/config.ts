import fs from 'fs-extra'
import path from 'path'
import {
  EsbuildTransformOptions,
  UserConfig as ViteConfig,
  LibraryFormats,
} from 'vite'
import { InlineConfig as VitestConfig } from 'vitest'
import { camelCase } from 'lodash-es'

export interface UserConfig {
  /**
   * Project root directory
   */
  root?: string
  /**
   * Path of library entry
   *
   * @default 'src/index.ts'
   */
  entry?: string
  /**
   * The name of the exposed global variable, for `umd` and `iife` formats
   *
   * @default `camelCase(pkg.name)`
   */
  name?: string
  /**
   * Output bundle formats
   *
   * @default ['es', 'cjs', 'umd']
   */
  formats?: LibraryFormats[]
  /**
   * ESBuild targets, see https://esbuild.github.io/api/#target and
   * https://esbuild.github.io/content-types/#javascript for more details.
   *
   * @default 'esnext'
   */
  target?: EsbuildTransformOptions['target']
  /**
   * Build output directory
   *
   * @default 'dist'
   */
  outDir?: string
  /**
   * tsconfig.json overrides
   */
  tsconfig?: Record<string, any>
  /**
   * Whether to run `tsc` to generate the typescript definition file.
   *
   * @default true
   */
  tsc?: boolean
  /**
   * Vite Config Overrides
   */
  vite?: ViteConfig | ((env: { format: LibraryFormats }) => ViteConfig)
  /**
   * Vitest config
   */
  test?: VitestConfig
}

export interface InlineConfig extends UserConfig {}

export interface ResolvedConfig extends Required<UserConfig> {
  packageJson: any // TODO:
}

export async function readConfig() {
  const { loadConfig } = await import('c12')
  return await loadConfig<InlineConfig>({ name: 'tsdv', rcFile: false })
}

export async function resolveConfig(
  config: InlineConfig
): Promise<ResolvedConfig> {
  const root = config.root ?? process.cwd()
  const packageJson = await fs.readJson(path.resolve(root, 'package.json'))

  return {
    root,
    entry: config.entry ?? 'src/index.ts',
    name: config.name ?? camelCase(packageJson.name),
    formats: config.formats ?? ['es', 'cjs', 'umd'],
    target: config.target ?? 'esnext',
    tsconfig: {},
    tsc: config.tsc ?? true,
    vite: config.vite ?? {},
    outDir: config.outDir ?? 'dist',
    test: config.test ?? {},

    // extra fields
    packageJson,
  }
}
