import { createRef, createBook, createTask } from '../actions'
import { categoryLabels, docTypeLabels, statusLabels, bookTypeLabels, stageLabels, difficultyLabels } from '@/lib/labels'

const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300'
const labelClass = 'text-xs font-medium text-gray-500 mb-1 block'

export default function AdminAddPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-10 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Добавить материалы</h1>

      {/* НПА */}
      <section className="bg-surface rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Новый НПА</h2>
        <form action={createRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Название</label>
            <input name="title" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Аббревиатура</label>
            <input name="abbr" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Год</label>
            <input name="year" type="number" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Тип документа</label>
            <select name="doc_type" required className={inputClass}>
              {Object.entries(docTypeLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Статус</label>
            <select name="status" required className={inputClass}>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Категория</label>
            <select name="category" required className={inputClass}>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ссылка (https://...)</label>
            <input name="official_url" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
              Добавить НПА
            </button>
          </div>
        </form>
      </section>

      {/* Книга */}
      <section className="bg-surface rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Новая книга</h2>
        <form action={createBook} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Название</label>
            <input name="title" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Автор</label>
            <input name="author" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Год</label>
            <input name="year" type="number" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Издательство</label>
            <input name="publisher" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Тип</label>
            <select name="type" required className={inputClass}>
              {Object.entries(bookTypeLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Категория</label>
            <select name="category" required className={inputClass}>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ссылка на PDF</label>
            <input name="pdf_url" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ссылка на обложку</label>
            <input name="cover_url" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
              Добавить книгу
            </button>
          </div>
        </form>
      </section>

      {/* Задача */}
      <section className="bg-surface rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Новая олимпиадная задача</h2>
        <form action={createTask} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Название</label>
            <input name="title" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Краткое описание (превью)</label>
            <input name="preview" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Полный текст задачи</label>
            <textarea name="full_text" required rows={5} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Год</label>
            <input name="year" type="number" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Этап</label>
            <select name="stage" required className={inputClass}>
              {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Сложность</label>
            <select name="difficulty" required className={inputClass}>
              {Object.entries(difficultyLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Категория</label>
            <select name="category" required className={inputClass}>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
              Добавить задачу
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
