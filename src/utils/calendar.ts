import { ClassGroup, LessonLog, SchoolEvent } from '../types';

export interface AcademicMonthInfo {
  index: number; // 0 to 11
  year: number;
  month: number; // 1 to 12
  label: string; // e.g. "3월", "4월", ... "다음해 2월"
  shortLabel: string; // "3월", "4월"... "2월"
  semester: 1 | 2;
  isNextYear: boolean;
}

/**
 * Returns 12 academic months for the given academic year (March to next Feb)
 */
export function getAcademicMonths(academicYear: number): AcademicMonthInfo[] {
  const months: AcademicMonthInfo[] = [];

  for (let i = 0; i < 12; i++) {
    const monthNum = i < 10 ? i + 3 : i - 9; // 3..12, then 1, 2
    const year = i < 10 ? academicYear : academicYear + 1;
    const isNextYear = i >= 10;
    const semester = (i < 5) ? 1 : 2; // 3~7월 (1학기), 8월~익년2월 (2학기/방학)

    let label = `${monthNum}월`;
    if (isNextYear && monthNum === 1) {
      label = `익년 1월`;
    } else if (isNextYear && monthNum === 2) {
      label = `익년 2월`;
    }

    months.push({
      index: i,
      year,
      month: monthNum,
      label,
      shortLabel: `${monthNum}월`,
      semester,
      isNextYear,
    });
  }

  return months;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  day: number; // 1~31
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number; // 0 (일) to 6 (토)
}

/**
 * Generates the full 35-42 calendar days for a specific year and month
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const daysInMonth = lastDay.getDate();

  // Days from previous month to fill first row
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  const days: CalendarDay[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDay = prevMonthLastDay - i;
    const prevDateObj = new Date(year, month - 2, prevDay);
    const dateStr = formatDateKey(prevDateObj.getFullYear(), prevDateObj.getMonth() + 1, prevDay);
    days.push({
      date: dateStr,
      day: prevDay,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: prevDateObj.getDay() === 0 || prevDateObj.getDay() === 6,
      dayOfWeek: prevDateObj.getDay(),
    });
  }

  // Days in current month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayObj = new Date(year, month - 1, day);
    const dateStr = formatDateKey(year, month, day);
    const dayOfWeek = currentDayObj.getDay();
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // Days from next month to complete grid (multiples of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const nextDateObj = new Date(year, month, day);
    const dateStr = formatDateKey(nextDateObj.getFullYear(), nextDateObj.getMonth() + 1, day);
    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: nextDateObj.getDay() === 0 || nextDateObj.getDay() === 6,
      dayOfWeek: nextDateObj.getDay(),
    });
  }

  return days;
}

export function formatDateKey(year: number, month: number, day: number): string {
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${m}-${d}`;
}

export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  };
}

export const KOREAN_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export function formatKoreanDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = KOREAN_DAY_NAMES[dateObj.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

/**
 * Checks if a date falls within an event or matches a single-day event
 */
export function getEventsForDate(dateStr: string, events: SchoolEvent[]): SchoolEvent[] {
  return events.filter((ev) => {
    if (ev.date === dateStr) return true;
    if (ev.endDate && ev.date <= dateStr && dateStr <= ev.endDate) {
      return true;
    }
    return false;
  });
}

export interface ClassProgressSummary {
  classId: string;
  className: string;
  grade: string;
  color: string;
  bgLight: string;
  borderCol: string;
  targetHours: number;
  completedHours: number;
  plannedHours: number;
  totalScheduledHours: number;
  progressPercent: number; // completed / target * 100
  scheduledPercent: number; // totalScheduled / target * 100
  latestCompletedLesson?: LessonLog;
  nextPlannedLesson?: LessonLog;
  diffFromMaxCompleted: number; // How many lessons behind the leading class
}

/**
 * Calculates progress statistics for each class
 */
