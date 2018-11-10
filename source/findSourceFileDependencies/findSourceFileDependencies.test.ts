import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { createProgram, Path, SourceFile } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { findTsConfig } from '../findTsConfig'
import { DependencyTree } from '../types'
import { findSourceFileDependencies } from './findSourceFileDependencies'

export const findSourceFileDependenciesTest = describe(`findSourceFileDependencies`, [
  given(`a SourceFile`, [
    it(`returns its Dependencies`, ({ equal }) => {
      const tsConfig = findTsConfig(__dirname)
      const fixtureFilePath = join(__dirname, 'fixtures/foobar.ts')
      const program = createProgram({
        rootNames: [fixtureFilePath],
        options: tsConfig.compilerOptions,
      })
      const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile
      const dependencies = findSourceFileDependencies(sourceFile, program)
      const expected: DependencyTree = {
        filePath: fixtureFilePath,
        dependencies: [
          {
            filePath: join(__dirname, 'fixtures/bar.ts'),
            dependencies: [],
          },
          {
            filePath: join(__dirname, 'fixtures/foo.ts'),
            dependencies: [],
          },
          {
            filePath: join(__dirname, 'fixtures/baz.ts'),
            dependencies: [
              {
                filePath: join(__dirname, 'fixtures/quux.ts'),
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
      const fixtureFilePath = join(__dirname, 'fixtures/require.ts')
      const { sourceFile, program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const dependencies = findSourceFileDependencies(sourceFile, program)

      const expected: DependencyTree = {
        filePath: fixtureFilePath,
        dependencies: [
          {
            filePath: join(__dirname, 'fixtures/foo.cjs.ts'),
            dependencies: [],
          },
        ],
      }

      equal(expected, dependencies)
    }),
  ]),
])
