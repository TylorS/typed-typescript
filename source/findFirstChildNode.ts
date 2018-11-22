import { curry2 } from '@typed/functions'
import { Node } from 'typescript'

export const findFirstChildNode: {
  (predicate: (node: Node) => boolean, root: Node): Node | null
  (predicate: (node: Node) => boolean): (root: Node) => Node | null
} = curry2(__findFirstNode)

function __findFirstNode(predicate: (node: Node) => boolean, root: Node): Node | null {
  const nodesToProcess: Node[] = root.getChildren()

  while (nodesToProcess.length > 0) {
    const node = nodesToProcess.shift() as Node

    if (predicate(node)) {
      return node
    }

    nodesToProcess.push(...node.getChildren())
  }

  return null
}
