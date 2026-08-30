export type DocType = 'code' | 'law' | 'decree' | 'order' | 'regulation'
export type RefStatus = 'active' | 'inactive' | 'draft'
export type Category =
  | 'constitutional'
  | 'civil'
  | 'criminal'
  | 'admin'
  | 'process'
  | 'tax'
  | 'labor'
  | 'family'
  | 'land'
  | 'business'
export type Stage = 'school' | 'municipal' | 'regional' | 'final'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type BookType = 'textbook' | 'commentary' | 'casebook' | 'monograph' | 'article'

export interface Ref {
  id: string
  doc_type: DocType
  title: string
  abbr: string | null
  status: RefStatus
  official_url: string
  category: Category
  year: number | null
}

export interface Task {
  id: string
  title: string
  preview: string
  full_text: string
  year: number | null
  stage: Stage
  difficulty: Difficulty
  category: Category
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  year: number | null
  publisher: string | null
  pdf_url: string | null
  cover_url: string | null
  type: BookType
  created_at: string
}

export interface Video {
  id: string
  title: string
  video_url: string
  task_id: string | null
  teacher_name: string | null
  duration: number | null
}

export interface TaskRef {
  task_id: string
  ref_id: string
  quote: string | null
  pages: string | null
}

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  grade: string | null
  phone: string | null
  created_at: string
}

export interface FolderRow {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface FavoriteRow {
  id: string
  user_id: string
  folder_id: string | null
  item_type: 'ref' | 'book' | 'task'
  item_id: string
  created_at: string
}
