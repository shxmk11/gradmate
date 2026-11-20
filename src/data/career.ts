// 진로 관리 데이터 (참고용)
// 과목·트랙·개설 시기: AI융합학부 홈페이지 「2026년도 교육과정 로드맵 (AI전공)」, 「트랙별 교육과정」,
// 타 학과 과목: 각 학과 홈페이지 「학년별 교육과정」(2026)
// 직무·역량 연결은 공식 자료가 아니라 일반적인 기준으로 만든 참고용이에요.

export const SKILLS = [
  { id: 'prog', name: '프로그래밍 기초 (Python)' },
  { id: 'sysprog', name: '시스템·객체지향 프로그래밍 (C++, Java)' },
  { id: 'dsa', name: '자료구조·알고리즘' },
  { id: 'math', name: '수학·통계' },
  { id: 'ml', name: '머신러닝' },
  { id: 'dl', name: '딥러닝' },
  { id: 'cv', name: '컴퓨터비전·그래픽스' },
  { id: 'nlp', name: '자연어처리·생성형 AI' },
  { id: 'data', name: '데이터베이스·데이터 분석' },
  { id: 'infra', name: '클라우드·컴퓨터 시스템' },
  { id: 'service', name: '서비스 기획·앱 개발' },
  { id: 'project', name: '프로젝트·협업' },
  { id: 'iot', name: 'IoT·임베디드·하드웨어' },
] as const

export type SkillId = (typeof SKILLS)[number]['id']

export const skillName = (id: SkillId) =>
  SKILLS.find((s) => s.id === id)?.name ?? id

export interface CareerCourse {
  name: string
  /** 교양필수, 1~4영역, 트랙 과목, 타 학과 */
  group: string
  /** 권장 학년 (없으면 null) */
  year: number | null
  /** 개설 학기 */
  term: '1학기' | '2학기' | '매학기' | null
  skills: SkillId[]
  /** 타 학과 과목이면 학과명 */
  dept?: string
}

const c = (
  group: string,
  name: string,
  year: number | null,
  term: CareerCourse['term'],
  skills: SkillId[],
  dept?: string,
): CareerCourse => ({ group, name, year, term, skills, dept })

export const COURSES: CareerCourse[] = [
  c('교양필수', '파이썬 프로그래밍', 1, '1학기', ['prog']),
  c('교양필수', '기초통계학', 1, '1학기', ['math', 'data']),
  c('교양필수', '미적분과 벡터해석 기초', 1, '2학기', ['math']),
  c('1영역', 'AI융합개론', 1, '1학기', ['ml']),
  c('1영역', '이산수학', 1, '1학기', ['math', 'dsa']),
  c('1영역', '인공지능수학', 1, '2학기', ['math', 'ml']),
  c('1영역', 'C++프로그래밍', 1, '2학기', ['sysprog']),
  c('1영역', 'IT개론', 1, '매학기', ['infra']),
  c('2영역', 'AI서비스설계', 2, '1학기', ['service', 'project']),
  c('2영역', '고급파이썬프로그래밍', 2, '1학기', ['prog']),
  c('2영역', '인공지능', 2, '1학기', ['ml']),
  c('2영역', '고급C++프로그래밍', 2, '1학기', ['sysprog']),
  c('2영역', '자료구조', 2, '1학기', ['dsa']),
  c('2영역', '자바프로그래밍', 2, '1학기', ['sysprog']),
  c('2영역', '컴퓨터구조', 2, '1학기', ['infra']),
  c('2영역', '컴퓨터그래픽스', 2, '2학기', ['cv']),
  c('2영역', '모바일프로그래밍', 2, '2학기', ['service']),
  c('2영역', '자료구조실습', 2, '2학기', ['dsa']),
  c('2영역', '기계학습', 2, '2학기', ['ml']),
  c('2영역', '데이터베이스', 2, '2학기', ['data']),
  c('2영역', 'IoT네트워크', null, null, ['infra']),
  c('3영역', '추천시스템', 3, '1학기', ['ml', 'data']),
  c('3영역', '클라우드컴퓨팅AI', 3, '1학기', ['infra']),
  c('3영역', '심층학습', 3, '1학기', ['dl']),
  c('3영역', '디지털신호처리', 3, '1학기', ['cv', 'math']),
  c('3영역', '고급기계학습', 3, '1학기', ['ml']),
  c('3영역', '알고리즘', 3, '1학기', ['dsa']),
  c('3영역', '컴퓨터비전', 3, '2학기', ['cv', 'dl']),
  c('3영역', '자연어처리', 3, '2학기', ['nlp', 'dl']),
  c('3영역', '심층학습프로젝트', 3, '2학기', ['dl', 'project']),
  c('3영역', '강화학습', 3, '2학기', ['ml']),
  c('3영역', '빅데이터분석', 3, '2학기', ['data']),
  c('4영역', '자율이동체 시스템', 4, '1학기', ['cv', 'infra']),
  c('4영역', '지능형게임', 4, '1학기', ['ml', 'project']),
  c('4영역', '캡스톤디자인', 4, '1학기', ['project']),
  c('4영역', '생성형AI프로젝트', 4, '2학기', ['nlp', 'project']),
  c('4영역', '융합캡스톤디자인', 4, '2학기', ['project', 'service']),
  c('4영역', '취업 및 창업 특강', 4, '2학기', []),
  c('트랙 과목', '소프트웨어융합기술개론', 1, '1학기', ['service']),
  c('트랙 과목', 'IoT와 전자공학개론', 1, '2학기', ['iot']),
  c('트랙 과목', 'IoT창의공학설계', 2, '1학기', ['iot', 'project']),
  c('트랙 과목', '마이크로컨트롤러응용실습', 2, '2학기', ['iot', 'sysprog']),
  c('트랙 과목', '디지털회로 및 실습', 2, '2학기', ['iot']),
  c('트랙 과목', '컴퓨터네트워크', 2, '2학기', ['infra']),
  c('트랙 과목', 'IoT서비스설계', 3, '1학기', ['iot', 'service']),
  c('트랙 과목', '모빌리티서비스', 3, '2학기', ['iot', 'service']),
  c('트랙 과목', '메타버스의 이해', 4, '1학기', ['service']),
  c('트랙 과목', 'IoT커넥티비티', 4, '2학기', ['iot', 'infra']),
]

