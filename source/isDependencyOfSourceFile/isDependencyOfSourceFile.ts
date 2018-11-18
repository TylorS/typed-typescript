import { curry3 } from '@typed/functions'
import { Program, SourceFile } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { findDependenciesFromSourceFile } from '../findDependenciesFromSourceFile'
import { DependencyTree } from '../types'

export const isDependencyOfSourceFile: {
  (program: Program, sourceFile: SourceFile, filePath: string): boolean
  (program: Program, sourceFile: SourceFile): (filePath: string) => boolean
  (program: Program): {
    (sourceFile: SourceFile, filePath: string): boolean
    (sourceFile: SourceFile): (filePath: string) => boolean
  }
} = curry3(__isDependencyOfSourceFile)

const dependencyMap = new WeakMap<SourceFile, string[]>()

function __isDependencyOfSourceFile(
  program: Program,
  sourceFile: SourceFile,
  filePath: string,
): boolean {
  const currentDirectory = program.getCurrentDirectory()
  const dependencies =
    dependencyMap.get(sourceFile) ||
    flattenDependencies(findDependenciesFromSourceFile(sourceFile, program))

  return dependencies.includes(makeAbsolute(currentDirectory, filePath))
}

function flattenDependencies({ filePath, dependencies }: DependencyTree): string[] {
  const names: string[] = [filePath]

  for (const dependency of dependencies) {
    names.push(...flattenDependencies(dependency))
  }

  return names
}
