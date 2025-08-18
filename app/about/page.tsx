import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Tossword',
  description: 'Learn about Tossword — a clean, modern word ladder puzzle game.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">About Tossword</h1>
        <p className="mb-4">
          Tossword is a fast, accessible word ladder puzzle. Change one letter at a time to reach the
          mystery word. Built with Next.js for performance and great UX.
        </p>
        <nav className="mt-8 space-x-4">
          <Link className="text-blue-600 underline" href="/contact">Contact</Link>
          <Link className="text-blue-600 underline" href="/privacy">Privacy</Link>
          <Link className="text-blue-600 underline" href="/terms">Terms</Link>
        </nav>
      </section>
    </main>
  )
}


