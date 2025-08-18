import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie policy and how to change your consent on Tossword.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
        <p className="mb-4">
          We use cookies to provide core site functionality, remember preferences, and, with consent,
          for analytics and advertising (including Google AdSense).
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Managing Cookies</h2>
        <p className="mb-4">
          You can adjust your cookie preferences in your browser settings. If a consent banner is available,
          you can revisit it to change your selections at any time.
        </p>
        <nav className="mt-8 space-x-4">
          <Link className="text-blue-600 underline" href="/privacy">Privacy Policy</Link>
          <Link className="text-blue-600 underline" href="/terms">Terms</Link>
          <Link className="text-blue-600 underline" href="/contact">Contact</Link>
        </nav>
      </section>
    </main>
  )
}


