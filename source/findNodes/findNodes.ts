import { forEachChild, Node } from 'typescript'

export interface NodeTree {
  node: Node
  position: [number, number]
  children: NodeTree[]
}

export const RETURN_EARLY_ERROR = new Error('Returned Early')

export const returnEarly = (): never => {
  throw RETURN_EARLY_ERROR
}

export function findNodes(predicate: (node: Node) => boolean, nodes: Node[]): NodeTree[] {
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

  try {
    nodes.forEach(visitNode)
  } catch (error) {
    // An API for short circuiting the traversal
    // Scenario: You've found the one node you're looking for and
    // don't want to traverse every other SourceFile in your project
    // wastefully.
    if (error === RETURN_EARLY_ERROR) {
      return nodeTrees
    }

    throw error
  }

  return nodeTrees
}

function organizeNodesIntoTree(nodes: Node[]): NodeTree[] {
  if (nodes.length === 0) {
    return []
  }

  let sortedNodes = nodes.slice().sort(byStart)
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
