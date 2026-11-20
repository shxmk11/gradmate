import type { Category } from '../db/database'

// 졸업 요건 데이터
// 출처: 2025학년도 졸업가이드(2026.1.), 교무처 학사운영팀
// 학번·과정이 바뀌거나 요건이 개정되면 이 파일만 수정한다.

export interface CreditRequirement {
  label: string
  categories: Category[]
  credits: number
  note?: string
  // 이수해야 하는 최소 세부 영역 수 (예: 핵심교양 4개 영역)
  minAreas?: number
}

export interface RequiredCourse {
  name: string
  category: Category
  note: string
}

export interface RequirementGroup {
  name: string
  items: CreditRequirement[]
}

export const REQUIREMENTS = {
  title: '2025학번 AI융합학부 · 전공심화과정',
  source: '2025학년도 졸업가이드(2026.1.)',
  totalCredits: 130,
  minGpa: 2.0,
  minSemesters: 8,

  groups: [
    {
      name: '교양',
      items: [
        { label: '공통교양', categories: ['공통교양'], credits: 15 },
        {
          label: '핵심교양',
          categories: ['핵심교양'],
          credits: 15,
          minAreas: 4,
        },
        {
          label: '진로소양',
          categories: ['진로소양'],
          credits: 3,
          note: '전공별 진로탐색 1 + 도전과 실천 2',
        },
      ],
    },
    {
      // 전공(핵심 27, 심화 21) + 전공심화(핵심 12, 심화 12)
      name: '전공',
      items: [
        {
          label: '핵심전공',
          categories: ['핵심전공'],
          credits: 39,
          note: '전공 27 + 전공심화 12 · 전공 1·2영역',
        },
        {
          label: '심화전공',
          categories: ['심화전공'],
          credits: 33,
          note: '전공 21 + 전공심화 12 · 전공 3·4영역',
        },
      ],
    },
  ] satisfies RequirementGroup[],

  // 기초필수, 학과 지정 필수(수학·통계·IT계열), 진로소양 필수
  requiredCourses: [
    { name: '비판적 사고와 토론', category: '공통교양', note: '기초필수' },
    { name: '창조적 사고와 글쓰기', category: '공통교양', note: '기초필수' },
    { name: '파이썬 프로그래밍', category: '공통교양', note: '학과 지정 · SW문해' },
    { name: '기초통계학', category: '공통교양', note: '학과 지정 · 경험적·수리적 추리' },
    {
      name: '미적분과 벡터해석 기초',
      category: '공통교양',
      note: '학과 지정 · 경험적·수리적 추리',
    },
    { name: '전공별 진로 탐색', category: '진로소양', note: '진로소양 필수' },
  ] satisfies RequiredCourse[],

  otherRules: [
    '전 학년 평점평균 2.0 이상',
    '8학기 이상 등록',
    '졸업논문: AI융합학부 미시행',
    '학과별 외국어인증제: 폐지 (2024.5.3.)',
  ],
}

// 세부 영역 입력 시 제안 목록
export const AREA_SUGGESTIONS: Partial<Record<Category, string[]>> = {
  공통교양: [
    '기초필수',
    'SW문해',
    '영어',
    '제2외국어',
    '경험적·수리적 추리',
    '창의예술',
  ],
  핵심교양: [
    '인식과 가치',
    '문학과 예술',
    '역사의 해석',
    '사회의 이해',
    '자연의 설명',
    '공학과 기술',
  ],
  진로소양: ['도전과 실천'],
  핵심전공: ['1영역', '2영역'],
  심화전공: ['3영역', '4영역'],
}
