import { Node } from 'typescript'

export function getPosition(node: Node): [number, number] {
  const start = node.getFullStart()
  const width = node.getFullWidth()

  return [start, start + width]
}
