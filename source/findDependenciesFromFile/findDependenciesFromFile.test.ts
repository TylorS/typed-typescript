import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { DependencyTree } from '../types'
import { createDependencyCache } from './DependencyCache'
import { dependencyCacheTreeToDependencyTree } from './dependencyCacheTreeToDependencyTree'
import { findDependenciesFromFile } from './findDependenciesFromFile'

const testHelpers = join(__dirname, '../../test-helpers')

export const findSourceFileDependenciesTest = describe(`findDependenciesFromSourceFile`, [
  given(`a filename and compiler options`, [
    it(`returns its Dependencies`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/foobar.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const dependencyCache = createDependencyCache({ [fixtureFilePath]: { version: 1 } })

      findDependenciesFromFile(fixtureFilePath, dependencyCache, program.getCompilerOptions())

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

      const actual = dependencyCacheTreeToDependencyTree(
        fixtureFilePath,
        dependencyCache.dependencyTree,
      )

      equal(expected, actual)
    }),
  ]),

  given(`A filename with import Foo = require('foo')`, [
    it(`returns it's dependencies`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/require.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const dependencyCache = createDependencyCache({ [fixtureFilePath]: { version: 1 } })

      findDependenciesFromFile(fixtureFilePath, dependencyCache, program.getCompilerOptions())

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

      const actual = dependencyCacheTreeToDependencyTree(
        fixtureFilePath,
        dependencyCache.dependencyTree,
      )

      equal(expected, actual)
    }),
  ]),

  given(`A file with external module reference`, [
    it(`returns it's dependencies`, ({ equal }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/node-module.ts')
      const { program } = setupFixtureTestEnvironment(
        join(testHelpers, 'fixtures/modules/'),
        fixtureFilePath,
      )
      const dependencyCache = createDependencyCache({ [fixtureFilePath]: { version: 1 } })

      findDependenciesFromFile(fixtureFilePath, dependencyCache, program.getCompilerOptions())

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

      const actual = dependencyCacheTreeToDependencyTree(
        fixtureFilePath,
        dependencyCache.dependencyTree,
      )

      equal(expected, actual)
    }),
  ]),
])
