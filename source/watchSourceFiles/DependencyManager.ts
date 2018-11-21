import { LanguageService, Program, SourceFile } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { findDependenciesFromSourceFile } from '../findDependenciesFromSourceFile'
import { flattenDependencies } from '../flattenDependencies'
import { Dependency } from '../types'

export interface DependencyManager {
  readonly getDependenciesOf: (filePath: string) => Dependency[]
  readonly getDependentsOf: (filePath: string) => string[]
  readonly isDependentOf: (possibleDependent: string, filePath: string) => boolean
  readonly addFile: (filePath: string) => void
  readonly updateFile: (filePath: string) => void
  readonly unlinkFile: (fileP: string) => void
}

export interface CreateDependencyManagerOptions {
  directory: string
  languageService: LanguageService
}

export function createDependencyManager({
  directory,
  languageService,
}: CreateDependencyManagerOptions): DependencyManager {
  const dependencyMap: Record<string, Dependency[]> = {}
  const dependentMap: Record<string, string[]> = {}
  const getPath = (path: string) => makeAbsolute(directory, path)

  function addFile(file: string): void {
    const path = getPath(file)
    const program = languageService.getProgram() as Program
    const sourceFile = program.getSourceFile(path) as SourceFile
    const dependencies = flattenDependencies(findDependenciesFromSourceFile(sourceFile, program))

    dependencyMap[path] = dependencies

    for (const dependency of dependencies) {
      const dependencyPath = dependency.path
      if (!dependentMap[dependencyPath]) {
        dependentMap[dependencyPath] = []
      }

      if (!dependentMap[dependencyPath].includes(path)) {
        dependentMap[dependencyPath].push(path)
      }
    }
  }

  function unlinkFile(file: string) {
    const filePath = getPath(file)

    if (dependencyMap[filePath]) {
      delete dependencyMap[filePath]
    }

    if (dependentMap[filePath]) {
      delete dependentMap[filePath]
    }
  }

  function isDependentOf(dependency: string, file: string) {
    const filePath = getPath(file)
    const dependencyPath = getPath(dependency)

    return (
      dependencyMap[filePath] &&
      dependencyMap[filePath].findIndex(x => x.path === dependencyPath) > -1
    )
  }

  function getDependenciesOf(file: string) {
    return dependencyMap[getPath(file)] || []
  }

  function getDependentsOf(file: string) {
    return dependentMap[getPath(file)] || []
  }

  return {
    addFile,
    updateFile: addFile,
    unlinkFile,
    isDependentOf,
    getDependenciesOf,
    getDependentsOf,
  }
}
