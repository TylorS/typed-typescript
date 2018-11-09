import { bar } from './bar'
import { foo } from './foo'

export { baz } from './baz'

export function foobar(): 'foobar' {
  return (foo() + bar()) as 'foobar'
}
