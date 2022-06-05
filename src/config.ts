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

export interface ResolvedConfig extends Required<UserConfig> {
  root: string
  packageJson: any // TODO:
}

export function defineConfig(config: UserConfig) {
  return config
}

export async function readConfig() {
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
  const fileName = config.fileName ?? path.basename(entry, path.extname(entry))

  return {
    ...config,
    entry,
    name: config.name ?? camelCase(packageJson.name),
    fileName,
    formats: config.formats ?? ['es', 'cjs', 'umd'],
    target: config.target ?? 'esnext',
    tsc: config.tsc ?? true,
    plugins: config.plugins ?? [],

    sourcemap: config.sourcemap ?? false,
    minify: config.minify ?? 'esbuild',
    outDir: config.outDir ?? 'dist',

    // extra fields
    root: path.dirname(filePath),
    packageJson,
  }
}
