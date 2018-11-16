import { curry3 } from '@typed/functions'
import { Node, SourceFile, TypeChecker } from 'typescript'
import { findChildNodes } from '../findChildNodes'
import { findExportsFromSourceFile } from '../findExportsFromSourceFile'

export const isExportedFromSourceFile: {
  (typeChecker: TypeChecker, sourceFile: SourceFile, node: Node): boolean
  (typeChecker: TypeChecker, sourceFile: SourceFile): (node: Node) => boolean
  (typeChecker: TypeChecker): {
    (sourceFile: SourceFile, node: Node): boolean
    (sourceFile: SourceFile): (node: Node) => boolean
  }
} = curry3(__isExportedFromSourceFile)

function __isExportedFromSourceFile(
  typeChecker: TypeChecker,
  sourceFile: SourceFile,
  node: Node,
): boolean {
  const exportMetadata = findExportsFromSourceFile(sourceFile, typeChecker)
  const matches = findChildNodes(x => x === node, exportMetadata.map(x => x.node))

  return matches.length > 0
}
