'use client'

import { useEffect, useState } from 'react'
import { Heart, Folder, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Кнопка "В избранное" на карточках НПА / книг / задач / ДЗ.
// При первом сохранении открывается окошко выбора папки: можно нажать
// на существующую папку (сохранит сразу туда) или ввести имя новой
// папки и создать её на лету. Повторный клик по уже сохранённому
// пункту просто убирает его из избранного.

export default function FavoriteButton({
  itemType,
  itemId,
  className = '',
}: {
  itemType: 'ref' | 'book' | 'task' | 'homework'
  itemId: string
  className?: string
}) {
  const [supabase] = useState(() => createClient())
  const [userId, setUserId] = useState<string | null>(null)
  const [favoriteRowId, setFavoriteRowId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setReady(true)
        return
      }
      setUserId(user.id)
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .maybeSingle()
      if (error) console.error('Ошибка проверки избранного:', error)
      setFavoriteRowId(data?.id ?? null)
      setReady(true)
    }
    check()
  }, [itemType, itemId])

  const openPicker = async () => {
    setErrorMsg('')
    if (!userId) {
      alert('Войдите, чтобы сохранять в избранное — кнопка «Войти» в шапке сайта')
      return
    }
    const { data, error } = await supabase.from('folders').select('id, name').order('created_at')
    if (error) {
      console.error('Ошибка загрузки папок:', error)
      setErrorMsg('Не удалось загрузить папки: ' + error.message)
    }
    setFolders(data ?? [])
    setPickerOpen(true)
  }

  const saveToFolder = async (folderId: string | null) => {
    if (!userId) return
    setLoading(true)
    setErrorMsg('')
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, item_type: itemType, item_id: itemId, folder_id: folderId })
      .select('id')
      .single()

    if (error) {
      console.error('Ошибка сохранения в избранное:', error)
      setErrorMsg('Не удалось сохранить: ' + error.message)
      setLoading(false)
      return
    }

    setFavoriteRowId(data?.id ?? null)
    setLoading(false)
    setPickerOpen(false)
    setNewFolderName('')
  }

  const createFolderAndSave = async () => {
    if (!newFolderName.trim() || !userId) return
    setLoading(true)
    setErrorMsg('')
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({ user_id: userId, name: newFolderName.trim() })
      .select('id')
      .single()

    if (error || !folder) {
      console.error('Ошибка создания папки:', error)
      setErrorMsg('Не удалось создать папку: ' + (error?.message ?? ''))
      setLoading(false)
      return
    }
    await saveToFolder(folder.id)
  }

  const removeFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!favoriteRowId) return
    setLoading(true)
    const { error } = await supabase.from('favorites').delete().eq('id', favoriteRowId)
    if (error) {
      console.error('Ошибка удаления из избранного:', error)
      setErrorMsg('Не удалось убрать из избранного: ' + error.message)
    } else {
      setFavoriteRowId(null)
    }
    setLoading(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (favoriteRowId) {
      removeFavorite(e)
    } else {
      openPicker()
    }
  }

  if (!ready) return <div className={`w-8 h-8 ${className}`} />

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={favoriteRowId ? 'Убрать из избранного' : 'Добавить в избранное'}
        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 shrink-0 disabled:opacity-50 ${className}`}
      >
        <Heart
          className={`w-[18px] h-[18px] transition-colors ${
            favoriteRowId ? 'fill-primary-600 text-primary-600' : 'text-gray-400'
          }`}
        />
      </button>

      {pickerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-surface rounded-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Сохранить в папку</h3>
              <button onClick={() => setPickerOpen(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {folders.length > 0 && (
              <div className="space-y-1 mb-4 max-h-52 overflow-y-auto">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => saveToFolder(folder.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolderAndSave()}
                placeholder="Новая папка..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={createFolderAndSave}
                disabled={loading || !newFolderName.trim()}
                className="btn-gradient text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" /> Создать
              </button>
            </div>

            {errorMsg && <p className="text-sm text-red-600 mt-3">{errorMsg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
