import React from 'react';
import { ClassGroup, LessonLog } from '../types';
import { calculateClassProgress } from '../utils/calendar';
import { AlertCircle, CheckCircle2, SlidersHorizontal, Plus } from 'lucide-react';

interface ClassFilterBarProps {
  classes: ClassGroup[];
  lessons: LessonLog[];
  selectedClassId: string | 'all';
  onSelectClassId: (id: string | 'all') => void;
  showWeekends: boolean;
  onToggleWeekends: () => void;
  onOpenNewLesson: () => void;
  onOpenSettings: () => void;
}

export const ClassFilterBar: React.FC<ClassFilterBarProps> = ({
  classes,
  lessons,
  selectedClassId,
  onSelectClassId,
  showWeekends,
  onToggleWeekends,
  onOpenNewLesson,
  onOpenSettings,
}) => {
  const { summaries, hasDiscrepancy, maxCompleted, minCompleted } = calculateClassProgress(classes, lessons);

  const laggingClasses = summaries.filter((s) => s.diffFromMaxCompleted >= 2);

  return (
    <div className="bg-slate-50/70 border-b border-slate-200 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Class selection with colored tags and progress rate */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            학급 필터
          </span>

          <button
            type="button"
            onClick={() => onSelectClassId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5 ${
              selectedClassId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>전체 학급</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedClassId === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {classes.length}개 반
            </span>
          </button>

          {summaries.map((summary) => {
            const isSelected = selectedClassId === summary.classId;

            return (
              <button
                key={summary.classId}
                type="button"
                onClick={() => onSelectClassId(summary.classId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-2 group ${
                  isSelected
                    ? 'ring-2 ring-slate-900 ring-offset-1 shadow-xs'
                    : 'hover:bg-white'
                }`}
                style={{
                  backgroundColor: isSelected ? summary.bgLight : '#ffffff',
                  borderColor: summary.borderCol,
                  color: isSelected ? summary.color : '#334155',
                }}
              >
                {/* Color tag indicator */}
                <span
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: summary.color }}
                />

                <span className="font-semibold">{summary.className}</span>

                {/* Mini progress tracker */}
                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
                  <span className="text-[11px] font-semibold" style={{ color: summary.color }}>
                    {summary.progressPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({summary.completedHours}/{summary.targetHours}차시)
                  </span>
                </div>

                {/* Visual mini bar */}
                <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-0.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${summary.progressPercent}%`,
                      backgroundColor: summary.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right tools: Weekend toggle & New Lesson Quick Button */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={onToggleWeekends}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
              showWeekends
                ? 'bg-white text-slate-700 border-slate-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
            title="주 5일(월~금) 또는 주 7일(일~토) 달력 표시 전환"
          >
            {showWeekends ? '주 7일 보기' : '주 5일 (수업일만)'}
          </button>

          <button
            type="button"
            onClick={onOpenNewLesson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>수업 등록</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Alert Banner if classes are out of sync */}
      {hasDiscrepancy && laggingClasses.length > 0 && (
        <div className="max-w-7xl mx-auto mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>학급 간 진도 편차 알림:</strong> 선두 학급({maxCompleted}차시) 대비{' '}
              {laggingClasses.map((c) => `${c.className}(${c.diffFromMaxCompleted}차시 지연)`).join(', ')}의
              진도가 늦어지고 있습니다. 보강 또는 진도 조율이 필요합니다.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectClassId(laggingClasses[0].classId)}
            className="ml-3 font-semibold text-amber-700 underline hover:text-amber-900 shrink-0 cursor-pointer"
          >
            {laggingClasses[0].className} 확인
          </button>
        </div>
      )}
    </div>
  );
};
