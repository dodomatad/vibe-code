import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vibe Code - Transparent AI Code Generation',
  description: 'AI-powered code generation with transparent pricing. Never pay for AI errors.',
  keywords: ['AI', 'code generation', 'React', 'Vue', 'Svelte', 'transparent pricing'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
