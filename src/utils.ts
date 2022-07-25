import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { LibraryFormats } from 'vite'
import { ResolvedConfig, UserConfig } from './config.js'

export async function prepareApiExtractor() {
  const { default: ts } = await import('typescript')
  const ae = await import('@microsoft/api-extractor')
  const { ExportAnalyzer } = await import(
    '@microsoft/api-extractor/lib/analyzer/ExportAnalyzer.js'
  )
  const { TypeScriptInternals } = await import(
    '@microsoft/api-extractor/lib/analyzer/TypeScriptInternals.js'
  )

  // TODO: https://github.com/microsoft/rushstack/pull/3339
  // HACK: turn bundledPackages to externalPackages
  // @ts-ignore
  ExportAnalyzer.prototype._isExternalModulePath =
    function _isExternalModulePath(
      // @ts-ignore
      importOrExportDeclaration,
      moduleSpecifier: string
    ) {
      const specifier = ts.isImportTypeNode(importOrExportDeclaration)
        ? importOrExportDeclaration.argument
        : importOrExportDeclaration.moduleSpecifier
      const mode =
        specifier && ts.isStringLiteralLike(specifier)
          ? TypeScriptInternals.getModeForUsageLocation(
              importOrExportDeclaration.getSourceFile(),
              // @ts-ignore
              specifier
            )
          : undefined

      const resolvedModule = TypeScriptInternals.getResolvedModule(
        importOrExportDeclaration.getSourceFile(),
        moduleSpecifier,
        mode
      )

      if (resolvedModule === undefined) {
        return true
      }

      const packageName: string | undefined = resolvedModule.packageId?.name

      // @ts-ignore
      // console.log(packageName, this._bundledPackageNames)

      // CHANGE BELOW
      // @ts-ignore
      return packageName != null && this._bundledPackageNames.has(packageName)
    }

  return ae
}

// write to a temp dir, then copy to `outDir`
export async function resolveTempFile(
  config: ResolvedConfig,
  ...paths: string[]
) {
  const file = path.resolve(
    os.tmpdir(),
    'tsdv',
    config.packageJson.name,
    ...paths
  )
  await fs.ensureDir(path.dirname(file))
  return file
}

export function getViteConfig(
  config: UserConfig['vite'],
  env: { format: LibraryFormats }
) {
  if (typeof config === 'function') return config(env)
  return config ?? {}
}