export function calculateClassProgress(
  classes: ClassGroup[],
  lessons: LessonLog[]
): {
  summaries: ClassProgressSummary[];
  maxCompleted: number;
  minCompleted: number;
  hasDiscrepancy: boolean;
  totalLessonsCount: number;
} {
  let maxCompleted = 0;
  let minCompleted = Infinity;

  const summaries: ClassProgressSummary[] = classes.map((cls) => {
    const classLessons = lessons.filter((l) => l.classId === cls.id);
    const completed = classLessons.filter((l) => l.status === 'completed');
    const planned = classLessons.filter((l) => l.status === 'planned');

    const completedHours = completed.length;
    const plannedHours = planned.length;
    const totalScheduledHours = classLessons.length;
    const targetHours = cls.targetHours || 64;

    if (completedHours > maxCompleted) maxCompleted = completedHours;
    if (completedHours < minCompleted) minCompleted = completedHours;

    // Sort by date ascending to find latest and next
    const sortedCompleted = [...completed].sort((a, b) => (a.date > b.date ? 1 : -1));
    const sortedPlanned = [...planned].sort((a, b) => (a.date > b.date ? 1 : -1));

    const progressPercent = Math.min(100, Math.round((completedHours / targetHours) * 100));
    const scheduledPercent = Math.min(100, Math.round((totalScheduledHours / targetHours) * 100));

    return {
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      color: cls.color,
      bgLight: cls.bgLight,
      borderCol: cls.borderCol,
      targetHours,
      completedHours,
      plannedHours,
      totalScheduledHours,
      progressPercent,
      scheduledPercent,
      latestCompletedLesson: sortedCompleted[sortedCompleted.length - 1],
      nextPlannedLesson: sortedPlanned[0],
      diffFromMaxCompleted: 0, // calculated below
    };
  });

  if (minCompleted === Infinity) minCompleted = 0;

  // Set difference from the leading class
  summaries.forEach((s) => {
    s.diffFromMaxCompleted = maxCompleted - s.completedHours;
  });

  const hasDiscrepancy = maxCompleted - minCompleted >= 2;

  return {
    summaries,
    maxCompleted,
    minCompleted,
    hasDiscrepancy,
    totalLessonsCount: lessons.length,
  };
}

/**
 * Creates seed lesson logs for the current academic year so the app starts fully populated and rich
 */
