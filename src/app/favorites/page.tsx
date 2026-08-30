'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Folder, Plus, Trash2, FileText, BookOpen, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FolderRow, FavoriteRow } from '@/types/database'

type EnrichedFavorite = FavoriteRow & { title: string; subtitle: string; href: string }

const typeIcon: Record<string, any> = { ref: FileText, book: BookOpen, task: ClipboardList }
const typeLabel: Record<string, string> = { ref: 'НПА', book: 'Литература', task: 'Задача' }

export default function FavoritesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [favorites, setFavorites] = useState<EnrichedFavorite[]>([])
  const [activeFolder, setActiveFolder] = useState<string | 'all'>('all')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserId(user.id)

    const [{ data: f }, { data: fav }] = await Promise.all([
      supabase.from('folders').select('*').order('created_at'),
      supabase.from('favorites').select('*').order('created_at', { ascending: false }),
    ])

    const foldersData = f ?? []
    const favData = (fav ?? []) as FavoriteRow[]

    // подтягиваем названия материалов по группам, чтобы не делать запрос на каждую запись
    const idsByType: Record<string, string[]> = { ref: [], book: [], task: [] }
    favData.forEach((r) => idsByType[r.item_type]?.push(r.item_id))

    const [refsRes, booksRes, tasksRes] = await Promise.all([
      idsByType.ref.length
        ? supabase.from('refs').select('id, title, abbr').in('id', idsByType.ref)
        : Promise.resolve({ data: [] as any[] }),
      idsByType.book.length
        ? supabase.from('books').select('id, title, author').in('id', idsByType.book)
        : Promise.resolve({ data: [] as any[] }),
      idsByType.task.length
        ? supabase.from('tasks').select('id, title, preview').in('id', idsByType.task)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const refMap = new Map((refsRes.data ?? []).map((r: any) => [r.id, r]))
    const bookMap = new Map((booksRes.data ?? []).map((b: any) => [b.id, b]))
    const taskMap = new Map((tasksRes.data ?? []).map((t: any) => [t.id, t]))

    const enriched: EnrichedFavorite[] = favData.map((row) => {
      if (row.item_type === 'ref') {
        const r = refMap.get(row.item_id)
        return { ...row, title: r?.title ?? 'НПА (удалено)', subtitle: r?.abbr ?? '', href: '/npa' }
      }
      if (row.item_type === 'book') {
        const b = bookMap.get(row.item_id)
        return { ...row, title: b?.title ?? 'Книга (удалена)', subtitle: b?.author ?? '', href: '/books' }
      }
      const t = taskMap.get(row.item_id)
      return { ...row, title: t?.title ?? 'Задача (удалена)', subtitle: t?.preview ?? '', href: `/task/${row.item_id}` }
    })

    setFolders(foldersData)
    setFavorites(enriched)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const createFolder = async () => {
    if (!newName.trim() || !userId) return
    const { data, error } = await supabase
      .from('folders')
      .insert({ name: newName.trim(), user_id: userId })
      .select()
      .single()
    if (!error && data) {
      setFolders([...folders, data])
      setNewName('')
      setCreating(false)
    }
  }

  const deleteFolder = async (id: string) => {
    await supabase.from('folders').delete().eq('id', id)
    setFolders(folders.filter((f) => f.id !== id))
    if (activeFolder === id) setActiveFolder('all')
    load()
  }

  const removeFavorite = async (id: string) => {
    await supabase.from('favorites').delete().eq('id', id)
    setFavorites(favorites.filter((f) => f.id !== id))
  }

  const countInFolder = (folderId: string) => favorites.filter((f) => f.folder_id === folderId).length

  const visibleFavorites =
    activeFolder === 'all' ? favorites : favorites.filter((f) => f.folder_id === activeFolder)

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-gray-400">Загрузка...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-center px-4">
        <Heart className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500">Войдите, чтобы видеть избранное — кнопка «Войти» в шапке сайта</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
        </div>
        <p className="text-gray-500 mb-6">Ваши сохранённые материалы и папки</p>

        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg mb-6"
          >
            <Plus className="w-4 h-4" /> Создать папку
          </button>
        ) : (
          <div className="flex gap-2 mb-6">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              placeholder="Название папки"
              className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button onClick={createFolder} className="btn-gradient text-white px-4 py-2 rounded-lg text-sm font-medium">
              Создать
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} className="text-gray-500 px-3 py-2 text-sm">
              Отмена
            </button>
          </div>
        )}

        {/* Папки */}
        <div className="space-y-2 mb-6">
          <button
            onClick={() => setActiveFolder('all')}
            className={`w-full flex items-center justify-between rounded-xl border p-4 text-left ${
              activeFolder === 'all' ? 'bg-primary-50 border-primary-300' : 'bg-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-gray-900">Всё избранное</span>
            </div>
            <span className="text-sm text-gray-400">{favorites.length}</span>
          </button>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                activeFolder === folder.id ? 'bg-primary-50 border-primary-300' : 'bg-surface'
              }`}
            >
              <button onClick={() => setActiveFolder(folder.id)} className="flex items-center gap-3 flex-1 text-left">
                <Folder className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">{folder.name}</span>
                <span className="text-sm text-gray-400">{countInFolder(folder.id)}</span>
              </button>
              <button onClick={() => deleteFolder(folder.id)} className="text-gray-400 hover:text-red-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Сами материалы */}
        {visibleFavorites.length > 0 ? (
          <div className="space-y-2">
            {visibleFavorites.map((fav) => {
              const Icon = typeIcon[fav.item_type]
              return (
                <div key={fav.id} className="flex items-center gap-3 bg-surface rounded-xl border p-4">
                  <Icon className="w-5 h-5 text-primary-600 shrink-0" />
                  <Link href={fav.href} className="flex-1 min-w-0">
                    <p className="text-xs uppercase text-gray-400 mb-0.5">{typeLabel[fav.item_type]}</p>
                    <p className="font-medium text-gray-900 truncate">{fav.title}</p>
                    {fav.subtitle && <p className="text-sm text-gray-500 truncate">{fav.subtitle}</p>}
                  </Link>
                  <button onClick={() => removeFavorite(fav.id)} className="text-gray-400 hover:text-red-600 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center py-16">
            <Heart className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400">Пока ничего не сохранено</p>
          </div>
        )}
      </div>
    </div>
  )
}
