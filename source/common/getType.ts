import { curry2 } from '@typed/functions'

import { Node, Type, TypeChecker } from 'typescript'

export const getType: {
  (checker: TypeChecker, node: Node): Type | null
  (checker: TypeChecker): (node: Node) => Type | null
} = curry2(__getType)

function __getType(checker: TypeChecker, node: Node): Type | null {
  try {
    return checker.getTypeAtLocation(node) || null
    // tslint:disable-next-line:no-empty
  } catch {}

  return null
}
