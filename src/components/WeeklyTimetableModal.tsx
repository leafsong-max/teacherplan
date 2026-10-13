import React, { useState } from 'react';
import { ClassGroup, CurriculumItem, LessonLog, SchoolEvent, TimetableSlot } from '../types';
import { X, Clock, Wand2, Calendar, Check, AlertCircle } from 'lucide-react';
import { formatDateKey, getEventsForDate } from '../utils/calendar';

interface WeeklyTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassGroup[];
  curriculum: CurriculumItem[];
  timetable: TimetableSlot[];
  schoolEvents: SchoolEvent[];
  academicYear: number;
  onUpdateTimetable: (slots: TimetableSlot[]) => void;
  onAutoPopulateLessons: (newLessons: LessonLog[]) => void;
}

export const WeeklyTimetableModal: React.FC<WeeklyTimetableModalProps> = ({
  isOpen,
  onClose,
  classes,
  curriculum,
  timetable,
  schoolEvents,
  academicYear,
  onUpdateTimetable,
  onAutoPopulateLessons,
}) => {
  const [localSlots, setLocalSlots] = useState<TimetableSlot[]>(timetable);
  const [autoGenMonth, setAutoGenMonth] = useState<number>(3); // 3월 by default
  const [genStatusMessage, setGenStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const dayNames = [
    { day: 1, label: '월요일' },
    { day: 2, label: '화요일' },
    { day: 3, label: '수요일' },
    { day: 4, label: '목요일' },
    { day: 5, label: '금요일' },
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  const getSlot = (day: number, period: number) => {
    return localSlots.find((s) => s.dayOfWeek === day && s.period === period);
  };

  const handleSlotChange = (day: number, period: number, classId: string) => {
    if (!classId) {
      setLocalSlots(localSlots.filter((s) => !(s.dayOfWeek === day && s.period === period)));
    } else {
      const filtered = localSlots.filter((s) => !(s.dayOfWeek === day && s.period === period));
      setLocalSlots([...filtered, { dayOfWeek: day, period, classId }]);
    }
  };

  const handleSaveTimetable = () => {
    onUpdateTimetable(localSlots);
    onClose();
  };

  // Smart Auto-Populate
  const handleAutoPopulateMonth = () => {
    const year = autoGenMonth >= 3 ? academicYear : academicYear + 1;
    const daysInMonth = new Date(year, autoGenMonth, 0).getDate();

    const created: LessonLog[] = [];

    // Track lesson order counter per class
    const classCounters: Record<string, number> = {};
    classes.forEach((c) => {
      classCounters[c.id] = 1;
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, autoGenMonth - 1, d);
      const dayOfWeek = dateObj.getDay(); // 0 is Sun, 1 is Mon...
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekend

      const dateStr = formatDateKey(year, autoGenMonth, d);
      const events = getEventsForDate(dateStr, schoolEvents);
      const isHoliday = events.some((e) => e.type === 'holiday' || e.noClass);
      if (isHoliday) continue; // skip public holidays

      // Find timetable slots for this day of week
      const slotsForDay = localSlots.filter((s) => s.dayOfWeek === dayOfWeek);

      slotsForDay.forEach((slot) => {
        const cls = classes.find((c) => c.id === slot.classId);
        if (!cls) return;

        const currentOrder = classCounters[slot.classId] || 1;
        const currItem = curriculum.find((c) => c.order === currentOrder);

        created.push({
          id: `auto-${dateStr}-${slot.period}-${slot.classId}`,
          classId: slot.classId,
          date: dateStr,
          period: slot.period,
          unit: currItem?.unit || '정규 수업',
          subUnit: currItem?.subUnit || '',
          lessonOrder: currentOrder,
          topic: currItem?.topic || `${cls.name} ${currentOrder}차시 수업`,
          content: currItem?.content || '주간 시간표 기반 자동 생성된 수업 일정',
          materials: currItem?.materials || '교과서 및 활동지',
          status: 'planned',
        });

        classCounters[slot.classId] = currentOrder + 1;
      });
    }

    if (created.length === 0) {
      setGenStatusMessage('등록할 시간표 슬롯이 없거나 휴일입니다.');
      return;
    }

    onAutoPopulateLessons(created);
    setGenStatusMessage(
      `총 ${created.length}개의 수업 일정이 ${year}년 ${autoGenMonth}월 달력에 자동 배치되었습니다!`
    );
  };

  const classMap = new Map<string, ClassGroup>();
  classes.forEach((c) => classMap.set(c.id, c));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">주간 배당 시간표 설정</h3>
              <p className="text-xs text-slate-400">
                월~금 요일 및 교시별 담당 학급을 배정합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timetable Grid */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="py-2.5 px-3 text-slate-600 font-semibold w-16 text-center">
                    교시
                  </th>
                  {dayNames.map((d) => (
                    <th key={d.day} className="py-2.5 px-3 text-slate-700 font-bold text-center">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((period) => (
                  <tr key={period} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-600 text-center bg-slate-50/60">
                      {period}교시
                    </td>
                    {dayNames.map((d) => {
                      const slot = getSlot(d.day, period);
                      const currentAssignedClass = slot ? classMap.get(slot.classId) : null;

                      return (
                        <td key={d.day} className="p-1.5 text-center">
                          <select
                            value={slot?.classId || ''}
                            onChange={(e) => handleSlotChange(d.day, period, e.target.value)}
                            className="w-full py-1 px-2 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
                            style={{
                              backgroundColor: currentAssignedClass?.bgLight || '#ffffff',
                              borderColor: currentAssignedClass?.borderCol || '#e2e8f0',
                              color: currentAssignedClass?.color || '#64748b',
                            }}
                          >
                            <option value="">- 없음 -</option>
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Auto Populate Generator Helper */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <Wand2 className="w-4 h-4 text-emerald-700" />
              <span>시간표 기반 달력 자동 생성 마법사</span>
            </div>
            <p className="text-xs text-emerald-800">
              위 주간 시간표와 교육과정 단원 목록을 바탕으로, 원하는 월의 평일 수업 일정을 달력에 자동으로
              채워 넣습니다 (공휴일은 자동 제외).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="font-semibold">대상 월 선택:</span>
                <select
                  value={autoGenMonth}
                  onChange={(e) => setAutoGenMonth(Number(e.target.value))}
                  className="py-1 px-2.5 rounded-md border border-slate-300 bg-white font-medium text-xs cursor-pointer"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2].map((m) => (
                    <option key={m} value={m}>
                      {m >= 3 ? `${academicYear}년 ${m}월` : `${academicYear + 1}년 ${m}월`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAutoPopulateMonth}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>해당 월 달력에 자동 채우기</span>
              </button>
            </div>

            {genStatusMessage && (
              <div className="text-xs font-semibold text-emerald-900 bg-emerald-100/70 p-2 rounded-md flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{genStatusMessage}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSaveTimetable}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
            >
              시간표 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
