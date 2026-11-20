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

// 자유선택 과정 후보별 상세 (졸업 요건 화면에서 골라 보기)
// 출처: 졸업가이드 2025학번 표·단서, 2027-1 부·복수전공 선발 안내·여석표,
// 각 학과 홈페이지 「학년별 교육과정」(2026). 과목은 IT 쪽 위주로 발췌.
export interface TrackCourseRow {
  label: string
  first: string[]
  second: string[]
}

export interface FreeTrackPlan {
  id: string
  name: string
  kind: string
  credits: number
  detail: string
  rules: string[]
  apply: string[]
  rows: TrackCourseRow[]
  courseNote: string
}

export const FREE_TRACK_PLANS: FreeTrackPlan[] = [
  {
    id: 'ce',
    name: '컴퓨터공학과',
    kind: '복수전공',
    credits: 42,
    detail: '영역 구분 없이 총 42학점',
    rules: [
      '일반 복수전공은 핵심 24 + 심화 18이지만, AI융합학부와 상호 복수전공이라 영역 구분 없이 총계만 채우면 돼요.',
      '컴퓨터공학과는 졸업논문이 없어요 (졸업가이드 「전공별 졸업논문 시행현황」에 없는 학과는 미시행).',
      '복수전공을 하면 전공심화(24학점)는 안 해도 돼요.',
    ],
    apply: [
      '2027-1 선발: 2026.12.11.(금) 10:00 ~ 12.31.(목) 17:00, 발표 2027.1.29.',
      '2025학번 여석 6명 · 성적순 (2026-2학기 성적까지 반영)',
      '부전공과 복수전공은 여석 하나로 함께 선발해요.',
    ],
    rows: [
      {
        label: '1학년',
        first: ['IT개론', '웹프로그래밍기초'],
        second: ['파이썬 활용', 'C++프로그래밍', '이산수학'],
      },
      {
        label: '2학년',
        first: ['자료구조', '컴퓨터구조', '자바프로그래밍', '고급C++프로그래밍', '인공지능', '컴퓨터시스템관리'],
        second: ['고급자료구조', '기계학습', '컴퓨터 네트워크', '데이터베이스', '운영체제'],
      },
      {
        label: '3학년',
        first: ['알고리즘', '시스템프로그래밍', '서버시스템구축실습', '소프트웨어분석및설계', '인공지능응용'],
        second: ['모바일프로그래밍', '소프트웨어공학', '오픈소스소프트웨어', '정보보호', '컴퓨터그래픽스'],
      },
      {
        label: '4학년',
        first: ['캡스톤디자인', '소프트웨어디자인패턴', '분산시스템', '클라우드컴퓨팅'],
        second: ['컴파일러'],
      },
    ],
    courseNote:
      '자료구조, 데이터베이스, 알고리즘처럼 이름이 같은 과목은 IT융합대학 학과끼리 「전공인정」으로 표시돼 있지만, 복수전공 학점으로 인정되는지는 학과에 확인해 주세요.',
  },
  {
    id: 'aiv',
    name: 'AI영상제작',
    kind: '융합연계복수전공',
    credits: 42,
    detail: '부전공으로 하면 21학점',
    rules: [
      '한 학과 전공과목은 15학점, 교양은 12학점까지 인정돼요.',
      '주전공과 9학점까지 중복 인정돼요.',
      '융합연계부전공(21학점)으로 하면 한 학과 9학점, 교양 6학점까지 인정되고 중복 인정은 안 돼요.',
      '졸업논문은 없어요.',
    ],
    apply: [
      '신청: 2학년 1학기 ~ 4학년 1학기, 매 학기 융합연계학부 공지 기간',
      '2026-1부터 학과 부·복수전공과 함께 할 수 있어요.',
      '학위: AI크리에이티브콘텐츠학사',
    ],
    rows: [
      {
        label: 'IT·디자인',
        first: ['AI융합개론', '인공지능', '생성형 인공지능 디자인', '디지털컨텐츠', 'AI융합디자인', '정보설계와 시각화', 'VR 콘텐츠디자인'],
        second: ['미디어스토리텔링 프로덕션', 'AI 영상 제작', '디지털 시네마토그라피'],
      },
    ],
    courseNote:
      'IT 쪽 과목만 발췌했어요. 디자인과, 미디어영상연기학과, 현대실용음악학과 등의 실기 과목도 있으니 융합연계학부 홈페이지에서 전체 목록을 확인해 주세요.',
  },
]

