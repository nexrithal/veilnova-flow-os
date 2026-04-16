import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { ThemeLocaleProvider } from '@/components/app/theme-locale-provider'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'FlowOS — Task & Idea Management',
  description: 'Personal task and idea management system for engineers. Structured workflow with scoring, WIP limits, and review cycles.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        <ThemeLocaleProvider>
          {children}
        </ThemeLocaleProvider>
      </body>
    </html>
  )
}
