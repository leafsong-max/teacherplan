export type SemesterType = '1' | '2' | 'all';

export interface ClassGroup {
  id: string;
  name: string; // e.g. "1반", "2반", "3반", "4반"
  grade: string; // e.g. "2학년"
  color: string; // hex color e.g. "#059669"
  bgLight: string; // e.g. "#ecfdf5"
  borderCol: string; // e.g. "#a7f3d0"
  targetHours: number; // 총 계획 시수 (예: 64차시)
}

export type LessonStatus = 'planned' | 'completed' | 'cancelled' | 'supplementary';

export interface LessonLog {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  period: number; // 1 ~ 7교시
  unit: string; // 단원명 (예: I. 물질과 규칙성)
  subUnit?: string; // 소단원 (예: 1. 원소들의 주기성)
  lessonOrder: number; // 차시 번호 (예: 12)
  topic: string; // 학습 주제 (예: 주기율표와 원소의 주기적 성질 탐구)
  content: string; // 교수학습 내용 및 학생 활동
  materials?: string; // 준비물 / 멀티미디어 자료
  homework?: string; // 과제 / 형성평가
  isAssessment?: boolean; // 수행평가 반영 여부
  assessmentTitle?: string;
  status: LessonStatus;
  memo?: string;
}

export interface SchoolEvent {
  id: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  title: string;
  type: 'holiday' | 'exam' | 'event' | 'vacation';
  noClass: boolean; // 수업 진행 여부 (true면 공휴일/휴업일)
}

export interface CurriculumItem {
  id: string;
  order: number; // 전체 순서 (1차시, 2차시...)
  unit: string;
  subUnit?: string;
  topic: string;
  content: string;
  materials?: string;
}

export interface TimetableSlot {
  dayOfWeek: number; // 1 (월), 2 (화), 3 (수), 4 (목), 5 (금)
  period: number; // 1 ~ 7
  classId: string;
}

export interface TeacherPlanState {
  academicYear: number;
  currentSemester: SemesterType;
  subjectName: string;
  targetGrade: string;
  classes: ClassGroup[];
  lessons: LessonLog[];
  schoolEvents: SchoolEvent[];
  curriculum: CurriculumItem[];
  timetable: TimetableSlot[];
}
