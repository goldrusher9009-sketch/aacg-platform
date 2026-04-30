// jest.setup.js
// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom'

// Set test environment variables
process.env.TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))
