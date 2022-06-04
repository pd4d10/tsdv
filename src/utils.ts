import { ResolvedConfig } from './config.js'

export function readExternalDeps(pkg: ResolvedConfig['packageJson']) {
  const deps = Object.keys(pkg.dependencies ?? {})
  const peerDeps = Object.keys(pkg.peerDependencies ?? {})

  // also add types for peer dependencies, for example:
  // add @types/react as external for react
  const typePrefix = '@types/'
  const peerTypeDeps = peerDeps.flatMap((dep) => {
    return dep.startsWith(typePrefix) ? [] : [typePrefix + dep]
  })

  // console.log('deps', peerTypeDeps)
  const allDeps = [...deps, ...peerDeps, ...peerTypeDeps]
  return allDeps
}

export async function prepareApiExtractor() {
  const ts = await import('typescript')
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
      console.log(packageName, this._bundledPackageNames)

      // CHANGE BELOW
      // @ts-ignore
      return packageName != null && this._bundledPackageNames.has(packageName)
    }

  return ae
}
