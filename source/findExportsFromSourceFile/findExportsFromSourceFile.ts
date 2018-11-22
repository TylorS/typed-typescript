import {
  Identifier,
  isClassDeclaration,
  isExportAssignment,
  isExportDeclaration,
  isExportSpecifier,
  isFunctionDeclaration,
  isIdentifier,
  isVariableDeclaration,
  isVariableStatement,
  Node,
  SourceFile,
  SyntaxKind,
  Type,
  TypeChecker,
} from 'typescript'
import { findChildNodes } from '../findChildNodes'
import { getSymbolFromType } from '../getSymbolFromType'
import { getType } from '../getType'
import { ExportMetadata } from '../types'

const sourceFileToExportMetadata = new WeakMap<SourceFile, ExportMetadata[]>()

export function findExportsFromSourceFile(
  sourceFile: SourceFile,
  typeChecker: TypeChecker,
): ExportMetadata[] {
  return (
    sourceFileToExportMetadata.get(sourceFile) ||
    deduplicateMetadata(findExportMetadata(sourceFile, typeChecker))
  )
}

function deduplicateMetadata(metadata: ExportMetadata[]) {
  const deduplicated: ExportMetadata[] = []

  for (const exportMetadata of metadata) {
    const index = deduplicated.findIndex(x => x.node === exportMetadata.node)

    if (index === -1) {
      deduplicated.push(exportMetadata)
    } else {
      deduplicated[index].exportNames.push(...exportMetadata.exportNames)
    }
  }

  return deduplicated
}

function findExportMetadata(sourceFile: SourceFile, typeChecker: TypeChecker): ExportMetadata[] {
  const getSymbolOfNode = (node: Node) => getSymbolFromType(getType(typeChecker, node) as Type)
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
    const symbol = getSymbolOfNode(identifier)

    if (!symbol) {
      return []
    }

    return findChildNodes(x => getSymbolOfNode(x) === symbol, [sourceFile])
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
      if (node.exportClause) {
        const { elements: exportSpecifiers } = node.exportClause

        for (const specifier of exportSpecifiers) {
          // exportName is undefined unless { foo as bar }
          const [localName, exportName] = findChildNodes(isIdentifier, [specifier])
          const [originalNode] = findNodesOfSymbol(specifier.name)

          findExportMetadata(
            originalNode,
            ((exportName ? exportName.node : localName.node) as Identifier).getText(sourceFile),
          )
        }

        return
      }
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
