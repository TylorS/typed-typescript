import { isAbsolute } from 'path'
import { DependencyTree } from '../types'
import { DependencyCacheTree } from './DependencyCache'

export function dependencyCacheTreeToDependencyTree(
  filePath: string,
  cacheTree: DependencyCacheTree,
): DependencyTree {
  const root: DependencyTree = {
    path: filePath,
    type: 'local',
    dependencies: [],
  }
  const pathsToProcess = [{ path: filePath, tree: root }]
  const filesProcessed: Record<string, DependencyTree> = {}

  while (pathsToProcess.length > 0) {
    const { path, tree } = pathsToProcess.shift() as {
      path: string
      tree: DependencyTree
    }
    const dependencyCacheTree = cacheTree[path]

    if (!dependencyCacheTree) {
      continue
    }

    const fileNames = Object.keys(dependencyCacheTree)

    while (fileNames.length > 0) {
      const fileName = fileNames.shift() as string
      const isLocal = isAbsolute(fileName)
      const currentTree = filesProcessed[fileName]

      if (currentTree) {
        tree.dependencies.push(currentTree)

        continue
      }

      const dependency: DependencyTree = {
        type: isLocal ? 'local' : 'external',
        path: fileName,
        dependencies: [],
      }

      filesProcessed[fileName] = dependency

      tree.dependencies.push(dependency)

      if (isLocal) {
        pathsToProcess.push({
          path: fileName,
          tree: dependency,
        })
      }
    }
  }

  return root
}
