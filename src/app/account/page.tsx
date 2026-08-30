'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const CLASS_OPTIONS = ['9', '10', '11'];

export default function AccountPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [studentClass, setStudentClass] = useState('9');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, student_class, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name ?? '');
        setStudentClass(profile.student_class ?? '9');
        setAvatarUrl(profile.avatar_url ?? null);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setMessage('');

    let newAvatarUrl = avatarUrl;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true });

      if (uploadError) {
        setMessage('Ошибка загрузки аватарки: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      newAvatarUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, student_class: studentClass, avatar_url: newAvatarUrl })
      .eq('id', userId);

    if (error) {
      setMessage('Ошибка сохранения: ' + error.message);
    } else {
      setAvatarUrl(newAvatarUrl);
      setMessage('Сохранено!');
    }
    setSaving(false);
  }

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-accent italic mb-6">Личный кабинет</h1>

      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-surface mb-3 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-500 text-sm text-center px-2">Нет фото</span>
          )}
        </div>
        <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
      </div>

      <label className="block mb-2 text-sm">ФИО</label>
      <input
        className="w-full mb-4 p-2 rounded bg-surface"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Иванов Иван Иванович"
      />

      <label className="block mb-2 text-sm">Класс</label>
      <select
        className="w-full mb-6 p-2 rounded bg-surface"
        value={studentClass}
        onChange={(e) => setStudentClass(e.target.value)}
      >
        {CLASS_OPTIONS.map((c) => (
          <option key={c} value={c}>{c} класс</option>
        ))}
      </select>

      <button onClick={handleSave} disabled={saving} className="btn-gradient w-full py-2 rounded">
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
