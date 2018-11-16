import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { createProgram, Path, SourceFile } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { findTsConfig } from '../findTsConfig'
import { DependencyTree } from '../types'
import { findDependenciesFromSourceFile } from './findDependenciesFromSourceFile'

const testHelpers = join(__dirname, '../../test-helpers')

export const findSourceFileDependenciesTest = describe(`findSourceFileDependencies`, [
  given(`a SourceFile`, [
    it(`returns its Dependencies`, ({ equal }) => {
      const tsConfig = findTsConfig(__dirname)
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/foobar.ts')
      const program = createProgram({
        rootNames: [fixtureFilePath],
        options: tsConfig.compilerOptions,
      })
      const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile
      const dependencies = findDependenciesFromSourceFile(sourceFile, program)
      const expected: DependencyTree = {
        filePath: fixtureFilePath,
        dependencies: [
          {
            filePath: join(testHelpers, 'fixtures/modules/bar.ts'),
            dependencies: [],
          },
          {
            filePath: join(testHelpers, 'fixtures/modules/foo.ts'),
            dependencies: [],
          },
          {
            filePath: join(testHelpers, 'fixtures/modules/baz.ts'),
            dependencies: [
              {
                filePath: join(testHelpers, 'fixtures/modules/quux.ts'),
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
        filePath: fixtureFilePath,
        dependencies: [
          {
            filePath: join(testHelpers, 'fixtures/modules/foo.cjs.ts'),
            dependencies: [],
          },
        ],
      }

      equal(expected, dependencies)
    }),
  ]),
])