export interface Job {
  id: string
  name: string
  work: string
  core: SkillId[]
  nice: SkillId[]
  /** 잘 맞는 자유선택 과정 */
  freeTrack: string
  tips: string
  /** 이 직무에 특히 중요한 과목 (역량을 이미 갖췄어도 추천) */
  keyCourses: string[]
}

export const JOBS: Job[] = [
  {
    id: 'cv',
    name: '컴퓨터비전 엔지니어',
    work: '이미지·영상 인식 모델 개발, 영상 처리',
    core: ['prog', 'math', 'dl', 'cv'],
    nice: ['sysprog', 'infra'],
    freeTrack: '전공심화 (AI영상서비스 창업 트랙 과목), AI영상제작 융합연계전공',
    tips: '객체 탐지·분할 같은 비전 프로젝트를 직접 만들어 보면 좋아요.',
    keyCourses: ['컴퓨터비전', '디지털신호처리'],
  },
  {
    id: 'robot',
    name: '로보틱스 엔지니어',
    work: '로봇·자율이동체 인지·제어 시스템 개발',
    core: ['sysprog', 'cv', 'iot', 'math'],
    nice: ['dl', 'ml'],
    freeTrack: '전공심화 (자율이동체 시스템, 커넥티드시스템 트랙)',
    tips: 'ROS나 소형 자율주행 키트로 만든 프로젝트가 있으면 좋아요.',
    keyCourses: ['자율이동체 시스템', '마이크로컨트롤러응용실습'],
  },
  {
    id: 'iot',
    name: 'IoT·임베디드 개발자',
    work: '스마트 기기·센서 시스템 개발, IoT 서비스 연동',
    core: ['prog', 'sysprog', 'iot', 'infra'],
    nice: ['data', 'ml'],
    freeTrack: '전공심화 (커넥티드시스템 트랙), 학부 내 지능형IoT전공 부·복수전공',
    tips: '아두이노·라즈베리파이로 직접 만든 기기 프로젝트가 있으면 좋아요.',
    keyCourses: ['IoT창의공학설계', 'IoT커넥티비티'],
  },
  {
    id: 'pm',
    name: 'AI 서비스 기획자',
    work: 'AI 기능 기획, 요구사항 정의, 개발팀 협업',
    core: ['service', 'ml', 'data', 'project'],
    nice: ['prog'],
    freeTrack: '서비스디자인공학과 부·복수전공, AI영상제작 융합연계전공',
    tips: '서비스 기획서와 프로토타입을 포트폴리오로 준비하면 좋아요.',
    keyCourses: ['AI서비스설계', '융합캡스톤디자인'],
  },
  {
    id: 'app',
    name: '프론트엔드·앱 개발자',
    work: '웹·모바일 화면 개발, 사용자 경험 개선',
    core: ['prog', 'service', 'project', 'dsa'],
    nice: ['sysprog', 'data'],
    freeTrack: '서비스디자인공학과 부·복수전공, 컴퓨터공학과 부전공',
    tips: '실제로 쓸 수 있는 웹·앱을 만들어 배포해 보면 좋아요.',
    keyCourses: ['모바일프로그래밍'],
  },
  {
    id: 'game',
    name: '게임 클라이언트 개발자',
    work: '게임 화면·그래픽 구현, 게임 AI, 엔진(Unity·Unreal) 개발',
    core: ['sysprog', 'math', 'dsa', 'cv'],
    nice: ['ml', 'project'],
    freeTrack: '전공심화 (컴퓨터그래픽스·지능형게임, AI영상서비스 창업 트랙), 컴퓨터공학과 부전공',
    tips: 'Unity나 Unreal로 만든 게임을 포트폴리오로 준비하고, 게임잼에 나가 보면 좋아요. C++·C# 실력이 중요해요.',
    keyCourses: ['컴퓨터그래픽스', '지능형게임', '알고리즘'],
  },
]

