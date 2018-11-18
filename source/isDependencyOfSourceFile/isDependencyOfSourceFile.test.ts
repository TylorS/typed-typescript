import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { sync } from 'resolve'
import { Path, SourceFile } from 'typescript'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { isDependencyOfSourceFile } from './isDependencyOfSourceFile'

const testHelpers = join(__dirname, '../../test-helpers')

export const test = describe(`isDependencyOfSourceFile`, [
  given(`a Program, a SourceFile, and a file path`, [
    it(`returns true if is a dependency of source file`, ({ ok }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/foobar.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile

      ok(
        isDependencyOfSourceFile(program, sourceFile, join(testHelpers, 'fixtures/modules/foo.ts')),
      )
      ok(
        isDependencyOfSourceFile(program, sourceFile, join(testHelpers, 'fixtures/modules/bar.ts')),
      )
    }),

    it(`returns false if is a dependency of source file`, ({ notOk }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/quux.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile

      notOk(
        isDependencyOfSourceFile(program, sourceFile, join(testHelpers, 'fixtures/modules/foo.ts')),
      )
      notOk(
        isDependencyOfSourceFile(program, sourceFile, join(testHelpers, 'fixtures/modules/bar.ts')),
      )
    }),
  ]),

  given(`a Program, a SourceFile with node module import, and a file path`, [
    it(`returns true when given node module import path`, ({ ok }) => {
      const fixtureFilePath = join(testHelpers, 'fixtures/modules/node-module.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const sourceFile = program.getSourceFile(fixtureFilePath as Path) as SourceFile

      ok(isDependencyOfSourceFile(program, sourceFile, sync('@typed/test')))
    }),
  ]),
])
