import { chain, fromJust, isJust, Maybe } from '@typed/maybe'
import {
  Identifier,
  isClassDeclaration,
  isExportAssignment,
  isExportDeclaration,
  isExportSpecifier,
  isFunctionDeclaration,
  isIdentifier,
  isNamedExports,
  isVariableDeclaration,
  isVariableStatement,
  Node,
  SourceFile,
  SyntaxKind,
  TypeChecker,
} from 'typescript'
import { findChildNodes } from '../findChildNodes'
import { getSymbolFromType } from '../getSymbolFromType'
import { getType } from '../getType'
import { ExportMetadata } from '../types'

export const maybesAreSame = <A>(a: Maybe<A>, b: Maybe<A>): boolean =>
  isJust(a) && isJust(b) && fromJust(a) === fromJust(b)

export function findExportsFromSourceFile(
  sourceFile: SourceFile,
  typeChecker: TypeChecker,
): ExportMetadata[] {
  const getSymbolOfNode = (node: Node) => chain(getSymbolFromType, getType(typeChecker, node))
  const exportMetadata: ExportMetadata[] = []

  function findExportMetadata(node: Node, identifier?: string) {
    // ExportDeclaration
    // ExportAssignment to Identifier
    if (identifier) {
      exportMetadata.push({
        node,
        exportNames: [identifier],
      })

      return
    }

    if (isExportAssignment(node)) {
      const text = node.getText(sourceFile)
      const hasDefault = text.includes('export default ')
      const exportNames = hasDefault ? ['default'] : [text]

      exportMetadata.push({
        node,
        exportNames,
      })

      return
    }

    // Variable Statements
    // Class Declaration
    // Function Declarations
    const [{ node: exportNameNode }] = findChildNodes(isIdentifier, [node])
    const exportName = exportNameNode.getText(sourceFile)

    return exportMetadata.push({
      node,
      exportNames: [exportName],
    })
  }

  function findNodesOfSymbol(identifier: Identifier) {
    const maybeSymbol = getSymbolOfNode(identifier)

    return findChildNodes(x => maybesAreSame(getSymbolOfNode(x), maybeSymbol), [sourceFile])
      .filter(x => !isExportSpecifier(x.node) && !isExportAssignment(x.node))
      .map(x => x.node)
  }

  function checkNode(node: Node) {
    const canContainExportModifier =
      isVariableStatement(node) || isClassDeclaration(node) || isFunctionDeclaration(node)
    const hasExportedModifier = canContainExportModifier && hasExportModifer(node)

    if (hasExportedModifier) {
      return findExportMetadata(node)
    }

    // export = <something>
    // export default <something>
    if (isExportAssignment(node)) {
      const text = node.getText(sourceFile)
      const hasDefault = text.includes('export default')
      const [identifier] = findChildNodes(isIdentifier, [node])

      if (identifier) {
        const [originalNode] = findNodesOfSymbol(identifier.node as Identifier)
        const nodeToUse = isVariableDeclaration(originalNode)
          ? originalNode.parent.parent // VariableStatement
          : originalNode

        return findExportMetadata(nodeToUse, hasDefault ? 'default' : 'module.export')
      }

      return findExportMetadata(node)
    }

    if (isExportDeclaration(node)) {
      const [namedExports] = node.getChildren(sourceFile).filter(isNamedExports)
      const { elements: exportSpecifiers } = namedExports

      for (const specifier of exportSpecifiers) {
        // exportName is undefined unless { foo as bar }
        const [localName, exportName] = findChildNodes(isIdentifier, [specifier])
        const [originalNode] = findNodesOfSymbol(specifier.name)

        findExportMetadata(
          originalNode,
          (exportName ? (exportName.node as Identifier) : (localName.node as Identifier)).getText(
            sourceFile,
          ),
        )
      }

      return
    }
  }

  // SourceFile always has SyntaxList at 0
  const syntaxList = sourceFile.getChildAt(0)
  // Imports and Exports must be top-level
  syntaxList.getChildren(sourceFile).forEach(checkNode)

  return exportMetadata
}

function hasExportModifer(node: Node): boolean {
  if (!node.modifiers) {
    return false
  }

  for (const modifier of node.modifiers) {
    if (modifier.kind === SyntaxKind.ExportKeyword) {
      return true
    }
  }

  return false
}
