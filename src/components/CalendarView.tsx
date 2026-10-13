import React, { useRef, useEffect } from 'react';
import { ClassGroup, LessonLog, SchoolEvent } from '../types';
import {
  AcademicMonthInfo,
  getCalendarGrid,
  getEventsForDate,
  formatKoreanDate,
  KOREAN_DAY_NAMES,
} from '../utils/calendar';
import { Plus, Check, Clock, AlertCircle, BookmarkCheck, FileText, Sparkles } from 'lucide-react';

interface CalendarViewProps {
  currentMonth: AcademicMonthInfo;
  classes: ClassGroup[];
  lessons: LessonLog[];
  schoolEvents: SchoolEvent[];
  selectedClassId: string | 'all';
  showWeekends: boolean;
  onSelectMonthIndex: (index: number) => void;
  onOpenLessonDetail: (lesson: LessonLog) => void;
  onAddLessonForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  classes,
  lessons,
  schoolEvents,
  selectedClassId,
  showWeekends,
  onSelectMonthIndex,
  onOpenLessonDetail,
  onAddLessonForDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isWheelingRef = useRef(false);

  // Wheel event listener for smooth month navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If user is scrolling inside an overflow modal or small target, don't hijack unless inside the calendar grid
      if (Math.abs(e.deltaY) < 25) return;
      if (isWheelingRef.current) return;

      e.preventDefault();
      isWheelingRef.current = true;

      if (e.deltaY > 0) {
        // Scroll down -> next month
        if (currentMonth.index < 11) {
          onSelectMonthIndex(currentMonth.index + 1);
        }
      } else {
        // Scroll up -> prev month
        if (currentMonth.index > 0) {
          onSelectMonthIndex(currentMonth.index - 1);
        }
      }

