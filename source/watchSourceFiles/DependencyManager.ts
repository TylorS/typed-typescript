import { CompilerOptions, MapLike } from 'typescript'
import { makeAbsolute } from '../common/makeAbsolute'
import { findDependenciesFromFile } from '../findDependenciesFromFile'
import { createDependencyCache } from '../findDependenciesFromFile/DependencyCache'
import { dependencyCacheTreeToDependencyTree } from '../findDependenciesFromFile/dependencyCacheTreeToDependencyTree'
import { flattenDependencies } from '../flattenDependencies'
import { Dependency } from '../types'

export interface DependencyManager {
  readonly getDependenciesOf: (filePath: string) => Dependency[]
  readonly getDependentsOf: (filePath: string) => Dependency[]
  readonly isDependentOf: (possibleDependent: string, filePath: string) => boolean
  readonly addFile: (filePath: string) => void
  readonly updateFile: (filePath: string) => void
  readonly unlinkFile: (filePath: string) => void
}

export interface CreateDependencyManagerOptions {
  directory: string
  compilerOptions: CompilerOptions
  fileVersions: MapLike<{ version: number }>
}

export function createDependencyManager({
  directory,
  compilerOptions,
  fileVersions,
}: CreateDependencyManagerOptions): DependencyManager {
  const dependencyCache = createDependencyCache(fileVersions)
  const getPath = (path: string) => makeAbsolute(directory, path)
  const getDependencies = (file: string) =>
    findDependenciesFromFile(getPath(file), dependencyCache, compilerOptions)

  function unlinkFile(file: string) {
    const filePath = getPath(file)

    getDependentsOf(filePath).forEach(({ path }) => getDependencies(path))
    dependencyCache.removeFile(filePath)
  }

  function isDependentOf(dependency: string, file: string) {
    const filePath = getPath(file)
    const dependencyPath = getPath(dependency)

    return getDependenciesOf(filePath).findIndex(({ path }) => path === dependencyPath) > -1
  }

  function getDependenciesOf(file: string) {
    const filePath = getPath(file)
    const tree = dependencyCache.dependencyTree

    if (!tree[filePath]) {
      return []
    }

    return flattenDependencies(dependencyCacheTreeToDependencyTree(filePath, tree))
  }

  function getDependentsOf(file: string) {
    const filePath = getPath(file)
    const tree = dependencyCache.dependentTree

    if (!tree[filePath]) {
      return []
    }

    return flattenDependencies(dependencyCacheTreeToDependencyTree(filePath, tree))
  }

  return {
    addFile: getDependencies,
    updateFile: getDependencies,
    unlinkFile,
    isDependentOf,
    getDependenciesOf,
    getDependentsOf,
  }
}
