import { register } from 'tsconfig-paths'
import { CompilerOptions } from 'typescript'
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
      ? register({
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
