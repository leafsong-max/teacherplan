import React from 'react';
import { AcademicMonthInfo } from '../utils/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MousePointer } from 'lucide-react';
import { LessonLog } from '../types';

interface MonthNavigationProps {
  months: AcademicMonthInfo[];
  currentMonthIndex: number;
  onSelectMonthIndex: (index: number) => void;
  academicYear: number;
  lessons: LessonLog[];
}

export const MonthNavigation: React.FC<MonthNavigationProps> = ({
  months,
  currentMonthIndex,
  onSelectMonthIndex,
  academicYear,
  lessons,
}) => {
  const currentMonth = months[currentMonthIndex];

  // Helper to count lessons in a month
  const getLessonCountForMonth = (year: number, month: number) => {
    const prefix = `${year}-${month < 10 ? '0' + month : month}`;
    return lessons.filter((l) => l.date.startsWith(prefix)).length;
  };

  const handlePrev = () => {
    if (currentMonthIndex > 0) {
      onSelectMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentMonthIndex < months.length - 1) {
      onSelectMonthIndex(currentMonthIndex + 1);
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1; // 1~12

    const idx = months.findIndex((m) => m.year === todayYear && m.month === todayMonth);
    if (idx !== -1) {
      onSelectMonthIndex(idx);
    } else {
      // Default to March
      onSelectMonthIndex(0);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        {/* Top bar with Month title & Prev/Next & Wheel tip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentMonthIndex === 0}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="이전 달 (또는 마우스 휠 위로)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-3 py-1 font-semibold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>
                  {currentMonth?.year}년 {currentMonth?.shortLabel}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                  {currentMonth?.semester === 1 ? '1학기' : '2학기'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentMonthIndex === months.length - 1}
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="다음 달 (또는 마우스 휠 아래로)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToday}
              className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
            >
              오늘
            </button>

            {/* Mouse wheel helper tooltip indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
              <MousePointer className="w-3.5 h-3.5" />
              <span>달력 영역에서 마우스 휠로 월 이동 가능</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>1학기 (3월~7월)</span>
            <span className="text-slate-300">|</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span>여름방학 (8월)</span>
            <span className="text-slate-300">|</span>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span>2학기 (9월~12월)</span>
            <span className="text-slate-300">|</span>
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>겨울방학·종업 (1~2월)</span>
          </div>
        </div>

        {/* 12-Month Bar: March to next Feb */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {months.map((m) => {
            const isSelected = m.index === currentMonthIndex;
            const count = getLessonCountForMonth(m.year, m.month);

            // semester styling cue
            let accentDot = 'bg-emerald-500';
            if (m.month === 8) accentDot = 'bg-amber-500';
            else if (m.semester === 2 && m.month <= 12 && m.month >= 9) accentDot = 'bg-blue-500';
            else if (m.isNextYear) accentDot = 'bg-indigo-500';

            return (
              <button
                key={`${m.year}-${m.month}`}
                type="button"
                onClick={() => onSelectMonthIndex(m.index)}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all flex flex-col items-center justify-center border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : accentDot}`} />
                  <span className="font-semibold">{m.shortLabel}</span>
                  {m.isNextYear && (
                    <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      '{String(m.year).slice(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {count > 0 ? `${count}차시` : '-'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
