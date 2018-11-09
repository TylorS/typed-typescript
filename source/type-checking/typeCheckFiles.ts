import { Diagnostic, Program } from 'typescript'
import { diagnosticsToString } from '../diagnosticsToString'

export function typeCheckFiles(program: Program): string {
  return diagnosticsToString(
    program
      .getSourceFiles()
      .reduce((xs, x) => xs.concat(program.getSemanticDiagnostics(x)), [] as Diagnostic[]),
    program.getCurrentDirectory(),
  )
}
