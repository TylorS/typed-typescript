import { describe, given, it } from '@typed/test'
import { join } from 'path'
import { setupFixtureTestEnvironment } from '../../test-helpers/setupFixtureTestEnvironment'
import { installTypeScriptSupport } from './installTypeScriptSupport'

export const test = describe(`installTypeScriptSupport`, [
  given(`cwd and compilerOptions `, [
    it(`installs TypeScript support`, ({ equal }) => {
      const directory = join(__dirname, '../../test-helpers/fixtures/paths')
      const file = join(directory, 'foobar.ts')
      const { program } = setupFixtureTestEnvironment(directory, file)
      const cleanup = installTypeScriptSupport({
        cwd: directory,
        compilerOptions: program.getCompilerOptions(),
      })

      const { foobar } = require(file)

      equal('foobar', foobar())

      cleanup()
    }),
  ]),
])
