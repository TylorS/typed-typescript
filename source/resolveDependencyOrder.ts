import { uniq } from '@typed/list'
import { Dependency, DependencyTree } from './types'

export type DependencyMap = Map<DependencyTree, DependencyTree[]>

export function resolveDependencyOrder(
  depMap: DependencyMap,
  dependency: DependencyTree,
): Dependency[] {
  const result: Dependency[] = []

  resolveSpecific(depMap, result, dependency, [dependency.path])

  return uniq(result)
}

function resolveSpecific(
  depMap: DependencyMap,
  result: Dependency[],
  dependency: DependencyTree,
  filesProcessed: string[],
) {
  const { path, type } = dependency

  if (filesProcessed.indexOf(path) !== filesProcessed.lastIndexOf(path)) {
    return
  }

  const deps = depMap.get(dependency)

  if (deps) {
    deps.forEach((dep: DependencyTree) =>
      resolveSpecific(depMap, result, dep, filesProcessed.concat(dep.path)),
    )
  }

  const index = result.findIndex(x => x.path === path)

  if (index === -1) {
    result.push({ path, type })
    depMap.delete(dependency)
  }

  return result
}
