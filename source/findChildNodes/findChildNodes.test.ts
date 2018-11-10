import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { isFunctionDeclaration, isFunctionExpression } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { findChildNodes } from './findChildNodes'

const testHelpers = join(__dirname, '../../test-helpers')

export const test = describe(`findChildNodes`, [
  given(`a Predicate and SourceFiles`, [
    it(`returns a NodeTree of nodes matching predicate`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/functions.ts')
      const { sourceFile } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const nodes = findChildNodes(x => isFunctionDeclaration(x) || isFunctionExpression(x), [
        sourceFile,
      ])

      const expectedTopLevelNodes = 4
      const expectedChildrenOfFirstNode = 1

      equal(expectedTopLevelNodes, nodes.length)
      equal(expectedChildrenOfFirstNode, nodes[0].children.length)
    }),
  ]),
])
