import { describe, given, it } from '@typed/test'

export const test = describe('node-module', [
  given(`a File with an external node module dependencey`, [
    it(`can be tracked as a dependency`, ({ ok }) => ok(true)),
  ]),
])
