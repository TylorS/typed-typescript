import { dirname } from 'path'
import { sync as resolveSync } from 'resolve'
import { CompilerOptions, preProcessFile, sys } from 'typescript'
import { getFileExtensions } from '../getFileExtensions'
import { DependencyTree } from '../types'

// Only supports top-level imports
// TODO: support dynamic require()/import()
// Consideration: Is supporting dynamic imports worth performance penalty?
export function findDependenciesFromFile(
  fileName: string,
  compilerOptions: CompilerOptions,
): DependencyTree {
  // ensure can resolve node dependencies
  compilerOptions.allowJs = true
  const extensions = getFileExtensions(compilerOptions)
  const root: DependencyTree = {
    type: 'local',
    path: fileName,
    dependencies: [],
  }
  const sourceFilesToProcess = [{ path: fileName, tree: root }]

  while (sourceFilesToProcess.length > 0) {
    const { path, tree } = sourceFilesToProcess.shift() as {
      path: string
      tree: DependencyTree
    }
    const { importedFiles, referencedFiles } = preProcessFile(
      sys.readFile(path) as string,
      true,
      true,
    )
    const fileNames = importedFiles.concat(referencedFiles).map(x => x.fileName)

    while (fileNames.length > 0) {
      const fileName = fileNames.shift() as string
      const filePath = resolveSync(fileName, { basedir: dirname(path), extensions })
      const type = filePath.includes('node_modules') ? 'external' : 'local'
      const isLocal = type === 'local'
      const dependency: DependencyTree = {
        type,
        path: isLocal ? filePath : fileName,
        dependencies: [],
      }

      if (tree.dependencies.findIndex(x => x.path === dependency.path) === -1) {
        tree.dependencies.push(dependency)

        if (isLocal) {
          sourceFilesToProcess.push({
            path: filePath,
            tree: dependency,
          })
        }
      }
    }
  }

  return root
}
