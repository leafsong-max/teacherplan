import React, { useState } from 'react';
import { ClassGroup, SchoolEvent, TeacherPlanState } from '../types';
import { CLASS_COLOR_PRESETS } from '../constants/presets';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Palette,
  Calendar,
  Layers,
  Settings,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TeacherPlanState;
  onUpdateState: (newState: Partial<TeacherPlanState>) => void;
  onResetToDemo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateState,
  onResetToDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'classes' | 'events' | 'data'>('classes');

  // General fields
  const [academicYear, setAcademicYear] = useState<number>(state.academicYear);
  const [subjectName, setSubjectName] = useState<string>(state.subjectName);
  const [targetGrade, setTargetGrade] = useState<string>(state.targetGrade);

  // Classes local state
  const [classes, setClasses] = useState<ClassGroup[]>(state.classes);

  // Events local state
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>(state.schoolEvents);

  // New event fields
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<'holiday' | 'exam' | 'event' | 'vacation'>('event');

  if (!isOpen) return null;

  // Class actions
  const handleAddClass = () => {
    const nextNum = classes.length + 1;
    const preset = CLASS_COLOR_PRESETS[(nextNum - 1) % CLASS_COLOR_PRESETS.length];
    const newClass: ClassGroup = {
      id: `class-${Date.now()}`,
      name: `${nextNum}반`,
      grade: targetGrade,
      color: preset.color,
      bgLight: preset.bgLight,
      borderCol: preset.borderCol,
      targetHours: 64,
    };
    setClasses([...classes, newClass]);
  };

  const handleUpdateClass = (id: string, updates: Partial<ClassGroup>) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDeleteClass = (id: string) => {
    if (classes.length <= 1) {
      alert('최소 1개 이상의 학급이 필요합니다.');
      return;
    }
    if (confirm('이 학급을 삭제하시겠습니까? 해당 학급의 수업 일지도 함께 삭제될 수 있습니다.')) {
      setClasses(classes.filter((c) => c.id !== id));
    }
  };

  const handleSelectColorPreset = (classId: string, presetIndex: number) => {
    const preset = CLASS_COLOR_PRESETS[presetIndex];
    handleUpdateClass(classId, {
      color: preset.color,
      bgLight: preset.bgLight,
      borderCol: preset.borderCol,
    });
  };

  // Event actions
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    const newEv: SchoolEvent = {
      id: `ev-${Date.now()}`,
      title: newEventTitle.trim(),
      date: newEventDate,
      type: newEventType,
      noClass: newEventType === 'holiday' || newEventType === 'vacation',
    };
    setSchoolEvents([...schoolEvents, newEv]);
    setNewEventTitle('');
    setNewEventDate('');
  };

  const handleDeleteEvent = (id: string) => {
    setSchoolEvents(schoolEvents.filter((e) => e.id !== id));
  };

  // Save all
  const handleSaveAll = () => {
    onUpdateState({
      academicYear,
      subjectName,
      targetGrade,
      classes,
      schoolEvents,
    });
    onClose();
  };

  // Backup & Restore
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `티처플랜_수업진도_${academicYear}년_${subjectName}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.classes && parsed.lessons) {
            onUpdateState(parsed);
            alert('데이터를 성공적으로 복원했습니다!');
            onClose();
          } else {
            alert('올바른 티처플랜 백업 파일이 아닙니다.');
          }
        } catch (err) {
          alert('JSON 파일을 읽는 도중 오류가 발생했습니다.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">환경 설정 및 학급·학사일정 관리</h3>
              <p className="text-xs text-slate-400">
                학년도, 교과목, 담당 학급별 색상 태그 및 학사일정을 설정합니다.
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

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'classes'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            담당 학급 및 색상 태그 ({classes.length}개)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'general'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            기본 정보 (학년도·교과목)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'events'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            학사일정 및 공휴일 ({schoolEvents.length}개)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'data'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            데이터 백업 / 복원
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* TAB 1: Classes & Color Tags */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">담당 학급 목록 및 색상 지정</h4>
                  <p className="text-xs text-slate-500">
                    각 학급별 고유 색상 태그를 지정하면 달력 및 진도율 차트에 즉시 반영됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddClass}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>학급 추가</span>
                </button>
              </div>

              <div className="space-y-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Color circle preview */}
                      <span
                        className="w-5 h-5 rounded-full ring-2 ring-slate-100 shrink-0"
                        style={{ backgroundColor: cls.color }}
                      />

                      {/* Class Name */}
                      <input
                        type="text"
                        value={cls.name}
                        onChange={(e) => handleUpdateClass(cls.id, { name: e.target.value })}
                        className="w-20 text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 text-slate-800"
                        placeholder="반 이름"
                      />

                      {/* Target Hours */}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>목표 시수:</span>
                        <input
                          type="number"
                          value={cls.targetHours}
                          onChange={(e) =>
                            handleUpdateClass(cls.id, { targetHours: Number(e.target.value) })
                          }
                          className="w-14 text-xs font-semibold py-1 px-2 rounded-md border border-slate-300 text-center"
                        />
                        <span>차시</span>
                      </div>
                    </div>

                    {/* Color Presets Picker */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 mr-1">색상 태그:</span>
                      {CLASS_COLOR_PRESETS.map((preset, pIdx) => {
                        const isCurrent = cls.color === preset.color;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectColorPreset(cls.id, pIdx)}
                            className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                              isCurrent ? 'ring-2 ring-slate-900 scale-110 shadow-xs' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.color }}
                            title={preset.name}
                          />
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 ml-2 cursor-pointer"
                        title="학급 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학년도 (Academic Year)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                    className="w-32 text-xs py-2 px-3 rounded-lg border border-slate-300 font-bold"
                  />
                  <span className="text-xs text-slate-500">학년도 (3월 ~ 익년 2월 주기)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  교과목명 (Subject)
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="예: 통합과학, 문학, 한국사, 수학 I"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  담당 학년 (Grade)
                </label>
                <input
                  type="text"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value)}
                  placeholder="예: 2학년, 1학년"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          )}

          {/* TAB 3: School Events */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">학사일정 및 공휴일 등록</h4>
                <p className="text-xs text-slate-500">
                  시험 기간, 방학, 개교기념일 등을 등록하면 달력에 표시되며 수업 배치 시 참고할 수 있습니다.
                </p>
              </div>

              {/* Add event form */}
              <form
                onSubmit={handleAddEvent}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2"
              >
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="행사/공휴일명 (예: 개교기념일)"
                  className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white flex-1 min-w-[140px]"
                  required
                />
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
                  required
                />
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                  className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="event">일반 행사</option>
                  <option value="holiday">공휴일 / 휴업일 (수업 없음)</option>
                  <option value="exam">정기고사의 날 (지필평가)</option>
                  <option value="vacation">방학</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  일정 추가
                </button>
              </form>

              {/* Events list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {schoolEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          ev.type === 'holiday'
                            ? 'bg-rose-100 text-rose-800'
                            : ev.type === 'exam'
                            ? 'bg-amber-100 text-amber-800'
                            : ev.type === 'vacation'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ev.type === 'holiday'
                          ? '공휴일'
                          : ev.type === 'exam'
                          ? '시험'
                          : ev.type === 'vacation'
                          ? '방학'
                          : '행사'}
                      </span>
                      <span className="font-semibold text-slate-800">{ev.title}</span>
                      <span className="text-slate-400">
                        {ev.date}
                        {ev.endDate ? ` ~ ${ev.endDate}` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Data Backup & Restore */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">데이터 백업 및 초기화</h4>
                <p className="text-xs text-slate-500">
                  브라우저 로컬 저장소에 저장된 수업 계획 및 일지 데이터를 JSON 파일로 안전하게 백업하거나 복원합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">JSON 데이터 백업</span>
                  <span className="text-[11px] text-slate-400">파일로 다운로드</span>
                </button>

                <label className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">백업 파일 복원</span>
                  <span className="text-[11px] text-slate-400">JSON 파일 업로드</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        '샘플 데모 데이터로 재설정하시겠습니까? 현재 입력된 수정 내용이 기본값으로 초기화됩니다.'
                      )
                    ) {
                      onResetToDemo();
                      onClose();
                    }
                  }}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 flex flex-col items-center justify-center text-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw className="w-6 h-6 text-rose-600" />
                  <span className="text-xs font-bold text-rose-800">기본 샘플 데이터로 복원</span>
                  <span className="text-[11px] text-rose-600">초기 데모 데이터 재설정</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
          >
            설정 저장 완료
          </button>
        </div>
      </div>
    </div>
  );
};
