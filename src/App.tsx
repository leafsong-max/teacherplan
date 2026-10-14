import React, { useState, useEffect } from 'react';
import {
  TeacherPlanState,
  LessonLog,
  CurriculumItem,
  TimetableSlot,
  ClassGroup,
  SchoolEvent,
} from './types';
import {
  INITIAL_CLASSES,
  INITIAL_CURRICULUM,
  INITIAL_SCHOOL_EVENTS,
  INITIAL_TIMETABLE,
} from './constants/presets';
import {
  getCurrentAcademicYearAndMonthIndex,
  getAcademicMonths,
  generateSeedLessons,
} from './utils/calendar';
import { Header, MainTab } from './components/Header';
import { MonthNavigation } from './components/MonthNavigation';
import { ClassFilterBar } from './components/ClassFilterBar';
import { CalendarView } from './components/CalendarView';
import { ProgressDashboard } from './components/ProgressDashboard';
import { CurriculumPlanView } from './components/CurriculumPlanView';
import { LessonDetailModal } from './components/LessonDetailModal';
import { WeeklyTimetableModal } from './components/WeeklyTimetableModal';
import { SettingsModal } from './components/SettingsModal';
import { PrintViewModal } from './components/PrintViewModal';

const STORAGE_KEY = 'teacher_plan_state_clean_v3';

