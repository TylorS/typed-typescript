import { curry2 } from '@typed/functions'
import { Node, SourceFile } from 'typescript'
import { getPosition } from './getPosition'
import { NodePosition } from './types'

export const getNodePosition: {
  (sourceFile: SourceFile, node: Node): NodePosition
  (sourceFile: SourceFile): (node: Node) => NodePosition
} = curry2(__getNodePosition)

function __getNodePosition(sourceFile: SourceFile, node: Node): NodePosition {
  const [start, end] = getPosition(node)
  const startLine = sourceFile.text.slice(0, start).split(/\n/g).length
  const text = node.getFullText()
  const numberOfLines = text.split(/\n/g).length
  const endLine = startLine + numberOfLines

  return {
    position: [start, end],
    startLine,
    endLine,
    numberOfLines,
  }
}
