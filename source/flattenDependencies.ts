import { chain } from '@typed/list'
import { Dependency, DependencyTree } from './types'

export function flattenDependencies({ type, path, dependencies }: DependencyTree): Dependency[] {
  const names: Dependency[] = [{ type, path }]
  const hasBeenSeen = (path: string) => names.findIndex(x => x.path === path) > -1

  for (const dependency of chain(flattenDependencies, dependencies)) {
    if (!hasBeenSeen(dependency.path)) {
      names.push(dependency)
    }
  }

  return names
}
