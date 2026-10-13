import React from 'react';
import {
  Calendar as CalendarIcon,
  BarChart3,
  BookOpen,
  Clock,
  Printer,
  Settings,
  Plus,
  GraduationCap,
} from 'lucide-react';
import { SemesterType } from '../types';

export type MainTab = 'calendar' | 'progress' | 'curriculum';

interface HeaderProps {
  academicYear: number;
  subjectName: string;
  targetGrade: string;
  currentSemester: SemesterType;
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenNewLesson: () => void;
  onOpenTimetable: () => void;
  onOpenPrint: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  academicYear,
  subjectName,
  targetGrade,
  currentSemester,
  activeTab,
  onSelectTab,
  onOpenNewLesson,
  onOpenTimetable,
  onOpenPrint,
  onOpenSettings,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: App Title and Teacher Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">티처플랜</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                수업 진도 관리
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-medium text-slate-200">{academicYear}학년도</span>
              <span>·</span>
              <span className="font-semibold text-emerald-400">{targetGrade} {subjectName}</span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer ml-1"
              >
                변경
              </button>
            </div>
          </div>
        </div>

        {/* Center: Main View Tabs */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'calendar'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>달력 진도표</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('progress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'progress'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>학급별 진도율</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('curriculum')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'curriculum'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>단원 계획표</span>
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          <button
            type="button"
            onClick={onOpenTimetable}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
            title="주간 배당 시간표 설정"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">시간표</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrint}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
            title="교과진도표 인쇄"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">인쇄</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
            title="환경 설정"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNewLesson}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-xs cursor-pointer transition-colors ml-1"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>새 수업</span>
          </button>
        </div>
      </div>
    </header>
  );
};
