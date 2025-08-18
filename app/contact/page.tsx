import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Tossword — questions, feedback, and support.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Contact</h1>
        <p className="mb-4">
          Reach us by email at{' '}
          <a className="text-blue-600 underline" href="mailto:support@tossword.app">support@tossword.app</a>.
        </p>
        <p className="mb-4">We welcome feedback, bug reports, and ideas for new features.</p>
        <nav className="mt-8 space-x-4">
          <Link className="text-blue-600 underline" href="/about">About</Link>
          <Link className="text-blue-600 underline" href="/privacy">Privacy</Link>
          <Link className="text-blue-600 underline" href="/terms">Terms</Link>
        </nav>
      </section>
    </main>
  )
}


