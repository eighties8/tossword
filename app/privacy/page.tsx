import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Tossword, including AdSense data use and cookies.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          Your privacy matters. This site uses cookies and similar technologies to provide core
          functionality and, where permitted, to personalize and measure ads via Google AdSense.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Advertising & Cookies</h2>
        <p className="mb-4">
          Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website
          or other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.
        </p>
        <p className="mb-4">
          You may opt out of personalized advertising by visiting Google&apos;s Ads Settings. Alternatively, you can
          opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting
          the <a className="text-blue-600 underline" href="https://youradchoices.com/" target="_blank" rel="noopener noreferrer">NAI opt-out page</a>.
        </p>
        <p className="mb-4">
          Learn more about how Google uses data: {' '}
          <a className="text-blue-600 underline" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            Google Partner Sites Policy
          </a>.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">Your Choices</h2>
        <p className="mb-4">
          You can manage cookies in your browser settings and adjust consent using our cookie policy page.
        </p>
        <nav className="mt-8 space-x-4">
          <Link className="text-blue-600 underline" href="/cookies">Cookie Policy</Link>
          <Link className="text-blue-600 underline" href="/terms">Terms</Link>
          <Link className="text-blue-600 underline" href="/contact">Contact</Link>
        </nav>
      </section>
    </main>
  )
}


