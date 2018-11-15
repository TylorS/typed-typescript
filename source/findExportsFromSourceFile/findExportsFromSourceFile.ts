import { Maybe, Nothing } from '@typed/maybe'
import {
  isClassDeclaration,
  isExportAssignment,
  isExportDeclaration,
  isExportSpecifier,
  isFunctionDeclaration,
  isIdentifier,
  isNamedExports,
  isVariableStatement,
  Node,
  SourceFile,
  SyntaxKind,
} from 'typescript'
import { findChildNodes } from '../findChildNodes'
import { ExportMetadata } from '../types'

export function findExportsFromSourceFile(sourceFile: SourceFile): ExportMetadata[] {
  const exportMetadata: ExportMetadata[] = []

  function findExportMetadata(node: Node) {
    if (isExportAssignment(node)) {
      const text = node.getText(sourceFile)
      const hasDefault = text.includes('export default ')
      const exportNames = hasDefault ? ['default'] : []

      return exportMetadata.push({
        node,
        exportNode: Maybe.of(node),
        exportNames,
      })
    }

    const [identifier] = findChildNodes(isIdentifier, [node])
    const exportName = identifier.node.getText(sourceFile)

    return exportMetadata.push({
      node,
      exportNames: [exportName],
      exportNode: Nothing,
    })
  }

  function checkNode(node: Node) {
    console.log(SyntaxKind[node.kind])

    const canContainExportModifier =
      isVariableStatement(node) || isClassDeclaration(node) || isFunctionDeclaration(node)
    const hasExportedModifier = canContainExportModifier && hasExportModifer(node)

    if (hasExportedModifier || isExportAssignment(node)) {
      return findExportMetadata(node)
    }

    if (isExportDeclaration(node)) {
      const [namedExports] = node.getChildren(sourceFile).filter(isNamedExports)
      const exportSpecifiers = namedExports.elements

      for (const specifier of exportSpecifiers) {
        console.log(specifier.name.getText(sourceFile))
      }
    }

    if (isExportSpecifier(node)) {
      // TODO: find the related nodes to the export names
      console.log('exportSpecifier', node)
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
