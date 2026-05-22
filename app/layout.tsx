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
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏳</text></svg>',
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

