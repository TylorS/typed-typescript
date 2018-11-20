import { LanguageService, Program, SourceFile } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { findDependenciesFromSourceFile } from '../findDependenciesFromSourceFile'
import { flattenDependencies } from '../flattenDependencies'

export interface DependencyManager {
  readonly getDependenciesOf: (filePath: string) => string[]
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
  const dependencyMap: Record<string, string[]> = {}
  const dependentMap: Record<string, string[]> = {}
  const getPath = (path: string) => makeAbsolute(directory, path)
  let program = languageService.getProgram() as Program

  function addFile(file: string): void {
    const path = getPath(file)
    program = languageService.getProgram() as Program
    const sourceFile = program.getSourceFile(path) as SourceFile

    const dependencies = flattenDependencies(findDependenciesFromSourceFile(sourceFile, program))
      .filter(x => x.type === 'local')
      .map(x => x.path)

    dependencyMap[path] = dependencies

    for (const dependency of dependencies) {
      if (!dependentMap[dependency]) {
        dependentMap[dependency] = [path]
      } else {
        dependentMap[dependency].push(path)
      }
    }
  }

  function unlinkFile(file: string) {
    const filePath = getPath(file)
    if (dependencyMap[filePath]) {
      delete dependencyMap[getPath(file)]
    }
  }

  function isDependentOf(dependency: string, file: string) {
    const filePath = getPath(file)

    return dependencyMap[filePath] && dependencyMap[getPath(file)].includes(getPath(dependency))
  }

  function getDependenciesOf(file: string) {
    return dependencyMap[getPath(file)] || []
  }

  function getDependentsOf(file: string) {
    const path = getPath(file)

    return dependentMap[path] || []
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
