import fs from 'fs-extra'
import path from 'path'
import { findUp } from 'find-up'
import {
  BuildOptions,
  EsbuildTransformOptions,
  LibraryOptions,
  PluginOption,
} from 'vite'
import { InlineConfig as VitestConfig } from 'vitest'
import { camelCase } from 'lodash-es'

export type _Formats = 'es' | 'cjs' | 'umd'
export type Formats = _Formats | `${_Formats}.min`

export interface UserConfig extends Pick<BuildOptions, 'sourcemap' | 'outDir'> {
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
   * @default ['es', 'cjs', 'umd.min']
   */
  formats?: Formats[]
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
  /**
   * Vitest config
   */
  test?: VitestConfig
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

  return {
    ...config,
    entry,
    name: config.name ?? camelCase(packageJson.name),
    formats: config.formats ?? ['es', 'cjs', 'umd.min'],
    target: config.target ?? 'esnext',
    tsc: config.tsc ?? true,
    plugins: config.plugins ?? [],

    sourcemap: config.sourcemap ?? false,
    outDir: config.outDir ?? 'dist',

    test: config.test ?? {},

    // extra fields
    root: path.dirname(filePath),
    packageJson,
  }
}
