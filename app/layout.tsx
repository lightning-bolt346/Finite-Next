import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ThemeProvider from '../components/ThemeProvider'
import MiniSoundPlayer from '../components/sound/MiniSoundPlayer'
import { TaskProvider } from '../lib/contexts/TaskContext'
import { AudioProvider } from '../lib/contexts/AudioContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Finite',
  description: 'A thoughtful command center for your life',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="ringGrad" cx="50%" cy="50%" r="50%" fx="32%" fy="28%"><stop offset="0%" stop-color="%23ffffff" /><stop offset="25%" stop-color="%23a78bfa" /><stop offset="72%" stop-color="%231a1a1a" /><stop offset="100%" stop-color="%231a1a1a" /></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23ringGrad)" /><circle cx="50" cy="50" r="28" fill="%23050505" fill-opacity="0.85" /></svg>',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-text bg-bg transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          <TaskProvider>
            <AudioProvider>
              {children}
              <MiniSoundPlayer />
            </AudioProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

