import { CompilerOptions } from 'typescript'

export function getFileExtensions(compilerOptions: CompilerOptions): string[] {
  const { allowJs = false, resolveJsonModule = false, jsx } = compilerOptions

  return [
    '.ts',
    jsx ? '.tsx' : null,
    allowJs ? '.js' : null,
    jsx && allowJs ? '.jsx' : null,
    resolveJsonModule ? '.json' : null,
  ].filter(x => x !== null) as string[]
}
