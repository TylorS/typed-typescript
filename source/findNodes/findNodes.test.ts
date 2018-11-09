import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { createProgram, isFunctionDeclaration, isFunctionExpression, SourceFile } from 'typescript'
import { findTsConfig } from '../findTsConfig'
import { findNodes, returnEarly } from './findNodes'

export const test = describe(`findNodes`, [
  given(`a Predicate and SourceFiles`, [
    it(`returns a NodeTree of nodes matching predicate`, ({ equal }) => {
      const tsConfig = findTsConfig(__dirname)
      const fixtureFilePath = join(__dirname, 'fixtures/functions.ts')
      const program = createProgram({
        rootNames: [fixtureFilePath],
        options: tsConfig.compilerOptions,
      })
      const nodes = findNodes(x => isFunctionDeclaration(x) || isFunctionExpression(x), [
        program.getSourceFile(fixtureFilePath) as SourceFile,
      ])

      const expectedTopLevelNodes = 4
      const expectedChildrenOfFirstNode = 1

      equal(expectedTopLevelNodes, nodes.length)
      equal(expectedChildrenOfFirstNode, nodes[0].children.length)
    }),

    it(`allows short-circuiting with returnEarly()`, ({ equal }) => {
      const tsConfig = findTsConfig(__dirname)
      const fixtureFilePath = join(__dirname, 'fixtures/functions.ts')
      const program = createProgram({
        rootNames: [fixtureFilePath],
        options: tsConfig.compilerOptions,
      })
      let found = 0
      const expected = 2

      const nodes = findNodes(
        node => {
          if (isFunctionDeclaration(node)) {
            found++

            if (found > expected) {
              returnEarly()
            }

            return true
          }

          return false
        },
        [program.getSourceFile(fixtureFilePath) as SourceFile],
      )
      equal(expected, nodes.length)
    }),
  ]),
])
