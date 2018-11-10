import { Maybe, Nothing } from '@typed/maybe'
import { Symbol, Type } from 'typescript'

export function getSymbolFromType(type: Type): Maybe<Symbol> {
  try {
    const symbol = type.getSymbol()

    return symbol ? Maybe.of(symbol) : Nothing
  } catch {
    return Nothing
  }
}
