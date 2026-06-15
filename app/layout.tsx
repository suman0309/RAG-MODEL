import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DSA Expert — RAG Assistant',
  description: 'Ask anything about Data Structures and Algorithms',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
