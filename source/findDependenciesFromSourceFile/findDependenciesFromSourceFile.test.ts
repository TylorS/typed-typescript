import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { Path, SourceFile } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { DependencyTree } from '../types'
import { findDependenciesFromSourceFile } from './findDependenciesFromSourceFile'

const testHelpers = join(__dirname, '../../test-helpers')

export const findSourceFileDependenciesTest = describe(`findDependenciesFromSourceFile`, [
  given(`a SourceFile`, [
    it(`returns its Dependencies`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/foobar.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile
      const dependencies = findDependenciesFromSourceFile(sourceFile, program)
      const expected: DependencyTree = {
        type: 'local',
        path: fixtureFilePath,
        dependencies: [
          {
            type: 'local',
            path: join(testHelpers, 'fixtures/modules/bar.ts'),
            dependencies: [],
          },
          {
            type: 'local',
            path: join(testHelpers, 'fixtures/modules/foo.ts'),
            dependencies: [],
          },
          {
            type: 'local',
            path: join(testHelpers, 'fixtures/modules/baz.ts'),
            dependencies: [
              {
                type: 'local',
                path: join(testHelpers, 'fixtures/modules/quux.ts'),
                dependencies: [],
              },
            ],
          },
        ],
      }

      equal(expected, dependencies)
    }),
  ]),

  given(`A SourceFile with import Foo = require('foo')`, [
    it(`returns it's dependencies`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/require.ts')
      const { sourceFile, program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const dependencies = findDependenciesFromSourceFile(sourceFile, program)

      const expected: DependencyTree = {
        type: 'local',
        path: fixtureFilePath,
        dependencies: [
          {
            type: 'local',
            path: join(testHelpers, 'fixtures/modules/foo.cjs.ts'),
            dependencies: [],
          },
        ],
      }

      equal(expected, dependencies)
    }),
  ]),

  given(`A SourceFile with external module reference`, [
    it(`returns it's dependencies`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/node-module.ts')
      const { sourceFile, program } = setupFixtureTestEnvironment(
        join(testHelpers, 'fixtures/modules/'),
        fixtureFilePath,
      )
      const dependencies = findDependenciesFromSourceFile(sourceFile, program)

      const expected: DependencyTree = {
        type: 'local',
        path: fixtureFilePath,
        dependencies: [
          {
            type: 'external',
            path: '@typed/test',
            dependencies: [],
          },
        ],
      }

      equal(expected, dependencies)
    }),
  ]),
])
