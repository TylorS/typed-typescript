import { Dependency, DependencyTree } from './types'

export function flattenDependencies(tree: DependencyTree): Dependency[] {
  return resolveDependencyOrder(treeToMap(tree), tree)
}

function treeToMap(dependencyTree: DependencyTree): DepMap {
  const map: DepMap = new Map()
  const depsToProcess = [dependencyTree]

  while (depsToProcess.length > 0) {
    const tree = depsToProcess.shift() as DependencyTree
    const list = map.get(tree) || []

    for (const dependency of tree.dependencies) {
      depsToProcess.push(dependency)
      list.push(dependency)
    }

    map.set(tree, list)
  }

  return map
}

type DepMap = Map<DependencyTree, DependencyTree[]>

function resolveDependencyOrder(depMap: DepMap, dependency: DependencyTree): Dependency[] {
  const result: Dependency[] = []

  resolveSpecific(depMap, result, dependency, [dependency.path])

  return result
}

function resolveSpecific(
  depMap: DepMap,
  result: Dependency[],
  dependency: DependencyTree,
  filesProcessed: string[],
) {
  const path = dependency.path
  if (filesProcessed.indexOf(path) !== filesProcessed.lastIndexOf(path)) {
    throw new Error('Circular dependency found: ' + filesProcessed.join(' > '))
  }

  const deps = depMap.get(dependency)

  if (deps) {
    deps.forEach((dep: DependencyTree) =>
      resolveSpecific(depMap, result, dep, filesProcessed.concat(dep.path)),
    )
  }

  const index = result.findIndex(x => x.path === path)

  if (index === -1) {
    result.push(dependency)
    depMap.delete(dependency)
  }

  return result
}
