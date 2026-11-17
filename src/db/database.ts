
import Dexie, { type Table } from 'dexie'

export interface Grade {
  id?: number
  year: number
  semester: '1학기' | '2학기' | '여름학기' | '겨울학기'
  courseName: string
  credits: number
  grade: string
}

class GradMateDatabase extends Dexie {
  grades!: Table<Grade, number>

  constructor() {
    super('GradMateDB')

    this.version(1).stores({
      grades: '++id, year, semester, courseName',
    })
  }
}

export const db = new GradMateDatabase()
