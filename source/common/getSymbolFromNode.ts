import { curry2 } from '@typed/functions'
import { Node, Symbol, TypeChecker } from 'typescript'
import { getSymbolFromType } from './getSymbolFromType'
import { getType } from './getType'

export const getSymbolFromNode: {
  (typeChecker: TypeChecker, node: Node): Symbol | null
  (typeChecker: TypeChecker): (node: Node) => Symbol | null
} = curry2(__getSymbolFromNode)

function __getSymbolFromNode(typeChecker: TypeChecker, node: Node): Symbol | null {
  const type = getType(typeChecker, node)

  return type ? getSymbolFromType(type) : null
}
