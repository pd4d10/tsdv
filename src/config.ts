import fs from 'fs-extra'
import path from 'path'
import { findUp } from 'find-up'
import {
  BuildOptions,
  EsbuildTransformOptions,
  LibraryOptions,
  PluginOption,
} from 'vite'
import {} from 'vitest'
import { camelCase } from 'lodash-es'
import { SetRequired } from 'type-fest'

export interface UserConfig
  extends Pick<BuildOptions, 'sourcemap' | 'minify' | 'outDir'> {
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
   * The name of the package file output. The default file base names are
   * the same as entry file.
   */
  fileName?: string
  /**
   * Output bundle formats
   *
   * @default ['es', 'cjs', 'umd']
   */
  formats?: LibraryOptions['formats']
  /**
   * ESBuild targets, see https://esbuild.github.io/api/#target and
   * https://esbuild.github.io/content-types/#javascript for more details.
   *
   * @default 'esnext'
   */
  target?: EsbuildTransformOptions['target']
  /**
   * Whether to run `tsc` to generate the typescript definition file.
   *
   * @default true
   */
  tsc?: boolean
  /**
   * Vite plugins
   */
  plugins?: PluginOption[]
}

export interface InlineConfig extends UserConfig {}

export interface ResolvedConfig
  extends SetRequired<
    UserConfig,
    'entry' | 'name' | 'fileName' | 'formats' | 'target' | 'outDir'
  > {
  root: string
  packageJson: any // TODO:
}

export function defineConfig(config: UserConfig) {
  return config
}

export async function readConfig(): Promise<UserConfig> {
  const file = await findUp('tsdv.config.mjs')
  if (!file) return {}

  return import(file)
}

export async function resolveConfig(
  config: InlineConfig
): Promise<ResolvedConfig> {
  const filePath = await findUp('package.json')
  if (!filePath) throw new Error('package.json not found')

  const packageJson = await fs.readJson(filePath)

  const entry = config.entry ?? 'src/index.ts'
  const name = config.name ?? camelCase(packageJson.name)
  const fileName = config.fileName ?? path.basename(entry, path.extname(entry))
  const formats = config.formats ?? ['es', 'cjs', 'umd']
  const target = config.target ?? 'esnext'
  const outDir = config.outDir ?? 'dist'

  return {
    ...config,
    entry,
    name,
    fileName,
    formats,
    target,
    outDir,
    plugins: config.plugins,
    root: path.dirname(filePath),
    packageJson,
  }
}
