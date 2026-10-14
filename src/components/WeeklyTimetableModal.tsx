import React, { useState, useMemo } from 'react';
import { ClassGroup, CurriculumItem, LessonLog, SchoolEvent, TimetableSlot } from '../types';
import {
  X,
  Clock,
  Wand2,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
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
  onAutoPopulateLessons: (
    newLessons: LessonLog[],
    replaceRange?: { start: string; end: string }
  ) => void;
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
  const [activeTab, setActiveTab] = useState<'timetable' | 'semesterBatch'>('semesterBatch');
  const [localSlots, setLocalSlots] = useState<TimetableSlot[]>(timetable);

  // Semester Batch Generation Settings
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | 'custom'>('1');
  const [startDate, setStartDate] = useState<string>(`${academicYear}-03-02`);
  const [endDate, setEndDate] = useState<string>(`${academicYear}-07-17`);
  const [skipHolidays, setSkipHolidays] = useState<boolean>(true);
  const [skipExams, setSkipExams] = useState<boolean>(true);
  const [skipVacations, setSkipVacations] = useState<boolean>(true);
  const [linkCurriculum, setLinkCurriculum] = useState<boolean>(true);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    setStatusMessage('주간 시간표가 저장되었습니다.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSemesterChange = (semester: '1' | '2' | 'custom') => {
    setSelectedSemester(semester);
    if (semester === '1') {
      setStartDate(`${academicYear}-03-02`);
      setEndDate(`${academicYear}-07-17`);
    } else if (semester === '2') {
      setStartDate(`${academicYear}-08-17`);
      setEndDate(`${academicYear + 1}-02-12`);
    }
  };

  // Calculate live preview of lessons to be created
  const previewData = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) {
      return { totalDays: 0, schoolDays: 0, skippedDays: 0, classCounts: {}, lessonsList: [] };
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const current = new Date(startObj);

    let totalDays = 0;
    let schoolDays = 0;
    let skippedDays = 0;

    const classLessonCounters: Record<string, number> = {};
    classes.forEach((c) => {
      classLessonCounters[c.id] = 1;
    });

    const generatedLessons: LessonLog[] = [];

    while (current <= endObj) {
      totalDays++;
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const d = current.getDate();
      const dateStr = formatDateKey(y, m, d);
      const dayOfWeek = current.getDay(); // 0 is Sun, 6 is Sat

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // weekend
        current.setDate(current.getDate() + 1);
        continue;
      }

      const events = getEventsForDate(dateStr, schoolEvents);
      const isHoliday = events.some((e) => e.type === 'holiday' || e.noClass);
      const isExam = events.some((e) => e.type === 'exam');
      const isVacation = events.some((e) => e.type === 'vacation');

      let shouldSkip = false;
      if (skipHolidays && isHoliday) shouldSkip = true;
      if (skipExams && isExam) shouldSkip = true;
      if (skipVacations && isVacation) shouldSkip = true;

      if (shouldSkip) {
        skippedDays++;
        current.setDate(current.getDate() + 1);
        continue;
      }

      schoolDays++;

      // Slots for this day of week
      const slots = localSlots.filter((s) => s.dayOfWeek === dayOfWeek).sort((a, b) => a.period - b.period);

      slots.forEach((slot) => {
        const cls = classes.find((c) => c.id === slot.classId);
        if (!cls) return;

        const currentOrder = classLessonCounters[slot.classId] || 1;
        const currItem = curriculum.find((c) => c.order === currentOrder);

        const topic = currItem && linkCurriculum
          ? currItem.topic
          : `${cls.name} ${currentOrder}차시 수업`;

        const unit = currItem && linkCurriculum ? currItem.unit : '정규 수업';
        const subUnit = currItem && linkCurriculum ? currItem.subUnit || '' : '';
        const content = currItem && linkCurriculum ? currItem.content : '주간 시간표 기반 자동 등록된 수업';
        const materials = currItem && linkCurriculum ? currItem.materials || '' : '교과서 및 학습 활동지';

        generatedLessons.push({
          id: `auto-${dateStr}-${slot.period}-${slot.classId}`,
          classId: slot.classId,
          date: dateStr,
          period: slot.period,
          unit,
          subUnit,
          lessonOrder: currentOrder,
          topic,
          content,
          materials,
          status: 'planned',
        });

        classLessonCounters[slot.classId] = currentOrder + 1;
      });

      current.setDate(current.getDate() + 1);
    }

    const classCounts: Record<string, number> = {};
    classes.forEach((c) => {
      classCounts[c.id] = (classLessonCounters[c.id] || 1) - 1;
    });

    return {
      totalDays,
      schoolDays,
      skippedDays,
      classCounts,
      lessonsList: generatedLessons,
    };
  }, [
    startDate,
    endDate,
    skipHolidays,
    skipExams,
    skipVacations,
    linkCurriculum,
    localSlots,
    classes,
    curriculum,
    schoolEvents,
  ]);

  const handleExecuteBatchPopulate = () => {
    if (localSlots.length === 0) {
      alert('등록된 주간 시간표가 없습니다. 먼저 시간표를 설정해 주세요.');
      setActiveTab('timetable');
      return;
    }

    if (previewData.lessonsList.length === 0) {
      alert('선택하신 기간에 등록할 수 있는 수업일이 없습니다.');
      return;
    }

    const confirmed = confirm(
      `[${startDate} ~ ${endDate}] 기간 동안 총 ${previewData.lessonsList.length}개의 수업을 학기 달력에 일괄 등록하시겠습니까?\n` +
        (overwriteExisting
          ? '※ 해당 기간의 기존 수업은 모두 새로 대체됩니다.'
          : '※ 기존 등록된 수업을 유지하며 새 슬롯을 채웁니다.')
    );

    if (!confirmed) return;

    // Save timetable first
    onUpdateTimetable(localSlots);

    // Call populate callback
    onAutoPopulateLessons(
      previewData.lessonsList,
      overwriteExisting ? { start: startDate, end: endDate } : undefined
    );

    setStatusMessage(
      `🎉 성공! 총 ${previewData.lessonsList.length}개 차시의 수업이 달력에 일괄 등록되었습니다.`
    );

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const classMap = new Map<string, ClassGroup>();
  classes.forEach((c) => classMap.set(c.id, c));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">시간표 설정 및 한 학기 수업 일괄 등록</h3>
              <p className="text-xs text-slate-400">
                주간 시간표를 바탕으로 한 학기 전체 수업일에 수업을 자동으로 배치합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('semesterBatch')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'semesterBatch'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>한 학기 수업 일괄 등록 마법사</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              추천
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'timetable'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>주간 배당 시간표 수정 (월~금)</span>
          </button>
        </div>

        {/* Tab 1: Semester Batch Generator */}
        {activeTab === 'semesterBatch' && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Guide message */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-emerald-900 block mb-0.5">
                  한 번의 클릭으로 한 학기 전체 수업 일정 자동 등록
                </strong>
                선생님의 주간 배당 시간표에 맞춰, 학기 시작일부터 종료일까지의 모든 평일 수업 슬롯을 달력에
                순서대로 자동 등록합니다. 공휴일이나 시험 기간은 자동으로 건너뛰어 차시가 밀리지 않도록 계산됩니다.
              </div>
            </div>

            {/* Semester Selection & Date Range */}
            <div className="border border-slate-200 rounded-xl p-4.5 bg-white shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>1. 대상 학기 및 수업 기간 설정</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSemesterChange('1')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSemester === '1'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">1학기 전체</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {academicYear}년 3월 ~ 7월 여름방학 전
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSemesterChange('2')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSemester === '2'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">2학기 전체</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {academicYear}년 8월 ~ {academicYear + 1}년 2월 종업
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSemester('custom')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSemester === 'custom'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">사용자 직접 지정</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">원하는 기간 직접 입력</div>
                </button>
              </div>

              {/* Start & End Date pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    수업 시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedSemester('custom');
                    }}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    수업 종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedSemester('custom');
                    }}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Smart Exclusion Options */}
            <div className="border border-slate-200 rounded-xl p-4.5 bg-white shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-emerald-600" />
                <span>2. 휴업일 제외 및 차시 연결 옵션</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={skipHolidays}
                    onChange={(e) => setSkipHolidays(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>
                    <strong>공휴일 및 재량휴업일 제외</strong> (삼일절, 어린이날 등 수업 건너뜀)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={skipExams}
                    onChange={(e) => setSkipExams(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>
                    <strong>정기고사 기간 제외</strong> (중간·기말고사 기간 수업 제외)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={skipVacations}
                    onChange={(e) => setSkipVacations(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>
                    <strong>방학 기간 제외</strong> (여름/겨울방학 날짜 자동 건너뜀)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={linkCurriculum}
                    onChange={(e) => setLinkCurriculum(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>
                    <strong>교육과정 단원 목록과 자동 연계</strong> (주제·내용 자동 입력)
                  </span>
                </label>
              </div>

              {/* Overwrite option */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className={overwriteExisting ? 'font-bold text-rose-700' : ''}>
                    해당 기간에 이미 등록된 수업이 있다면 모두 지우고 새로 덮어쓰기
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('timetable')}
                  className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  주간 시간표 확인 및 수정 &rarr;
                </button>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="border-2 border-emerald-500/40 bg-emerald-50/40 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">실시간 일괄 등록 사전 분석 요약</h4>
                </div>
                <div className="text-xs text-slate-500">
                  {startDate} ~ {endDate} ({previewData.totalDays}일)
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500">실제 수업 가능일</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {previewData.schoolDays}일
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500">제외된 휴무/시험일</div>
                  <div className="text-lg font-black text-amber-600 mt-0.5">
                    {previewData.skippedDays}일
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500">주당 배당 시수</div>
                  <div className="text-lg font-black text-blue-600 mt-0.5">
                    주 {localSlots.length}시간
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500">총 생성 예정 수업</div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">
                    총 {previewData.lessonsList.length}차시
                  </div>
                </div>
              </div>

              {/* Class by class breakdown pills */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  학급별 등록 예정 차시 수:
                </div>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const count = previewData.classCounts[cls.id] || 0;
                    return (
                      <div
                        key={cls.id}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 bg-white"
                        style={{ borderColor: cls.borderCol }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cls.color }}
                        />
                        <span className="text-slate-800">{cls.name}</span>
                        <span className="font-bold" style={{ color: cls.color }}>
                          {count}차시
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Success Notification message */}
              {statusMessage && (
                <div className="bg-emerald-600 text-white font-bold text-xs p-3 rounded-lg flex items-center gap-2 shadow-sm animate-pulse">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Execute Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  취소
                </button>

                <button
                  type="button"
                  onClick={handleExecuteBatchPopulate}
                  disabled={previewData.lessonsList.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2 hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>한 학기 수업 일괄 등록 실행하기 ({previewData.lessonsList.length}개)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Weekly Timetable Setup Grid */}
        {activeTab === 'timetable' && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  월~금 주간 배당 시간표 매트릭스
                </h4>
                <p className="text-xs text-slate-500">
                  선생님이 매주 수업하시는 요일 및 교시에 담당 학급을 선택하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('semesterBatch')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>이 시간표로 학기 일괄 등록하기</span>
              </button>
            </div>

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
                              className="w-full py-1.5 px-2 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
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

            {/* Notification */}
            {statusMessage && (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-xs p-3 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Timetable footer actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                현재 총 <strong>{localSlots.length}시간</strong>/주의 수업이 배정되어 있습니다.
              </span>
              <div className="flex items-center gap-2">
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
        )}
      </div>
    </div>
  );
};
