import { dirname } from 'path'
import { sync as resolveSync } from 'resolve'
import { Path, preProcessFile, Program, SourceFile } from 'typescript'
import { getFileExtensions } from '../getFileExtensions'
import { DependencyTree } from '../types'

// Only supports top-level imports
// TODO: support dynamic require()/import()
// Consideration: Is supporting dynamic imports worth performance penalty?
export function findDependenciesFromSourceFile(
  sourceFile: SourceFile,
  program: Program,
): DependencyTree {
  const extensions = getFileExtensions(program.getCompilerOptions())
  const root: DependencyTree = {
    type: 'local',
    path: sourceFile.fileName,
    dependencies: [],
  }

  const sourceFilesToProcess = [{ sourceFile, tree: root }]

  while (sourceFilesToProcess.length > 0) {
    const { sourceFile, tree } = sourceFilesToProcess.shift() as {
      sourceFile: SourceFile
      tree: DependencyTree
    }
    const { importedFiles, referencedFiles } = preProcessFile(sourceFile.text, true, true)
    const fileNames = importedFiles.concat(referencedFiles).map(x => x.fileName)

    while (fileNames.length > 0) {
      const fileName = fileNames.shift() as string
      const file = findSourceFile(sourceFile, program, extensions, fileName)
      const dependency: DependencyTree = {
        type: file ? 'local' : 'external',
        path: file ? file.fileName : fileName,
        dependencies: [],
      }

      if (tree.dependencies.findIndex(x => x.path === dependency.path) === -1) {
        tree.dependencies.push(dependency)

        if (file) {
          sourceFilesToProcess.push({
            sourceFile: file,
            tree: dependency,
          })
        }
      }
    }
  }

  return root
}

function findSourceFile(
  sourceFile: SourceFile,
  program: Program,
  extensions: string[],
  identifier: string,
) {
  try {
    const filePath = resolveSync(identifier, {
      basedir: dirname(sourceFile.fileName),
      extensions,
    })

    return program.getSourceFile(filePath as Path)
  } catch {
    return null
  }
}
