import React, { useState, useEffect } from 'react';
import { ClassGroup, CurriculumItem, LessonLog, LessonStatus } from '../types';
import { X, Trash2, Copy, Check, Clock, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { formatKoreanDate } from '../utils/calendar';

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson?: LessonLog | null; // if null, creating new
  initialDate?: string;
  classes: ClassGroup[];
  curriculum: CurriculumItem[];
  onSaveLesson: (lesson: LessonLog) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onBatchCopyLessons?: (baseLesson: LessonLog, targetClassIds: string[]) => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  isOpen,
  onClose,
  lesson,
  initialDate,
  classes,
  curriculum,
  onSaveLesson,
  onDeleteLesson,
  onBatchCopyLessons,
}) => {
  const [classId, setClassId] = useState<string>(classes[0]?.id || '');
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<number>(1);
  const [unit, setUnit] = useState<string>('');
  const [subUnit, setSubUnit] = useState<string>('');
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [topic, setTopic] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [materials, setMaterials] = useState<string>('');
  const [homework, setHomework] = useState<string>('');
  const [isAssessment, setIsAssessment] = useState<boolean>(false);
  const [assessmentTitle, setAssessmentTitle] = useState<string>('');
  const [status, setStatus] = useState<LessonStatus>('completed');
  const [memo, setMemo] = useState<string>('');

  // Batch copy state
  const [showBatchCopy, setShowBatchCopy] = useState<boolean>(false);
  const [selectedTargetClassIds, setSelectedTargetClassIds] = useState<string[]>([]);

  useEffect(() => {
    if (lesson) {
      setClassId(lesson.classId);
      setDate(lesson.date);
      setPeriod(lesson.period);
      setUnit(lesson.unit || '');
      setSubUnit(lesson.subUnit || '');
      setLessonOrder(lesson.lessonOrder || 1);
      setTopic(lesson.topic || '');
      setContent(lesson.content || '');
      setMaterials(lesson.materials || '');
      setHomework(lesson.homework || '');
      setIsAssessment(!!lesson.isAssessment);
      setAssessmentTitle(lesson.assessmentTitle || '');
      setStatus(lesson.status || 'completed');
      setMemo(lesson.memo || '');
    } else {
      // Default creation
      const today = initialDate || new Date().toISOString().split('T')[0];
      setDate(today);
      setClassId(classes[0]?.id || '');
      setPeriod(1);
      setUnit('');
      setSubUnit('');
      setLessonOrder(1);
      setTopic('');
      setContent('');
      setMaterials('');
      setHomework('');
      setIsAssessment(false);
      setAssessmentTitle('');
      setStatus('planned');
      setMemo('');
    }
    setShowBatchCopy(false);
    setSelectedTargetClassIds([]);
  }, [lesson, initialDate, classes, isOpen]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === classId) || classes[0];

  // Pick syllabus helper
  const handleSelectCurriculum = (currId: string) => {
    const item = curriculum.find((c) => c.id === currId);
    if (!item) return;
    setUnit(item.unit);
    setSubUnit(item.subUnit || '');
    setLessonOrder(item.order);
    setTopic(item.topic);
    setContent(item.content);
    if (item.materials) {
      setMaterials(item.materials);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('수업 주제를 입력해 주세요.');
      return;
    }

    const payload: LessonLog = {
      id: lesson ? lesson.id : `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId,
      date,
      period,
      unit,
      subUnit,
      lessonOrder,
      topic: topic.trim(),
      content: content.trim(),
      materials: materials.trim(),
      homework: homework.trim(),
      isAssessment,
      assessmentTitle: isAssessment ? assessmentTitle.trim() : undefined,
      status,
      memo: memo.trim(),
    };

    onSaveLesson(payload);

    // If batch copying to other classes
    if (showBatchCopy && selectedTargetClassIds.length > 0 && onBatchCopyLessons) {
      onBatchCopyLessons(payload, selectedTargetClassIds);
    }

    onClose();
  };

  const toggleTargetClass = (id: string) => {
    setSelectedTargetClassIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col my-8 border border-slate-200">
        {/* Header with class color strip */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: currentClass?.bgLight || '#f8fafc',
            borderColor: currentClass?.borderCol || '#e2e8f0',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: currentClass?.color || '#059669' }}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lesson ? '수업 일지 및 진도 수정' : '새 수업 등록'}
              </h3>
              <p className="text-xs text-slate-500">
                {formatKoreanDate(date)} · {currentClass?.name} {period}교시
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Class, Date, Period Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Class picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                담당 학급 <span className="text-rose-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                수업 날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            {/* Period picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                교시 <span className="text-rose-500">*</span>
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>
                    {p}교시
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Curriculum Selector */}
          {curriculum.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>교육과정 단원 계획에서 바로 채우기</span>
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectCurriculum(e.target.value);
                }}
                defaultValue=""
                className="text-xs py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-slate-700 max-w-full sm:max-w-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">단원 / 차시 선택...</option>
                {curriculum.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.order}차시] {c.topic}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unit & SubUnit & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                차시 번호
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={lessonOrder}
                  onChange={(e) => setLessonOrder(Number(e.target.value))}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
                <span className="text-xs text-slate-500 ml-1.5 shrink-0">차시</span>
              </div>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                대단원명
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="예: I. 물질과 규칙성"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                소단원명 (선택)
              </label>
              <input
                type="text"
                value={subUnit}
                onChange={(e) => setSubUnit(e.target.value)}
                placeholder="예: 2. 원소의 주기성"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              학습 주제 / 목표 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 원소들의 주기율표와 족·주기적 성질 탐구"
              required
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Teaching Content / Activities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              교수학습 활동 및 지도 내용
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="학생 활동, 판서 계획, 핵심 발문, 형성평가 내용 등을 자유롭게 기록하세요."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-hidden resize-none"
            />
          </div>

          {/* Materials & Prep */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                준비물 / 수업 기자재
              </label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="예: 활동지 3호, 태블릿, 분광기 키트"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                과제 / 피드백
              </label>
              <input
                type="text"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="예: 교과서 탐구활동 마무리 및 워크북 p.24"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Assessment toggle & Status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Assessment */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAssessment}
                  onChange={(e) => setIsAssessment(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">수행평가 수업</span>
              </label>
              {isAssessment && (
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="평가 항목명 (예: 실험 탐구 보고서)"
                  className="text-xs py-1 px-2.5 rounded-md border border-slate-300 bg-white"
                />
              )}
            </div>

            {/* Status Segmented control */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 px-2">진행 상태:</span>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  status === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                수업 완료
              </button>
              <button
                type="button"
                onClick={() => setStatus('planned')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  status === 'planned'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                계획
              </button>
              <button
                type="button"
                onClick={() => setStatus('supplementary')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  status === 'supplementary'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                보강
              </button>
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  status === 'cancelled'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                휴강/행사
              </button>
            </div>
          </div>

          {/* Batch Copy To Other Classes Feature */}
          <div className="border border-slate-200 rounded-lg p-3">
            <button
              type="button"
              onClick={() => setShowBatchCopy(!showBatchCopy)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span>다른 담당 학급에도 동일한 수업 내용 동시 등록하기</span>
              </div>
              <span className="text-blue-600 font-medium">
                {showBatchCopy ? '접기' : '펼치기'}
              </span>
            </button>

            {showBatchCopy && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-2">
                  같은 차시의 수업을 다른 반에도 동일하게 등록할 수 있습니다. 대상 학급을 선택하세요:
                </p>
                <div className="flex flex-wrap gap-2">
                  {classes
                    .filter((c) => c.id !== classId)
                    .map((c) => {
                      const isChecked = selectedTargetClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleTargetClass(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span>{c.name}</span>
                          {isChecked && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div>
              {lesson && onDeleteLesson && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('이 수업 일지를 삭제하시겠습니까?')) {
                      onDeleteLesson(lesson.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>수업 삭제</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                {lesson ? '수정 내용 저장' : '수업 등록 완료'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
