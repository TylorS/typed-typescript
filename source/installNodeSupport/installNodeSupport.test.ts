import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { installNodeSupport } from './installNodeSupport'

export const test = describe(`installNodeSupport`, [
  given(`cwd and compilerOptions `, [
    it(`installs TypeScript support`, ({ equal, throws }) => {
      const directory = join(__dirname, '../../test-helpers/fixtures/paths')
      const file = join(directory, 'foobar.ts')

      throws(() => require(file))

      const { tsConfig } = setupFixtureTestEnvironment(directory, file)
      const cleanup = installNodeSupport(tsConfig)

      const { foobar } = require(file)

      equal('foobar', foobar())

      cleanup()
    }),
  ]),
])
