import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { SyntaxKind } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { findExportsFromSourceFile } from './findExportsFromSourceFile'

const testFixtures = join(__dirname, '../../test-helpers/fixtures')

/* TODO:
  Add re-exports test
  Add export =
  Add export = identifier
*/
export const test = describe(`findExportsFromSourceFile`, [
  given(`a SourceFile with exported arrow function`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/arrow-function.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported class`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/class.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['Foo'], actual.exportNames)
      equal(SyntaxKind.ClassDeclaration, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported function declaration`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/function-declaration.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.FunctionDeclaration, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported number literal`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/number.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported string literal`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/number.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with exported object literal`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/object-literal.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with default export`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/default-export.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['default'], actual.exportNames)
      equal(SyntaxKind.ExportAssignment, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with identifier`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/identifier.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo'], actual.exportNames)
      equal(SyntaxKind.VariableDeclaration, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with { export A as B }`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/export-as.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['bar'], actual.exportNames)
      equal(SyntaxKind.VariableDeclaration, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with default export identifier`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/default-export-identifier.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['default'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with default export =`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/export-equal.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['module.export'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),

  given(`a SourceFile with multiple export names`, [
    it(`returns all exports`, ({ equal }) => {
      const filePath = join(testFixtures, 'exports/multiple-export-names.ts')
      const { sourceFile, typeChecker } = setupFixtureTestEnvironment(__dirname, filePath)
      const [actual] = findExportsFromSourceFile(sourceFile, typeChecker)

      equal(['foo', 'default'], actual.exportNames)
      equal(SyntaxKind.VariableStatement, actual.node.kind)
    }),
  ]),
])
