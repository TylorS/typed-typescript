import { register as registerTsPaths } from 'tsconfig-paths'
import { CompilerOptions } from 'typescript'
import { transpileNode } from './transpileNode'

export type TypeScriptSupportOptions = {
  cwd: string
  compilerOptions: CompilerOptions
}

/**
 * Very side-effectful
 */
export function installTypeScriptSupport({ cwd, compilerOptions }: TypeScriptSupportOptions): void {
  const { baseUrl, paths } = compilerOptions

  if (baseUrl && paths) {
    registerTsPaths({
      baseUrl,
      paths,
    })
  }

  transpileNode(cwd, compilerOptions)
}
