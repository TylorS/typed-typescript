import { CompilerOptions } from 'typescript'
import { registerTsPaths } from './registerTsPaths'
import { transpileNode } from './transpileNode'

export type TypeScriptSupportOptions = {
  cwd: string
  compilerOptions: CompilerOptions
}

/**
 * Very side-effectful
 */
export function installTypeScriptSupport({
  cwd,
  compilerOptions,
}: TypeScriptSupportOptions): () => void {
  const { baseUrl, paths } = compilerOptions

  const tsPathDispose =
    baseUrl && paths
      ? registerTsPaths({
          baseUrl,
          paths,
        })
      : () => void 0

  const tranpilationDispose = transpileNode(cwd, compilerOptions)

  return () => {
    tsPathDispose()
    tranpilationDispose()
  }
}
