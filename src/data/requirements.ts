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
  // 세부 영역 전체 목록 (아직 듣지 않은 영역 표시용)
  areaOptions?: string[]
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

// 자유선택 과정 선택지 (부·복수전공·교직을 하지 않으면 전공심화로 간주)
export interface FreeTrackOption {
  name: string
  credits: number
  detail: string
}

// 세부 영역 선택지. 여기 있는 영역(공통교양, 핵심교양)만 세부 영역을 입력한다.
export const AREA_OPTIONS: Partial<Record<Category, string[]>> = {
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
}

export const REQUIREMENTS = {
  title: '2025학번 AI융합학부',
  source: '2025학년도 졸업가이드(2026.1.)',
  totalCredits: 130,
  minGpa: 2.0,
  minSemesters: 8,

  groups: [
    {
      name: '전공',
      items: [
        {
          label: '핵심전공',
          categories: ['핵심전공'],
          credits: 27,
          note: '전공 1·2영역',
        },
        {
          label: '심화전공',
          categories: ['심화전공'],
          credits: 21,
          note: '전공 3·4영역',
        },
      ],
    },
    {
      name: '교양',
      items: [
        { label: '공통교양', categories: ['공통교양'], credits: 15 },
        {
          label: '핵심교양',
          categories: ['핵심교양'],
          credits: 15,
          minAreas: 4,
          areaOptions: AREA_OPTIONS.핵심교양,
        },
        {
          label: '진로소양',
          categories: ['진로소양'],
          credits: 3,
          note: '전공별 진로탐색 1 + 도전과 실천 2',
        },
      ],
    },
  ] satisfies RequirementGroup[],

  // 자유선택 과정: 아직 정하지 않음 (정하면 이 값을 바꾸고 groups에 반영)
  freeTrack: null as string | null,
  freeTrackOptions: [
    { name: '전공심화', credits: 24, detail: '핵심 12 + 심화 12' },
    { name: '부전공', credits: 21, detail: '해당 학과 전공과목' },
    { name: '복수전공', credits: 42, detail: '핵심 24 + 심화 18' },
  ] satisfies FreeTrackOption[],

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
