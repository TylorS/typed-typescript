import { dirname } from 'path'
import { sync as resolveSync } from 'resolve'
import {
  Expression,
  isExportDeclaration,
  isImportDeclaration,
  isImportEqualsDeclaration,
  Node,
  Path,
  Program,
  SourceFile,
} from 'typescript'
import { getFileExtensions } from '../getFileExtensions'
import { getPosition } from '../getPosition'
import { DependencyTree } from '../types'

const OPENING_STRING_LITERAL = /^('|")/
const CLOSING_STRING_LITERAL = /('|")$/
const OPENING_REQUIRE_CALL_EXPRESSION = /(^require\()/
const CLOSING_CALL_EXPRESSION = /\)$/

// Only supports top-level imports
// TODO: support dynamic require()/import()
// Consideration: Is supporting dynamic imports worth performance penalty?
export function findDependenciesFromSourceFile(
  sourceFile: SourceFile,
  program: Program,
): DependencyTree {
  const extensions = getFileExtensions(program.getCompilerOptions())
  const dependencies: DependencyTree[] = []

  function addSourceFile(file: SourceFile) {
    dependencies.push(findDependenciesFromSourceFile(file, program))
  }

  function checkNode(node: Node) {
    if (isImportDeclaration(node) || (isExportDeclaration(node) && node.moduleSpecifier)) {
      const moduleSpecifier = node.moduleSpecifier as Expression

      addSourceFile(
        findSourceFile(
          sourceFile,
          program,
          extensions,
          findSpecifierName(sourceFile, getPosition(moduleSpecifier)),
        ),
      )
    }

    if (isImportEqualsDeclaration(node)) {
      addSourceFile(
        findSourceFile(
          sourceFile,
          program,
          extensions,
          cleanModuleReferenceName(node.moduleReference.getText(sourceFile)),
        ),
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

function findSourceFile(
  sourceFile: SourceFile,
  program: Program,
  extensions: string[],
  identifier: string,
) {
  const filePath = resolveSync(identifier, {
    basedir: dirname(sourceFile.fileName),
    extensions,
  })
  const file = program.getSourceFile(filePath as Path)

  if (!file) {
    throw new Error(`Unable to find SourceFile for ${filePath}`)
  }

  return file
}

function findSpecifierName(sourceFile: SourceFile, position: [number, number]): string {
  return cleanIdentifierName(sourceFile.getFullText().slice(position[0], position[1]))
}

function cleanModuleReferenceName(name: string): string {
  return cleanIdentifierName(
    name.replace(OPENING_REQUIRE_CALL_EXPRESSION, '').replace(CLOSING_CALL_EXPRESSION, ''),
  )
}

function cleanIdentifierName(name: string): string {
  return name
    .trim()
    .replace(OPENING_STRING_LITERAL, '')
    .replace(CLOSING_STRING_LITERAL, '')
}
