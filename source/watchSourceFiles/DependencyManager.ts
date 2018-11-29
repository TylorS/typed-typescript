import { chain, uniq } from '@typed/list'
import { CompilerOptions } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { findDependenciesFromFile } from '../findDependenciesFromFile'
import { flattenDependencies } from '../flattenDependencies'
import { Dependency } from '../types'
import { FileVersionManager } from './FileVersionManager'

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
  compilerOptions: CompilerOptions
  fileVersionManager: FileVersionManager
}

export function createDependencyManager({
  directory,
  compilerOptions,
  fileVersionManager,
}: CreateDependencyManagerOptions): DependencyManager {
  const dependencyMap: Record<string, Dependency[]> = {}
  const dependentMap: Record<string, string[]> = {}
  const dependentVersionMap: Record<string, number> = {}
  const dependentOf: Record<string, string[]> = {}
  const getPath = (path: string) => makeAbsolute(directory, path)

  function addFile(file: string): void {
    const path = getPath(file)
    const dependencies = flattenDependencies(findDependenciesFromFile(path, compilerOptions))

    dependencyMap[path] = dependencies

    for (const dependency of dependencies) {
      const dependencyPath = dependency.path
      if (!dependentMap[dependencyPath]) {
        dependentMap[dependencyPath] = []
      }

      if (!dependentMap[dependencyPath].includes(path) && path !== dependencyPath) {
        dependentMap[dependencyPath].push(path)
      }
    }
  }

  function updateFile(file: string) {
    fileVersionManager.updateFile(file)
    addFile(file)
  }

  function unlinkFile(file: string) {
    const filePath = getPath(file)

    getDependentsOf(filePath).forEach(updateFile)

    fileVersionManager.unlinkFile(filePath)

    if (dependencyMap[filePath]) {
      delete dependencyMap[filePath]
    }

    if (dependentMap[filePath]) {
      delete dependentMap[filePath]
    }

    if (dependentOf[filePath]) {
      delete dependentOf[filePath]
    }

    if (dependentVersionMap[filePath]) {
      delete dependentVersionMap[filePath]
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

  function getDependentsOf(file: string): string[] {
    const filePath = getPath(file)
    const fileVersion = fileVersionManager.versionOf(filePath)
    const dependentVersion = dependentVersionMap[filePath]

    if (fileVersion === dependentVersion) {
      return dependentOf[filePath]
    }

    const dependents = dependentMap[filePath] || []
    const filesToProcess = chain(x => dependentMap[x], dependents)

    while (filesToProcess.length > 0) {
      const path = getPath(filesToProcess.shift() as string)
      const pathVersion = fileVersionManager.versionOf(path)
      const pathDependentVersion = dependentVersionMap[filePath]

      if (pathVersion === pathDependentVersion && dependentOf[path]) {
        dependents.push(path, ...dependentOf[path])
        continue
      }

      dependents.push(path)

      const subdependants = dependentMap[path]

      if (subdependants) {
        filesToProcess.push(...subdependants)
      }
    }

    const dependentsOfFile = uniq(dependents)

    dependentVersionMap[filePath] = fileVersion
    dependentOf[filePath] = dependentsOfFile

    return dependentsOfFile
  }

  return {
    addFile: (file: string) => {
      fileVersionManager.addFile(file)
      addFile(file)
    },
    updateFile,
    unlinkFile,
    isDependentOf,
    getDependenciesOf,
    getDependentsOf,
  }
}
