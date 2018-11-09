import { dirname } from 'path'
import { sync as resolveSync } from 'resolve'
import {
  CompilerOptions,
  Expression,
  isExportDeclaration,
  isImportDeclaration,
  Node,
  Path,
  Program,
  SourceFile,
} from 'typescript'

export interface Dependencies {
  filePath: string
  dependencies: Dependencies[]
}

export function findSourceFileDependencies(sourceFile: SourceFile, program: Program): Dependencies {
  const pathsSeen: string[] = []
  const dependencies: Dependencies[] = []

  function addSourceFile(file: SourceFile) {
    if (pathsSeen.includes(file.fileName)) {
      return
    }

    pathsSeen.push(file.fileName)

    const dependency: Dependencies = {
      filePath: file.fileName,
      dependencies: findSourceFileDependencies(file, program).dependencies,
    }

    dependencies.push(dependency)
  }

  function checkNode(node: Node) {
    if (isImportDeclaration(node) || (isExportDeclaration(node) && node.moduleSpecifier)) {
      addSourceFile(
        findModuleSpecifierSourceFile(sourceFile, program, node.moduleSpecifier as Expression),
      )
    }
  }

  // SourceFile always has SyntaxList at 0
  const syntaxList = sourceFile.getChildAt(0)
  // Imports and Exports must be top-level
  syntaxList.getChildren().forEach(checkNode)

  return {
    filePath: sourceFile.fileName,
    dependencies,
  }
}

function findModuleSpecifierSourceFile(
  sourceFile: SourceFile,
  program: Program,
  moduleSpecifier: Expression,
): SourceFile {
  const filePath = resolveSync(
    findSpecifierName(sourceFile, [moduleSpecifier.pos, moduleSpecifier.end]),
    {
      basedir: dirname(sourceFile.fileName),
      extensions: getExtensions(program.getCompilerOptions()),
    },
  )
  const file = program.getSourceFile(filePath as Path)

  if (!file) {
    throw new Error(`Unable to find SourceFile for ${filePath}`)
  }

  return file
}

function getExtensions(compilerOptions: CompilerOptions): string[] {
  const extensions = ['.js', '.ts']

  if (!!compilerOptions.jsx) {
    extensions.push('.tsx', '.jsx')
  }

  if (!!compilerOptions.resolveJsonModule) {
    extensions.push('.json')
  }

  return extensions
}

function findSpecifierName(sourceFile: SourceFile, position: [number, number]): string {
  return sourceFile
    .getFullText()
    .slice(position[0], position[1])
    .trim()
    .replace(/^('|")/, '')
    .replace(/('|")$/, '')
}
