import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { SyntaxKind } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { findExportsFromSourceFile } from './findExportsFromSourceFile'

const testFixtures = join(__dirname, '../../test-helpers/fixtures')

/* TODO:
  Finish Identifier Test
  Add export { foo as bar } test
  Add default export identifier test
  Add re-exports test
*/
export const test = describe(`findExportsFromSourceFile`, [
  given(`a SourceFile with exported arrow function`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/arrow-function.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported class`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/class.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['Foo'], actual.exportNames)
      equal(SyntaxKind.ClassDeclaration, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported function declaration`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/function-declaration.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.FunctionDeclaration, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported number literal`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/number.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported string literal`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/number.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported object literal`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/object-literal.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with default export`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/default-export.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

      const [actual] = findExportsFromSourceFile(sourceFile)

      equal(['default'], actual.exportNames)
      equal(SyntaxKind.ExportAssignment, actual.node.kind)
    }),
  ]),

  // given(`a SourceFile with identifier`, [
  //   it(`returns all exports`, ({ equal }) => {
  //     const filePath = join(testFixtures, 'exports/identifier.ts')
  //     const { sourceFile } = setupFixtureTestEnvironment(__dirname, filePath)

  //     const [actual] = findExportsFromSourceFile(sourceFile)

  //     equal(['foo'], actual.exportNames)
  //     equal(SyntaxKind.ExportAssignment, actual.node.kind)
  //   }),
  // ]),
])
