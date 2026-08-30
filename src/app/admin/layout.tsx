import Link from 'next/link'
import { isAdmin } from '@/lib/admin-auth'
import AdminLoginForm from '@/components/AdminLoginForm'
import LogoutButton from '@/components/LogoutButton'

const tabs = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/requests', label: 'Заявки на доступ' },
  { href: '/admin/homework', label: 'Домашние задания' },
  { href: '/admin/tasks', label: 'Задачи' },
  { href: '/admin/videos', label: 'Видео' },
  { href: '/admin/books', label: 'Книги' },
  { href: '/admin/announcements', label: 'Объявления' },
  { href: '/admin/add', label: 'Добавить материалы' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) {
    return <AdminLoginForm />
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-surface border text-gray-600 hover:bg-gray-100"
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