      setTimeout(() => {
        isWheelingRef.current = false;
      }, 350);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [currentMonth.index, onSelectMonthIndex]);

  const rawDays = getCalendarGrid(currentMonth.year, currentMonth.month);

  // Filter weekends if showWeekends is false
  const calendarDays = showWeekends
    ? rawDays
    : rawDays.filter((d) => d.dayOfWeek !== 0 && d.dayOfWeek !== 6);

  // Day header names
  const headers = showWeekends
    ? [
        { name: '일', isSun: true, isSat: false },
        { name: '월', isSun: false, isSat: false },
        { name: '화', isSun: false, isSat: false },
        { name: '수', isSun: false, isSat: false },
        { name: '목', isSun: false, isSat: false },
        { name: '금', isSun: false, isSat: false },
        { name: '토', isSun: false, isSat: true },
      ]
    : [
        { name: '월', isSun: false, isSat: false },
        { name: '화', isSun: false, isSat: false },
        { name: '수', isSun: false, isSat: false },
        { name: '목', isSun: false, isSat: false },
        { name: '금', isSun: false, isSat: false },
      ];

  const classMap = new Map<string, ClassGroup>();
  classes.forEach((c) => classMap.set(c.id, c));

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-white overflow-hidden select-none"
    >
      {/* Calendar Weekday Headers */}
      <div
        className={`grid ${
          showWeekends ? 'grid-cols-7' : 'grid-cols-5'
        } border-b border-slate-200 bg-slate-100 text-xs font-semibold`}
      >
        {headers.map((h, i) => (
          <div
            key={i}
            className={`py-2.5 text-center border-r last:border-r-0 border-slate-200 ${
              h.isSun ? 'text-rose-600 bg-rose-50/40' : h.isSat ? 'text-blue-600 bg-blue-50/40' : 'text-slate-700'
            }`}
          >
            {h.name}요일
          </div>
        ))}
      </div>

      {/* Calendar Grid Container */}
      <div
        className={`grid ${
          showWeekends ? 'grid-cols-7' : 'grid-cols-5'
        } flex-1 auto-rows-fr overflow-y-auto bg-slate-200 gap-[1px]`}
      >
        {calendarDays.map((cell) => {
          const events = getEventsForDate(cell.date, schoolEvents);
          const hasHoliday = events.some((e) => e.type === 'holiday' || e.noClass);
          const hasExam = events.some((e) => e.type === 'exam');
          const hasVacation = events.some((e) => e.type === 'vacation');

          // Filter lessons for this day and selected class
          const dayLessons = lessons
            .filter((l) => l.date === cell.date)
            .filter((l) => (selectedClassId === 'all' ? true : l.classId === selectedClassId))
            .sort((a, b) => a.period - b.period);

          const isSunday = cell.dayOfWeek === 0;
          const isSaturday = cell.dayOfWeek === 6;

          return (
            <div
              key={cell.date}
              className={`min-h-[130px] p-1.5 flex flex-col transition-colors group relative ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/70 text-slate-400'
                  : hasHoliday
                  ? 'bg-rose-50/30'
                  : hasExam
                  ? 'bg-amber-50/30'
                  : hasVacation
                  ? 'bg-indigo-50/20'
                  : 'bg-white hover:bg-slate-50/80'
              }`}
            >
              {/* Day Header: date number, event tags, quick add button */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold ${
                      cell.isToday
                        ? 'w-6 h-6 rounded-full bg-slate-900 text-white shadow-xs'
                        : isSunday
                        ? 'text-rose-600 font-bold'
                        : isSaturday
                        ? 'text-blue-600'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {cell.isToday && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                      오늘
                    </span>
                  )}
                </div>

                {/* Quick Add Button on Hover */}
                {cell.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddLessonForDate(cell.date);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                    title={`${cell.date} 수업 추가`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* School Events / Holiday badges */}
              {events.length > 0 && (
                <div className="flex flex-col gap-0.5 mb-1">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${
                        ev.type === 'holiday'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : ev.type === 'exam'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                          : ev.type === 'vacation'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )}

              {/* Lessons List on this day */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[140px] scrollbar-thin">
                {dayLessons.map((lesson) => {
                  const cls = classMap.get(lesson.classId);
                  const classColor = cls?.color || '#3b82f6';
                  const classBg = cls?.bgLight || '#eff6ff';
                  const classBorder = cls?.borderCol || '#bfdbfe';

                  const isCompleted = lesson.status === 'completed';

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onOpenLessonDetail(lesson)}
                      className="group/lesson relative p-1.5 rounded-md border text-left cursor-pointer transition-all hover:shadow-xs hover:brightness-95"
                      style={{
                        backgroundColor: classBg,
                        borderColor: classBorder,
                      }}
                      title={`${cls?.name || ''} ${lesson.period}교시: ${lesson.topic} (${lesson.status})`}
                    >
                      {/* Top line: Class badge + Period + Order + Assessment */}
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          {/* Class tag with custom color */}
                          <span
                            className="text-[10px] font-bold px-1 py-0.2 rounded text-white shrink-0"
                            style={{ backgroundColor: classColor }}
                          >
                            {cls?.name || '학급'}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-700">
                            {lesson.period}교시
                          </span>

                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            {lesson.lessonOrder}차시
                          </span>
                        </div>

                        {/* Status / Assessment icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {lesson.isAssessment && (
                            <span
                              className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold"
                              title="수행평가 수업"
                            >
                              평
                            </span>
                          )}

                          {isCompleted ? (
                            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400 stroke-2" />
                          )}
                        </div>
                      </div>

                      {/* Lesson topic title */}
                      <div className="text-[11px] font-medium text-slate-800 line-clamp-1 leading-tight">
                        {lesson.topic}
                      </div>

                      {/* Subtitle / Unit hint */}
                      {lesson.unit && (
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">
                          {lesson.subUnit || lesson.unit}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Empty day prompt on hover */}
                {dayLessons.length === 0 && cell.isCurrentMonth && !hasHoliday && (
                  <button
                    type="button"
                    onClick={() => onAddLessonForDate(cell.date)}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center py-2 border border-dashed border-slate-300 rounded text-[11px] text-slate-500 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer"
                  >
                    + 수업 추가
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
