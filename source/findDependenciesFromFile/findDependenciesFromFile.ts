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
  const filesProcessed: Record<string, DependencyTree> = {}

  while (sourceFilesToProcess.length > 0) {
    const { path, tree } = sourceFilesToProcess.shift() as {
      path: string
      tree: DependencyTree
    }
    const resolveOptions = { basedir: dirname(path), extensions }
    const { importedFiles, referencedFiles } = preProcessFile(
      sys.readFile(path) as string,
      true,
      true,
    )
    const fileNames = importedFiles.concat(referencedFiles).map(x => x.fileName)

    while (fileNames.length > 0) {
      const fileName = fileNames.shift() as string
      const filePath = resolveSync(fileName, resolveOptions)
      const isExternal = filePath.includes('node_modules')
      const type = isExternal ? 'external' : 'local'
      const pathToUse = isExternal ? fileName : filePath
      const alreadyBeenUsed = tree.dependencies.findIndex(x => x.path === pathToUse) > -1

      if (alreadyBeenUsed) {
        continue
      }

      const currentTree = filesProcessed[pathToUse]

      if (currentTree) {
        tree.dependencies.push(currentTree)

        continue
      }

      const dependency: DependencyTree = {
        type,
        path: pathToUse,
        dependencies: [],
      }

      filesProcessed[pathToUse] = dependency

      tree.dependencies.push(dependency)

      if (!isExternal) {
        sourceFilesToProcess.push({
          path: filePath,
          tree: dependency,
        })
      }
    }
  }

  return root
}
