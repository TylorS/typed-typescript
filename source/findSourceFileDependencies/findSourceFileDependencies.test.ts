import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { createProgram, Path, SourceFile } from 'typescript'
import { findTsConfig } from '../findTsConfig'
import { Dependencies, findSourceFileDependencies } from './findSourceFileDependencies'

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
      const expected: Dependencies = {
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
])
