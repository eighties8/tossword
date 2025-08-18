import type { Metadata } from 'next'
import TosswordGame from '@/components/TosswordGame'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
}

export default function Page() {
  return <TosswordGame />
}

 
