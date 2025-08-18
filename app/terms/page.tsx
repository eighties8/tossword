import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for using Tossword.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="mb-4">Welcome to Tossword. By using this site, you agree to these terms.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the service responsibly and lawfully.</li>
          <li>Content is provided as-is without warranties.</li>
          <li>We may update these terms from time to time.</li>
        </ul>
        <nav className="mt-8 space-x-4">
          <Link className="text-blue-600 underline" href="/privacy">Privacy Policy</Link>
          <Link className="text-blue-600 underline" href="/cookies">Cookie Policy</Link>
          <Link className="text-blue-600 underline" href="/contact">Contact</Link>
        </nav>
      </section>
    </main>
  )
}


