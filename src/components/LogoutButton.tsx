'use client'

export default function LogoutButton() {
  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/'
  }
  return (
    <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">
      Выйти из админки
    </button>
  )
}