export default function App() {
  const { academicYear: initialAcademicYear, monthIndex: initialMonthIndex } =
    getCurrentAcademicYearAndMonthIndex();

  // Load state from localStorage or start completely clean
  const [planState, setPlanState] = useState<TeacherPlanState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure clean state if previously loaded seed data
        return {
          ...parsed,
          lessons: parsed.lessons || [],
        };
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }

    const defaultClasses = INITIAL_CLASSES;

    return {
      academicYear: initialAcademicYear,
      currentSemester: initialMonthIndex < 5 ? '1' : '2',
      subjectName: '통합과학',
      targetGrade: '2학년',
      classes: defaultClasses,
      lessons: [], // Pristine, cleanly erased state as requested
      schoolEvents: INITIAL_SCHOOL_EVENTS,
      curriculum: INITIAL_CURRICULUM,
      timetable: INITIAL_TIMETABLE,
    };
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(planState));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [planState]);

  // Current view tabs
  const [activeTab, setActiveTab] = useState<MainTab>('calendar');

  // Month navigation: starts at current computer time month index
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(initialMonthIndex);

  // Class filtering: 'all' or specific classId
  const [selectedClassId, setSelectedClassId] = useState<string | 'all'>('all');

  // Calendar weekend visibility: default false (school days Mon-Fri)
  const [showWeekends, setShowWeekends] = useState<boolean>(false);

  // Modals state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeEditingLesson, setActiveEditingLesson] = useState<LessonLog | null>(null);
  const [targetLessonDate, setTargetLessonDate] = useState<string>('');

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Academic months list (March to next Feb)
  const months = getAcademicMonths(planState.academicYear);
  const currentMonthInfo = months[currentMonthIndex] || months[0];

  // Handlers for Lessons
  const handleOpenNewLesson = (presetDate?: string) => {
    setActiveEditingLesson(null);
    setTargetLessonDate(presetDate || `${currentMonthInfo.year}-${currentMonthInfo.month < 10 ? '0' + currentMonthInfo.month : currentMonthInfo.month}-15`);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonLog) => {
    setActiveEditingLesson(lesson);
    setTargetLessonDate(lesson.date);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = (savedLesson: LessonLog) => {
    setPlanState((prev) => {
      const exists = prev.lessons.some((l) => l.id === savedLesson.id);
      const updatedLessons = exists
        ? prev.lessons.map((l) => (l.id === savedLesson.id ? savedLesson : l))
        : [...prev.lessons, savedLesson];
      return { ...prev, lessons: updatedLessons };
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    setPlanState((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((l) => l.id !== lessonId),
    }));
  };

  const handleBatchCopyLessons = (baseLesson: LessonLog, targetClassIds: string[]) => {
    const additionalLessons: LessonLog[] = targetClassIds.map((targetId, idx) => ({
      ...baseLesson,
      id: `copy-${Date.now()}-${idx}`,
      classId: targetId,
      status: 'planned', // marked as planned for other classes
    }));

    setPlanState((prev) => ({
      ...prev,
      lessons: [...prev.lessons, ...additionalLessons],
    }));
  };

  // Auto-populate lessons from weekly timetable (supporting full semester batch)
  const handleAutoPopulateLessons = (
    newLessons: LessonLog[],
    replaceRange?: { start: string; end: string }
  ) => {
    setPlanState((prev) => {
      let base = prev.lessons;
      if (replaceRange) {
        // If replacing existing, remove lessons within the specified date range
        base = base.filter((l) => l.date < replaceRange.start || l.date > replaceRange.end);
      }
      // Remove overlapping slots
      const newKeys = new Set(newLessons.map((l) => `${l.date}-${l.period}-${l.classId}`));
      const existing = base.filter(
        (l) => !newKeys.has(`${l.date}-${l.period}-${l.classId}`)
      );
      return {
        ...prev,
        lessons: [...existing, ...newLessons],
      };
    });
  };

  // Curriculum Handlers
  const handleAddCurriculumItem = (item: CurriculumItem) => {
    setPlanState((prev) => ({
      ...prev,
      curriculum: [...prev.curriculum, item],
    }));
  };

  const handleUpdateCurriculumItem = (item: CurriculumItem) => {
    setPlanState((prev) => ({
      ...prev,
      curriculum: prev.curriculum.map((c) => (c.id === item.id ? item : c)),
    }));
  };

  const handleDeleteCurriculumItem = (itemId: string) => {
    setPlanState((prev) => ({
      ...prev,
      curriculum: prev.curriculum.filter((c) => c.id !== itemId),
    }));
  };

  // Timetable update
  const handleUpdateTimetable = (timetable: TimetableSlot[]) => {
    setPlanState((prev) => ({ ...prev, timetable }));
  };

  // Update State partially from Settings
  const handleUpdateState = (newState: Partial<TeacherPlanState>) => {
    setPlanState((prev) => ({ ...prev, ...newState }));
  };

  // Reset to initial demo
  const handleResetToDemo = () => {
    const defaultYear = 2026;
    const defaultClasses = INITIAL_CLASSES;
    const seedLessons = generateSeedLessons(defaultYear, defaultClasses);
    setPlanState({
      academicYear: defaultYear,
      currentSemester: '1',
      subjectName: '통합과학',
      targetGrade: '2학년',
      classes: defaultClasses,
      lessons: seedLessons,
      schoolEvents: INITIAL_SCHOOL_EVENTS,
      curriculum: INITIAL_CURRICULUM,
      timetable: INITIAL_TIMETABLE,
    });
    setCurrentMonthIndex(0);
    setSelectedClassId('all');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Top Header */}
      <Header
        academicYear={planState.academicYear}
        subjectName={planState.subjectName}
        targetGrade={planState.targetGrade}
        currentSemester={planState.currentSemester}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewLesson={() => handleOpenNewLesson()}
        onOpenTimetable={() => setIsTimetableModalOpen(true)}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* 2. Main Content based on Tab */}
      {activeTab === 'calendar' && (
        <main className="flex-1 flex flex-col">
          {/* 12-Month Navigation Bar (March to Next Feb with Wheel hint) */}
          <MonthNavigation
            months={months}
            currentMonthIndex={currentMonthIndex}
            onSelectMonthIndex={setCurrentMonthIndex}
            academicYear={planState.academicYear}
            lessons={planState.lessons}
          />

          {/* Class Filter Bar with color tags, progress rates, and weekend switch */}
          <ClassFilterBar
            classes={planState.classes}
            lessons={planState.lessons}
            selectedClassId={selectedClassId}
            onSelectClassId={setSelectedClassId}
            showWeekends={showWeekends}
            onToggleWeekends={() => setShowWeekends(!showWeekends)}
            onOpenNewLesson={() => handleOpenNewLesson()}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenTimetable={() => setIsTimetableModalOpen(true)}
          />

          {/* Full-width Calendar Grid with mouse wheel month scrolling */}
          <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-2 sm:p-4">
            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-300 shadow-xs bg-white min-h-[620px]">
              <CalendarView
                currentMonth={currentMonthInfo}
                classes={planState.classes}
                lessons={planState.lessons}
                schoolEvents={planState.schoolEvents}
                selectedClassId={selectedClassId}
                showWeekends={showWeekends}
                onSelectMonthIndex={setCurrentMonthIndex}
                onOpenLessonDetail={handleOpenEditLesson}
                onAddLessonForDate={(dateStr) => handleOpenNewLesson(dateStr)}
              />
            </div>
          </div>
        </main>
      )}

      {activeTab === 'progress' && (
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <ProgressDashboard
            classes={planState.classes}
            lessons={planState.lessons}
            curriculum={planState.curriculum}
            academicYear={planState.academicYear}
            subjectName={planState.subjectName}
            targetGrade={planState.targetGrade}
            onSelectClass={(classId) => {
              setSelectedClassId(classId);
              setActiveTab('calendar');
            }}
            onOpenNewLesson={() => handleOpenNewLesson()}
          />
        </main>
      )}

      {activeTab === 'curriculum' && (
        <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <CurriculumPlanView
            curriculum={planState.curriculum}
            classes={planState.classes}
            lessons={planState.lessons}
            onAddCurriculumItem={handleAddCurriculumItem}
            onUpdateCurriculumItem={handleUpdateCurriculumItem}
            onDeleteCurriculumItem={handleDeleteCurriculumItem}
          />
        </main>
      )}

      {/* 3. Modals */}
      {/* Lesson Detail / Create Modal */}
      <LessonDetailModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        lesson={activeEditingLesson}
        initialDate={targetLessonDate}
        classes={planState.classes}
        curriculum={planState.curriculum}
        onSaveLesson={handleSaveLesson}
        onDeleteLesson={handleDeleteLesson}
        onBatchCopyLessons={handleBatchCopyLessons}
      />

      {/* Weekly Timetable Modal */}
      <WeeklyTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        classes={planState.classes}
        curriculum={planState.curriculum}
        timetable={planState.timetable}
        schoolEvents={planState.schoolEvents}
        academicYear={planState.academicYear}
        onUpdateTimetable={handleUpdateTimetable}
        onAutoPopulateLessons={handleAutoPopulateLessons}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        state={planState}
        onUpdateState={handleUpdateState}
        onResetToDemo={handleResetToDemo}
        onClearAllLessons={() => setPlanState((prev) => ({ ...prev, lessons: [] }))}
      />

      {/* Print View Modal */}
      <PrintViewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        state={planState}
      />
    </div>
  );
}
