import { uniq } from '@typed/list'
import { DependencyMap, resolveDependencyOrder } from './resolveDependencyOrder'
import { Dependency, DependencyTree } from './types'

export function flattenDependencies(tree: DependencyTree): Dependency[] {
  return uniq(resolveDependencyOrder(treeToMap(tree), tree))
}

function treeToMap(dependencyTree: DependencyTree): DependencyMap {
  const map: DependencyMap = new Map()
  const depsToProcess = [dependencyTree]
  const pathsProcessed: string[] = []

  while (depsToProcess.length > 0) {
    const tree = depsToProcess.shift() as DependencyTree
    const path = tree.path

    if (pathsProcessed.includes(path)) {
      continue
    }

    pathsProcessed.push(path)
    const list = map.get(tree) || []

    for (const dependency of tree.dependencies) {
      depsToProcess.push(dependency)
      list.push(dependency)
    }

    map.set(tree, list)
  }

  return map
}
