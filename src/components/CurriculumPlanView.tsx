import React, { useState } from 'react';
import { ClassGroup, CurriculumItem, LessonLog } from '../types';
import { Plus, BookOpen, Trash2, Edit2, Check, Clock, Sparkles } from 'lucide-react';

interface CurriculumPlanViewProps {
  curriculum: CurriculumItem[];
  classes: ClassGroup[];
  lessons: LessonLog[];
  onAddCurriculumItem: (item: CurriculumItem) => void;
  onUpdateCurriculumItem: (item: CurriculumItem) => void;
  onDeleteCurriculumItem: (itemId: string) => void;
}

export const CurriculumPlanView: React.FC<CurriculumPlanViewProps> = ({
  curriculum,
  classes,
  lessons,
  onAddCurriculumItem,
  onUpdateCurriculumItem,
  onDeleteCurriculumItem,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [order, setOrder] = useState<number>(curriculum.length + 1);
  const [unit, setUnit] = useState<string>('');
  const [subUnit, setSubUnit] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [materials, setMaterials] = useState<string>('');

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setOrder(curriculum.length + 1);
    const last = curriculum[curriculum.length - 1];
    setUnit(last ? last.unit : 'I. 새로운 단원');
    setSubUnit(last ? last.subUnit || '' : '');
    setTopic('');
    setContent('');
    setMaterials('');
  };

  const handleStartEdit = (item: CurriculumItem) => {
    setEditingId(item.id);
    setIsAdding(false);
    setOrder(item.order);
    setUnit(item.unit);
    setSubUnit(item.subUnit || '');
    setTopic(item.topic);
    setContent(item.content);
    setMaterials(item.materials || '');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (editingId) {
      onUpdateCurriculumItem({
        id: editingId,
        order,
        unit: unit.trim(),
        subUnit: subUnit.trim(),
        topic: topic.trim(),
        content: content.trim(),
        materials: materials.trim(),
      });
      setEditingId(null);
    } else {
      onAddCurriculumItem({
        id: `curr-${Date.now()}`,
        order,
        unit: unit.trim(),
        subUnit: subUnit.trim(),
        topic: topic.trim(),
        content: content.trim(),
        materials: materials.trim(),
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              연간 교과 단원 진도 계획서 (Syllabus)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            교과목의 대단원·소단원·차시별 학습 주제를 체계적으로 수립하고, 각 학급의 실제 완료 현황을 추적합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>새 차시 계획 추가</span>
        </button>
      </div>

      {/* Add or Edit Box */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white rounded-xl p-5 border-2 border-emerald-500 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-bold text-slate-900">
              {editingId ? '단원 진도 항목 수정' : '새 단원 진도 계획 추가'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">차시</label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                required
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">대단원명</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="예: I. 물질과 규칙성"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                required
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">소단원명</label>
              <input
                type="text"
                value={subUnit}
                onChange={(e) => setSubUnit(e.target.value)}
                placeholder="예: 1. 원소들의 주기성"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">학습 주제</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 빅뱅 우주론과 원소의 형성"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-semibold"
                required
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">준비물 및 자료</label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="예: 스펙트럼 분광기 키트, 활동지"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              교수학습 활동 및 내용
            </label>
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="단원 계획에 포함될 핵심 성취기준 및 활동 내용을 입력하세요."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
            >
              저장
            </button>
          </div>
        </form>
      )}

      {/* Curriculum List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3 px-3 font-semibold text-slate-600 text-center w-14">차시</th>
                <th className="py-3 px-3 font-semibold text-slate-600 w-48">단원</th>
                <th className="py-3 px-3 font-semibold text-slate-600">학습 주제 및 교수학습 활동</th>
                <th className="py-3 px-3 font-semibold text-slate-600 w-44">준비물 / 자료</th>
                <th className="py-3 px-3 font-semibold text-slate-600 w-52 text-center">
                  학급별 완료 상태
                </th>
                <th className="py-3 px-3 font-semibold text-slate-600 text-right w-20">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {curriculum.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {item.order}차시
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.unit}</div>
                      {item.subUnit && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.subUnit}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.topic}</div>
                      {item.content && (
                        <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                          {item.content}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{item.materials || '-'}</td>
                    {/* Classes completion indicators */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {classes.map((cls) => {
                          const completed = lessons.some(
                            (l) =>
                              l.classId === cls.id &&
                              l.lessonOrder === item.order &&
                              l.status === 'completed'
                          );

                          return (
                            <span
                              key={cls.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 border ${
                                completed
                                  ? 'text-white border-transparent'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                              }`}
                              style={{
                                backgroundColor: completed ? cls.color : undefined,
                              }}
                              title={`${cls.name}: ${completed ? '완료' : '미완료'}`}
                            >
                              {cls.name}
                              {completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`${item.order}차시 계획을 삭제하시겠습니까?`)) {
                              onDeleteCurriculumItem(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