export interface TrackGroup {
  label: string
  courses: string[]
  /** 이 중 몇 과목 (없으면 전부) */
  pick?: number
}

export interface Track {
  name: string
  credits: string
  groups: TrackGroup[]
  jobs: string[]
}

const STARTUP = ['스타트업 캡스톤디자인', '스타트업과 진로탐색', '스타트업 트렌드', '창업실습']

export const TRACKS: Track[] = [
  {
    name: '인공지능시스템',
    credits: '8과목 24학점',
    groups: [
      {
        label: '전공',
        courses: ['고급파이썬프로그래밍', '인공지능', '기계학습', '심층학습', '강화학습', '지능형게임', '자율이동체 시스템', '생성형AI프로젝트'],
      },
    ],
    jobs: ['robot'],
  },
  {
    name: '커넥티드시스템',
    credits: '8과목 24학점',
    groups: [
      {
        label: '전공',
        courses: ['기초통계학', 'IoT와 전자공학개론', 'IoT창의공학설계', '마이크로컨트롤러응용실습', 'IoT서비스설계', '모빌리티서비스', '메타버스의 이해', 'IoT커넥티비티'],
      },
    ],
    jobs: ['iot', 'robot'],
  },
  {
    name: 'AI영상서비스 창업',
    credits: '전공 18 + 교양 3학점',
    groups: [
      {
        label: '전공',
        pick: 6,
        courses: ['기계학습', '컴퓨터그래픽스', '심층학습', '디지털신호처리', '컴퓨터비전', '지능형게임', '생성형AI프로젝트', '캡스톤디자인'],
      },
      { label: '교양', pick: 1, courses: STARTUP },
    ],
    jobs: ['cv', 'game'],
  },
  {
    name: 'IoT플랫폼 서비스 기술창업',
    credits: '전공 18 + 교양 3학점',
    groups: [
      {
        label: '전공',
        pick: 6,
        courses: ['IT개론', '이산수학', '소프트웨어융합기술개론', '컴퓨터네트워크', '디지털회로 및 실습', '마이크로컨트롤러응용실습', '클라우드컴퓨팅AI', '모빌리티서비스', '빅데이터분석', 'IoT커넥티비티', '융합캡스톤디자인', '메타버스의 이해'],
      },
      { label: '교양', pick: 1, courses: STARTUP },
    ],
    jobs: ['iot', 'pm'],
  },
]

/** 2027-1학기 부·복수전공 선발 (선발 안내·여석표, 2026.11) */
export const MAJOR_SELECTION = {
  title: '2027학년도 1학기 부·복수전공 선발',
  period: '2026.12.11.(금) 10:00 ~ 12.31.(목) 17:00',
  announce: '2027.1.29.(금) 발표 예정',
  rule: '2026-2학기 성적까지 반영한 성적순 선발 (동점이면 취득 학점 많은 순). 부전공과 복수전공은 통합 선발.',
  how: '성신포탈 → 통합정보 → 학적관리 → 부복수신청',
  seats2025: [
    { name: '컴퓨터공학과', seats: 6 },
    { name: '서비스디자인공학과', seats: 1 },
    { name: '융합보안공학과', seats: 0 },
    { name: '수리통계 · 통계학', seats: 19 },
    { name: '수리통계 · 빅데이터사이언스', seats: 11 },
    { name: '수리통계 · 수학', seats: 31 },
    { name: '수리통계 · 핀테크', seats: 20 },
  ],
}
