import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { typeCheckFiles } from './typeCheckFiles'

export const test = describe(`typeCheckFiles`, [
  given(`a directory, a list of files, and a Program`, [
    it(`returns results of type checking`, ({ ok }) => {
      const fixtureFilePath = join(__dirname, '../../test-helpers/fixtures/failingTypeCheck.ts')
      const { program } = setupFixtureTestEnvironment(__dirname, fixtureFilePath)
      const results = typeCheckFiles(__dirname, [fixtureFilePath], program)

      ok(results.includes(`fixtures/failingTypeCheck.ts (2,3):`))
      ok(results.includes(`Type '"bar"' is not assignable to type '"foo"'`))
    }),
  ]),
])
