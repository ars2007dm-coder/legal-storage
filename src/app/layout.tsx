import type { Metadata } from 'next'
import { Fraunces } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import Header from '@/components/Header'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
})

export const metadata: Metadata = {
  title: 'ФСМО lite',
  description: 'Умное хранилище материалов для подготовки к олимпиадам по праву',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasHomeworkAccess = !!cookies().get('fsmo_student_phone')?.value

  return (
    <html lang="ru" className={fraunces.variable}>
      <head>
        {/* Clash Display — основной шрифт сайта (Fontshare CDN) */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
        />
      </head>
      <body className="bg-background text-white">
        <Header hasHomeworkAccess={hasHomeworkAccess} />
        <main>{children}</main>
      </body>
    </html>
  )
}
