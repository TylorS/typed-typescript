import { describe, given, it } from '@typed/test'
import { join } from 'path'

import { typecheckInAnotherProcess } from './typeCheckInSeparateProcess'

export const test = describe(`typeCheckInSeparateProcess`, [
  given(`a directory and files`, [
    it(`returns the results of type-checking from another process`, async ({ ok, equal }) => {
      const fixtureFilePath = join(__dirname, 'fixtures/failingTypeCheck.ts')
      const { exitCode, stdout, stderr } = await typecheckInAnotherProcess(__dirname, [
        fixtureFilePath,
      ])

      equal(1, exitCode)
      ok(stdout.includes(`source/type-checking/fixtures/failingTypeCheck.ts (2,3):`))
      ok(stdout.includes(`Type '"bar"' is not assignable to type '"foo"'`))
      equal('', stderr)
    }),
  ]),
])
