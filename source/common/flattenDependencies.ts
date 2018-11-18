import { DependencyTree, DependencyType } from '../types'

export function flattenDependencies({
  type,
  path,
  dependencies,
}: DependencyTree): Array<{ type: DependencyType; path: string }> {
  const names: Array<{ type: DependencyType; path: string }> = [{ type, path }]

  for (const dependency of dependencies) {
    names.push(...flattenDependencies(dependency))
  }

  return names
}
