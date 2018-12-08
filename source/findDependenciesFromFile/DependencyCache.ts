import { MapLike } from 'typescript'

export interface DependencyCache {
  dependencyTree: DependencyCacheTree
  dependentTree: DependencyCacheTree
  addDependencyOf(file: string, dependency: string): void
  removeFile(file: string): void
  getDependenciesOf(file: string): DependencyCacheTree
  getDependentsOf(file: string): DependencyCacheTree
  has(file: string): boolean
}

export interface DependencyCacheTree {
  [key: string]: DependencyCacheTree | undefined
}

export function createDependencyCache(fileVersions: MapLike<{ version: number }>): DependencyCache {
  const dependencyTree: DependencyCacheTree = {}
  const dependentTree: DependencyCacheTree = {}
  const dependencyVersions: MapLike<{ version: number }> = {}

  function has(filePath: string) {
    const { version: dependencyVersion } = dependencyVersions[filePath] || { version: 0 }
    const { version: fileVersion } = fileVersions[filePath] || { version: 0 }

    return dependencyVersion !== 0 && dependencyVersion >= fileVersion
  }

  function addIfNotHas(filePath: string, tree: DependencyCacheTree) {
    if (!tree[filePath]) {
      tree[filePath] = {}
    }

    if (!dependencyVersions[filePath]) {
      dependencyVersions[filePath] = { version: 0 }
    }
  }

  function addToTree(parent: string, child: string, tree: DependencyCacheTree) {
    addIfNotHas(parent, tree)
    addIfNotHas(child, tree)
    ;(tree[parent] as DependencyCacheTree)[child] = tree[child]

    const { version: parentVersion } = fileVersions[parent] || { version: 1 }
    const { version: childVersion } = fileVersions[child] || { version: 1 }

    dependencyVersions[parent].version = parentVersion
    dependencyVersions[child].version = childVersion
  }

  function addDependencyOf(filePath: string, dependencyPath: string) {
    addToTree(filePath, dependencyPath, dependencyTree)
    addToTree(dependencyPath, filePath, dependentTree)
  }

  function removeFile(file: string) {
    delete dependencyTree[file]
    delete dependentTree[file]
  }

  return {
    dependencyTree,
    dependentTree,
    addDependencyOf,
    removeFile,
    getDependenciesOf: (file: string) => ({ [file]: dependencyTree[file] }),
    getDependentsOf: (file: string) => ({ [file]: dependentTree[file] }),
    has,
  }
}
