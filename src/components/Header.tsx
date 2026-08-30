'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookOpen, Search, Heart, Menu, X, ClipboardCheck, User, LogOut } from 'lucide-react'
import AuthModal from './AuthModal'
import { createClient } from '@/lib/supabase/client'

const baseNavItems = [
  { href: '/npa', label: 'НПА' },
  { href: '/books', label: 'Литература' },
  { href: '/tasks', label: 'Задачи' },
]

export default function Header({ hasHomeworkAccess = false }: { hasHomeworkAccess?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const pathname = usePathname()
  const router = useRouter()

  // Следим за состоянием входа (Supabase Auth) — чтобы показывать
  // "Кабинет" вместо "Войти", когда ученик уже авторизован по телефону
  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)

      if (session) {
        // maybeSingle — если строки в profiles ещё нет (старый
        // аккаунт), просто вернёт null вместо ошибки 406
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .maybeSingle()
        if (error) console.error('Ошибка загрузки аватарки:', error)
        setAvatarUrl(profile?.avatar_url ?? null)
      }
    }
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      if (!session) setAvatarUrl(null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
  }

  // "ДЗ" добавляется в меню только если доступ подтверждён
  const navItems = hasHomeworkAccess
    ? [...baseNavItems, { href: '/homework', label: 'ДЗ' }]
    : baseNavItems

  return (
    <>
      <header className="h-16 bg-surface border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 shrink-0">
            <BookOpen className="w-6 h-6 text-primary-600" />
            ФСМО lite
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  pathname?.startsWith(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.href === '/homework' && <ClipboardCheck className="w-3.5 h-3.5" />}
                {item.label}
              </Link>
            ))}
            {!hasHomeworkAccess && (
              <Link
                href="/join"
                className="text-sm font-medium px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-600"
              >
                Доступ к ДЗ
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/search" className="text-gray-500 hover:text-primary-600" aria-label="Поиск">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/favorites" className="text-gray-500 hover:text-primary-600" aria-label="Избранное">
              <Heart className="w-5 h-5" />
            </Link>

            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 px-2 py-1.5 rounded-lg"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </span>
                  )}
                  Кабинет
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Выйти"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden sm:block btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Войти
              </button>
            )}

            <button
              className="md:hidden text-gray-500"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Меню"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-surface border-t px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 px-2 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {item.label}
              </Link>
            ))}
            {!hasHomeworkAccess && (
              <Link href="/join" onClick={() => setMenuOpen(false)} className="py-2 px-2 text-gray-400">
                Доступ к ДЗ
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 px-2 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Кабинет
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-2 text-sm text-gray-400 text-left px-2"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthOpen(true)
                  setMenuOpen(false)
                }}
                className="mt-2 btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Войти
              </button>
            )}
          </div>
        )}
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
