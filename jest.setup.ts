import '@testing-library/jest-dom'

// Next.js does NOT load .env.local while running tests, and the real Supabase client
// throws when it is created without a URL and key. The unit tests never reach the
// network, so dummy values are enough. In GitHub Actions the real secrets are used.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= 'test-publishable-key'