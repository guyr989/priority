import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// globals: false means Testing Library cannot auto-register this.
afterEach(() => {
  cleanup()
})