// 컴공 복수전공 + AI영상제작 융합연계부전공 (두 과정을 하나로 합쳐 보여 줌)
const [CE, AIV] = FREE_TRACK_PLANS
const COMBINED_PLAN: FreeTrackPlan = {
  id: 'ce+aivm',
  name: '컴공 복수전공 + AI영상제작 부전공',
  kind: '',
  credits: CE.credits + 21,
  detail: `컴공 ${CE.credits} + 영상 부전공 21`,
  rules: [
    '컴공: AI융합학부와 상호 복수전공이라 영역 구분 없이 총 42학점만 채우면 돼요.',
    '영상 부전공: 21학점. 한 학과 전공과목은 9학점, 교양은 6학점까지 인정되고, 주전공과 중복 인정은 안 돼요.',
    '두 과정 모두 졸업논문이 없어요.',
    '복수전공을 하면 전공심화 24학점은 따로 안 채워도 돼요.',
  ],
  apply: [
    '컴공: 2027-1 선발 2026.12.11.(금) ~ 12.31.(목), 발표 2027.1.29. · 2025학번 여석 6명, 성적순',
    '영상 부전공: 2학년 1학기 ~ 4학년 1학기 중 매 학기 융합연계학부 공지 기간에 신청',
    '2026-1부터 학과 복수전공과 융합연계전공을 함께 할 수 있어요.',
  ],
  rows: [
    ...CE.rows.map((r) => ({ ...r, label: `컴공 ${r.label}` })),
    ...AIV.rows.map((r) => ({ ...r, label: '영상 부전공' })),
  ],
  courseNote:
    '이름이 같은 과목이 복수전공·부전공 학점으로 인정되는지는 각 학과에 확인해 주세요. 영상 부전공은 IT 쪽 과목만 발췌했고, 실기 과목은 융합연계학부 홈페이지에서 확인할 수 있어요.',
}

// 자유선택 과정 경우 (대시보드에서 고르고 모든 탭에 적용)
// 졸업가이드 2025학번 표: 부전공 21, 복수전공 42 (단서 9~11). 전공심화는 안 할 예정이라 뺌
export type TrackId = 'ce' | 'aiv'

export interface FreeTrackCase {
  id: string
  label: string
  /** 들어가는 과정 (진로 관리 추천 과목에 쓰임) */
  tracks: TrackId[]
  plan: FreeTrackPlan
  items: CreditRequirement[]
}

const CE_ITEM: CreditRequirement = {
  label: '복수전공 · 컴퓨터공학과',
  categories: ['복수전공'],
  credits: 42,
  note: 'AI융합학부와 상호 복수전공이라 영역 구분 없이 총계만 채우면 돼요.',
}

export const FREE_TRACK_CASES: FreeTrackCase[] = [
  { id: 'ce', label: '컴공 복수전공', tracks: ['ce'], plan: CE, items: [CE_ITEM] },
  {
    id: 'aiv',
    label: 'AI영상제작',
    tracks: ['aiv'],
    plan: AIV,
    items: [
      {
        label: '융합연계복수전공 · AI영상제작',
        categories: ['복수전공'],
        credits: 42,
        note: '영역 구분 없이 42학점',
      },
    ],
  },
  {
    id: 'ce+aivm',
    label: '컴공 + 영상 부전공',
    tracks: ['ce', 'aiv'],
    plan: COMBINED_PLAN,
    items: [
      CE_ITEM,
      {
        label: '융합연계부전공 · AI영상제작',
        categories: ['부전공'],
        credits: 21,
        note: '영역 구분 없이 21학점',
      },
    ],
  },
]

/** 고른 경우 (안 골랐으면 지금 계획인 컴공 + 영상 부전공) */
export const getFreeTrackCase = (id: string | null | undefined) =>
  FREE_TRACK_CASES.find((c) => c.id === id) ?? FREE_TRACK_CASES[2]

/** 교양·전공에 자유선택 과정을 더한 영역 그룹 */
export const requirementGroups = (caseId: string | null | undefined): RequirementGroup[] => [
  ...REQUIREMENTS.groups,
  { name: '자유선택', items: getFreeTrackCase(caseId).items },
]
