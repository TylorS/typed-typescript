import { createProgram, Path, SourceFile } from 'typescript'
import { findTsConfig } from '../source/findTsConfig'

export function setupFixtureTestEnvironment(directory: string, fixtureFilePath: string) {
  const tsConfig = findTsConfig({ directory })
  const program = createProgram({
    rootNames: [fixtureFilePath],
    options: tsConfig.compilerOptions,
  })
  const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile

  return { tsConfig, program, sourceFile, typeChecker: program.getTypeChecker() }
}
