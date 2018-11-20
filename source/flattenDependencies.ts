import { chain } from '@typed/list'
import { DependencyTree, DependencyType } from './types'

export function flattenDependencies({
  type,
  path,
  dependencies,
}: DependencyTree): Array<{ type: DependencyType; path: string }> {
  const names: Array<{ type: DependencyType; path: string }> = [{ type, path }]
  const hasBeenSeen = (path: string) => names.findIndex(x => x.path === path) > -1

  for (const dependency of chain(flattenDependencies, dependencies)) {
    if (!hasBeenSeen(dependency.path)) {
      names.push(dependency)
    }
  }

  return names
}
