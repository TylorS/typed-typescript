import { curry2 } from '@typed/functions'
import { Maybe, Nothing } from '@typed/maybe'

import { Node, Type, TypeChecker } from 'typescript'

export const getType: {
  (checker: TypeChecker, node: Node): Maybe<Type>
  (checker: TypeChecker): (node: Node) => Maybe<Type>
} = curry2(__getType)

function __getType(checker: TypeChecker, node: Node): Maybe<Type> {
  try {
    const type = checker.getTypeAtLocation(node)

    return Maybe.of(type)
  } catch {
    return Nothing
  }
}