export function generateSeedLessons(academicYear: number, classes: ClassGroup[]): LessonLog[] {
  const seed: LessonLog[] = [];

  const curriculumTitles = [
    { unit: 'I. 물질과 규칙성', sub: '1. 우주의 시작과 원소 생성', topic: '빅뱅 우주론과 원소의 형성', content: '스펙트럼 분석 및 우주 초기 수소·헬륨 생성 과정 학습' },
    { unit: 'I. 물질과 규칙성', sub: '1. 우주의 시작과 원소 생성', topic: '별의 진화와 무거운 원소의 합성', content: '초신성 폭발과 철보다 무거운 원소의 생성 메커니즘' },
    { unit: 'I. 물질과 규칙성', sub: '2. 원소의 주기성과 화학 결합', topic: '원소들의 주기율표와 족·주기', content: '알칼리 금속과 할로젠의 화학적 반응성 비교 탐구' },
    { unit: 'I. 물질과 규칙성', sub: '2. 원소의 주기성과 화학 결합', topic: '화학 결합의 원리와 이온 결합', content: '옥텟 규칙과 염화 나트륨 등의 이온 결합 특성' },
    { unit: 'I. 물질과 규칙성', sub: '2. 원소의 주기성과 화학 결합', topic: '공유 결합과 다양한 물질의 성질', content: '수소와 산소의 전자쌍 공유 및 분자 구조 형성' },
    { unit: 'I. 물질과 규칙성', sub: '3. 자연의 구성 물질', topic: '지각과 생명체를 구성하는 규칙적 물질', content: '규산염 광물과 탄소 화합물의 결합 규칙성 비교' },
    { unit: 'I. 물질과 규칙성', sub: '3. 자연의 구성 물질', topic: '단백질과 핵산의 형성과 유전정보', content: '아미노산의 펩타이드 결합과 DNA 뉴클레오타이드' },
    { unit: 'I. 물질과 규칙성', sub: '4. 신소재의 개발과 활용', topic: '물리적 성질을 변화시킨 첨단 신소재', content: '초전도체 및 그래핀의 물리적 특성과 미래 기술' },
    { unit: 'II. 시스템과 상호작용', sub: '1. 역학적 시스템', topic: '중력과 자유 낙하 운동', content: '중력의 작용과 자유 낙하 운동 및 수평 투사체 운동 비교' },
    { unit: 'II. 시스템과 상호작용', sub: '1. 역학적 시스템', topic: '운동량과 충격량, 충돌 안전 설계', content: '충격량 공식을 활용한 교통안전 및 완충 장치 원리' },
    { unit: 'II. 시스템과 상호작용', sub: '2. 지구 시스템', topic: '지구 시스템의 구성 요소와 상호작용', content: '지구계 에너지 흐름과 물질 순환(탄소 및 물 순환)' },
    { unit: 'II. 시스템과 상호작용', sub: '2. 지구 시스템', topic: '판 구조론과 지각 변동', content: '판의 경계 유형 및 화산·지진 분포 관계' },
  ];

  // March dates in academicYear (weekdays: Mon to Fri)
  // Let's create lessons for 1반, 2반, 3반, 4반 across March & April
  const scheduleMatrix = [
    // [day, period, classIndex]
    { date: `${academicYear}-03-04`, period: 2, classIdx: 0, order: 1, status: 'completed' as const },
    { date: `${academicYear}-03-04`, period: 4, classIdx: 1, order: 1, status: 'completed' as const },
    { date: `${academicYear}-03-05`, period: 1, classIdx: 2, order: 1, status: 'completed' as const },
    { date: `${academicYear}-03-05`, period: 3, classIdx: 3, order: 1, status: 'completed' as const },

    { date: `${academicYear}-03-09`, period: 2, classIdx: 0, order: 2, status: 'completed' as const },
    { date: `${academicYear}-03-09`, period: 3, classIdx: 1, order: 2, status: 'completed' as const },
    { date: `${academicYear}-03-10`, period: 1, classIdx: 2, order: 2, status: 'completed' as const },
    { date: `${academicYear}-03-10`, period: 4, classIdx: 3, order: 2, status: 'completed' as const },

    { date: `${academicYear}-03-11`, period: 2, classIdx: 0, order: 3, status: 'completed' as const },
    { date: `${academicYear}-03-11`, period: 3, classIdx: 1, order: 3, status: 'completed' as const },
    { date: `${academicYear}-03-12`, period: 5, classIdx: 2, order: 3, status: 'completed' as const },
    { date: `${academicYear}-03-12`, period: 2, classIdx: 3, order: 3, status: 'completed' as const },

    { date: `${academicYear}-03-16`, period: 2, classIdx: 0, order: 4, status: 'completed' as const },
    { date: `${academicYear}-03-16`, period: 4, classIdx: 1, order: 4, status: 'completed' as const },
    { date: `${academicYear}-03-17`, period: 1, classIdx: 2, order: 4, status: 'completed' as const },
    { date: `${academicYear}-03-17`, period: 3, classIdx: 3, order: 4, status: 'completed' as const },

    { date: `${academicYear}-03-18`, period: 2, classIdx: 0, order: 5, status: 'completed' as const },
    { date: `${academicYear}-03-18`, period: 3, classIdx: 1, order: 5, status: 'completed' as const },
    { date: `${academicYear}-03-19`, period: 5, classIdx: 2, order: 5, status: 'completed' as const },
    { date: `${academicYear}-03-19`, period: 2, classIdx: 3, order: 5, status: 'completed' as const },

    { date: `${academicYear}-03-23`, period: 2, classIdx: 0, order: 6, status: 'completed' as const },
    { date: `${academicYear}-03-23`, period: 4, classIdx: 1, order: 6, status: 'completed' as const },
    { date: `${academicYear}-03-24`, period: 1, classIdx: 2, order: 6, status: 'completed' as const },
    { date: `${academicYear}-03-24`, period: 3, classIdx: 3, order: 6, status: 'completed' as const },

    { date: `${academicYear}-03-25`, period: 2, classIdx: 0, order: 7, status: 'completed' as const },
    { date: `${academicYear}-03-25`, period: 3, classIdx: 1, order: 7, status: 'completed' as const },
    { date: `${academicYear}-03-26`, period: 5, classIdx: 2, order: 7, status: 'completed' as const },
    { date: `${academicYear}-03-26`, period: 2, classIdx: 3, order: 7, status: 'completed' as const },

    { date: `${academicYear}-03-30`, period: 2, classIdx: 0, order: 8, status: 'completed' as const },
    { date: `${academicYear}-03-30`, period: 4, classIdx: 1, order: 8, status: 'completed' as const },
    { date: `${academicYear}-03-31`, period: 1, classIdx: 2, order: 8, status: 'completed' as const },
    { date: `${academicYear}-03-31`, period: 3, classIdx: 3, order: 8, status: 'completed' as const },

    // April planned lessons
    { date: `${academicYear}-04-06`, period: 2, classIdx: 0, order: 9, status: 'planned' as const },
    { date: `${academicYear}-04-06`, period: 4, classIdx: 1, order: 9, status: 'planned' as const },
    { date: `${academicYear}-04-07`, period: 1, classIdx: 2, order: 9, status: 'planned' as const },
    { date: `${academicYear}-04-07`, period: 3, classIdx: 3, order: 9, status: 'planned' as const },

    { date: `${academicYear}-04-08`, period: 2, classIdx: 0, order: 10, status: 'planned' as const },
    { date: `${academicYear}-04-08`, period: 3, classIdx: 1, order: 10, status: 'planned' as const },
    { date: `${academicYear}-04-09`, period: 5, classIdx: 2, order: 10, status: 'planned' as const },
    { date: `${academicYear}-04-09`, period: 2, classIdx: 3, order: 10, status: 'planned' as const },

    { date: `${academicYear}-04-13`, period: 2, classIdx: 0, order: 11, status: 'planned' as const },
    { date: `${academicYear}-04-13`, period: 4, classIdx: 1, order: 11, status: 'planned' as const },
    { date: `${academicYear}-04-14`, period: 1, classIdx: 2, order: 11, status: 'planned' as const },
    { date: `${academicYear}-04-14`, period: 3, classIdx: 3, order: 11, status: 'planned' as const },

    { date: `${academicYear}-04-15`, period: 2, classIdx: 0, order: 12, status: 'planned' as const },
    { date: `${academicYear}-04-15`, period: 3, classIdx: 1, order: 12, status: 'planned' as const },
    { date: `${academicYear}-04-16`, period: 5, classIdx: 2, order: 12, status: 'planned' as const },
    { date: `${academicYear}-04-16`, period: 2, classIdx: 3, order: 12, status: 'planned' as const },
  ];

  scheduleMatrix.forEach((item, idx) => {
    const cls = classes[item.classIdx];
    if (!cls) return;
    const currItem = curriculumTitles[(item.order - 1) % curriculumTitles.length];

    seed.push({
      id: `seed-${idx + 1}`,
      classId: cls.id,
      date: item.date,
      period: item.period,
      unit: currItem.unit,
      subUnit: currItem.sub,
      lessonOrder: item.order,
      topic: currItem.topic,
      content: currItem.content,
      materials: '교과서 및 탐구 활동지',
      isAssessment: item.order === 6 || item.order === 10,
      assessmentTitle: item.order === 6 ? '실험 관찰 및 보고서 평가' : undefined,
      status: item.status,
    });
  });

  return seed;
}
