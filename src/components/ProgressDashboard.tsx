import React from 'react';
import { ClassGroup, CurriculumItem, LessonLog } from '../types';
import { calculateClassProgress } from '../utils/calendar';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen,
  Award,
} from 'lucide-react';

interface ProgressDashboardProps {
  classes: ClassGroup[];
  lessons: LessonLog[];
  curriculum: CurriculumItem[];
  academicYear: number;
  subjectName: string;
  targetGrade: string;
  onSelectClass: (classId: string) => void;
  onOpenNewLesson: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  classes,
  lessons,
  curriculum,
  academicYear,
  subjectName,
  targetGrade,
  onSelectClass,
  onOpenNewLesson,
}) => {
  const { summaries, maxCompleted, minCompleted, hasDiscrepancy, totalLessonsCount } =
    calculateClassProgress(classes, lessons);

  // Group curriculum by units
  const unitsMap = new Map<string, CurriculumItem[]>();
  curriculum.forEach((item) => {
    const list = unitsMap.get(item.unit) || [];
    list.push(item);
    unitsMap.set(item.unit, list);
  });
  const unitList = Array.from(unitsMap.entries());

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 space-y-6">
      {/* Top Banner / Subject Info */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {academicYear}학년도
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {targetGrade} · {subjectName}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            학급별 수업 진도율 현황 및 동기화 분석
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            총 {classes.length}개 담당 학급의 누적 수업 차시, 진도율(%), 단원별 진행 상태를 실시간으로 비교합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center">
            <div className="text-[11px] text-slate-500 font-medium">총 등록 차시</div>
            <div className="text-base font-bold text-slate-900">{totalLessonsCount}차시</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center">
            <div className="text-[11px] text-slate-500 font-medium">최대 진행 차시</div>
            <div className="text-base font-bold text-emerald-600">{maxCompleted}차시</div>
          </div>
        </div>
      </div>

      {/* Discrepancy Alert Box */}
      {hasDiscrepancy ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-900">
              학급 간 수업 진도 편차 주의 (최대 {maxCompleted - minCompleted}차시 차이)
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              공휴일, 학교 행사(수학여행, 체육대회 등), 또는 재량휴업일로 인해 특정 학급의 진도가 늦어지고 있습니다.
              시험 출제 범위와 공평성을 위해 보강 일정을 계획하거나 수업 차시를 조율하는 것을 권장합니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-800">
            <strong>진도 동기화 양호:</strong> 모든 학급이 편차 1차시 이내로 고르게 진도를 유지하고 있습니다.
          </div>
        </div>
      )}

      {/* Class Cards Grid with Big Visual Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map((item) => {
          const isLagging = item.diffFromMaxCompleted >= 2;

          return (
            <div
              key={item.classId}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300"
            >
              {/* Colored top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: item.color }}
              />

              <div>
                {/* Header: Class tag & Lagging badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <h3 className="font-bold text-slate-900 text-base">{item.className}</h3>
                    <span className="text-xs text-slate-400 font-medium">({item.grade})</span>
                  </div>

                  {isLagging ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      -{item.diffFromMaxCompleted}차시 지연
                    </span>
                  ) : item.completedHours === maxCompleted && maxCompleted > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      선두 진행
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      동기화 유지
                    </span>
                  )}
                </div>

                {/* Big Progress Number and Bar */}
                <div className="my-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-black" style={{ color: item.color }}>
                      {item.progressPercent}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {item.completedHours} / {item.targetHours} 차시 완료
                    </span>
                  </div>

                  {/* Multi-layered progress bar: Completed (solid) + Planned (light) */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full transition-all rounded-l-full"
                      style={{
                        width: `${item.progressPercent}%`,
                        backgroundColor: item.color,
                      }}
                      title={`완료: ${item.completedHours}차시`}
                    />
                    <div
                      className="h-full opacity-35 transition-all"
                      style={{
                        width: `${Math.min(
                          100 - item.progressPercent,
                          Math.round((item.plannedHours / item.targetHours) * 100)
                        )}%`,
                        backgroundColor: item.color,
                      }}
                      title={`계획: ${item.plannedHours}차시`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>완료 {item.completedHours}차시</span>
                    <span>예정 {item.plannedHours}차시</span>
                    <span>목표 {item.targetHours}차시</span>
                  </div>
                </div>

                {/* Recent Completed Lesson info */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      최근 완료 수업
                    </div>
                    {item.latestCompletedLesson ? (
                      <div className="font-medium text-slate-800 line-clamp-1 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">
                          [{item.latestCompletedLesson.lessonOrder}차시]
                        </span>
                        {item.latestCompletedLesson.topic}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">아직 완료된 수업 없음</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">
                      다음 진행 예정 수업
                    </div>
                    {item.nextPlannedLesson ? (
                      <div className="font-medium text-slate-600 line-clamp-1 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 mr-1">
                          [{item.nextPlannedLesson.lessonOrder}차시]
                        </span>
                        {item.nextPlannedLesson.topic}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">예정된 수업 없음</div>
                    )}
                  </div>
                </div>
              </div>

              {/* View class in calendar button */}
              <button
                type="button"
                onClick={() => onSelectClass(item.classId)}
                className="mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>{item.className} 달력 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Unit-by-Unit Progress Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">대단원별 학급 진도 달성 매트릭스</h3>
          </div>
          <span className="text-xs text-slate-400">
            단원별 완료 차시 / 전체 차시
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-2.5 px-3 font-semibold text-slate-600">단원명</th>
                <th className="py-2.5 px-3 font-semibold text-slate-600 text-center">총 차시</th>
                {classes.map((c) => (
                  <th key={c.id} className="py-2.5 px-3 font-semibold text-center">
                    <span
                      className="px-2 py-0.5 rounded text-white text-[11px]"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitList.map(([unitName, items]) => {
                const totalInUnit = items.length;

                return (
                  <tr key={unitName} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {unitName}
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {items[0]?.subUnit || ''} 외
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-semibold">
                      {totalInUnit}차시
                    </td>
                    {classes.map((cls) => {
                      // Count completed in this unit
                      const unitCompleted = lessons.filter(
                        (l) =>
                          l.classId === cls.id &&
                          l.unit === unitName &&
                          l.status === 'completed'
                      ).length;

                      const pct = Math.min(100, Math.round((unitCompleted / (totalInUnit || 1)) * 100));

                      return (
                        <td key={cls.id} className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-800">
                              {unitCompleted} / {totalInUnit}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: cls.color,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
