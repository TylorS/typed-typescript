import { curry2 } from '@typed/functions'
import { forEachChild, Node } from 'typescript'
import { NodeTree } from '../types'

export const findChildNodes: {
  (predicate: (node: Node) => boolean, nodes: Node[]): NodeTree[]
  (predicate: (node: Node) => boolean): (nodes: Node[]) => NodeTree[]
} = curry2(__findChildNodes)

function __findChildNodes(predicate: (node: Node) => boolean, nodes: Node[]): NodeTree[] {
  return organizeNodesIntoTree(findAllNodes(predicate, nodes))
}

function findAllNodes(predicate: (node: Node) => boolean, nodes: Node[]): Node[] {
  const nodeTrees: Node[] = []

  function visitNode(node: Node) {
    if (predicate(node)) {
      nodeTrees.push(node)
    }

    forEachChild(node, visitNode)
  }

  nodes.forEach(visitNode)

  return nodeTrees
}

function organizeNodesIntoTree(nodes: Node[]): NodeTree[] {
  if (nodes.length === 0) {
    return []
  }

  // Yes this is mutation but it was just made in the previous function call in findChildNodes
  let sortedNodes = nodes.sort(byStart)
  let node = sortedNodes.shift()
  const nodeTree: NodeTree[] = []

  while (node) {
    const allBetween = sortedNodes.filter(x => x !== node).filter(isBetween(node))
    sortedNodes = sortedNodes.filter(x => allBetween.findIndex(y => y === x) === -1)

    nodeTree.push({
      node,
      position: position(node),
      children: organizeNodesIntoTree(allBetween),
    })

    node = sortedNodes.shift()
  }

  return nodeTree
}

function byStart(a: Node, b: Node) {
  return a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0
}

function isBetween(outer: Node) {
  return (maybeInner: Node): boolean => {
    const [outerStart, outerEnd] = position(outer)
    const [innerStart, innerEnd] = position(maybeInner)

    return outerStart <= innerStart && outerEnd >= innerEnd
  }
}

function position(node: Node): [number, number] {
  return [node.pos, node.getFullWidth() + node.pos]
}
