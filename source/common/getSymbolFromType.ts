import { Symbol, Type } from 'typescript'

export function getSymbolFromType(type: Type): Symbol | null {
  try {
    return type.getSymbol() || null
  } catch {
    return null
  }
}
