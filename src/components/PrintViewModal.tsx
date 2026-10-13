import React, { useState } from 'react';
import { ClassGroup, LessonLog, TeacherPlanState } from '../types';
import { X, Printer, Download, Filter } from 'lucide-react';
import { formatKoreanDate } from '../utils/calendar';

interface PrintViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TeacherPlanState;
}

export const PrintViewModal: React.FC<PrintViewModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.classes[0]?.id || ''
  );
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | 'all'>('1');

  if (!isOpen) return null;

  const currentClass = state.classes.find((c) => c.id === selectedClassId) || state.classes[0];

  // Filter lessons
  const filteredLessons = state.lessons
    .filter((l) => l.classId === selectedClassId)
    .filter((l) => {
      const month = parseInt(l.date.split('-')[1], 10);
      if (selectedSemester === '1') {
        return month >= 3 && month <= 7;
      } else if (selectedSemester === '2') {
        return month >= 8 || month <= 2;
      }
      return true;
    })
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : a.period - b.period));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col border border-slate-200 max-h-[90vh]">
        {/* Modal Toolbar - Hidden during print */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">교과 수업 진도표 인쇄 및 제출용 양식</h3>
              <p className="text-xs text-slate-400">
                학교 제출용 교과 진도 기록부 형식으로 깔끔하게 출력합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Class filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1 px-3 rounded-lg border border-slate-700 bg-slate-800 text-white text-xs font-semibold"
            >
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </option>
              ))}
            </select>

            {/* Semester filter */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="py-1 px-3 rounded-lg border border-slate-700 bg-slate-800 text-white text-xs font-semibold"
            >
              <option value="1">1학기</option>
              <option value="2">2학기</option>
              <option value="all">전체 학년도</option>
            </select>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / PDF 저장</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 overflow-y-auto bg-white print:p-0 print:overflow-visible">
          {/* Header Title for official doc */}
          <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl font-bold tracking-wider text-slate-900 mb-1">
              {state.academicYear}학년도 {selectedSemester === '1' ? '1학기' : selectedSemester === '2' ? '2학기' : ''}{' '}
              교과 수업 진도 및 실시 기록부
            </h1>
            <div className="flex justify-between items-center text-xs text-slate-600 mt-3 font-medium">
              <div>
                <span>
                  <strong>교과목:</strong> {state.subjectName}
                </span>
                <span className="mx-2">|</span>
                <span>
                  <strong>대상:</strong> {state.targetGrade} {currentClass?.name}
                </span>
              </div>
              <div>
                <span>
                  <strong>총 실시 차시:</strong>{' '}
                  {filteredLessons.filter((l) => l.status === 'completed').length} /{' '}
                  {currentClass?.targetHours || 64}차시
                </span>
                <span className="mx-2">|</span>
                <span>
                  <strong>진도율:</strong>{' '}
                  {Math.round(
                    (filteredLessons.filter((l) => l.status === 'completed').length /
                      (currentClass?.targetHours || 64)) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-center font-bold text-slate-800">
                <th className="border border-slate-300 py-2 px-1 w-12">순번</th>
                <th className="border border-slate-300 py-2 px-2 w-28">날짜 (요일)</th>
                <th className="border border-slate-300 py-2 px-1 w-14">교시</th>
                <th className="border border-slate-300 py-2 px-1 w-14">차시</th>
                <th className="border border-slate-300 py-2 px-3 w-40">단원명</th>
                <th className="border border-slate-300 py-2 px-3">학습 주제 및 교수학습 활동</th>
                <th className="border border-slate-300 py-2 px-2 w-20">평가/과제</th>
                <th className="border border-slate-300 py-2 px-1 w-16">진행상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    선택한 학기 및 학급에 등록된 수업 일지가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLessons.map((l, index) => {
                  return (
                    <tr key={l.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                      <td className="border border-slate-300 py-2 px-1 text-center font-semibold text-slate-600">
                        {index + 1}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center text-slate-700 whitespace-nowrap">
                        {l.date}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-medium">
                        {l.period}교시
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-bold text-slate-800">
                        {l.lessonOrder}
                      </td>
                      <td className="border border-slate-300 py-2 px-3 font-medium text-slate-800">
                        {l.unit}
                        {l.subUnit && <span className="block text-[10px] text-slate-500">{l.subUnit}</span>}
                      </td>
                      <td className="border border-slate-300 py-2 px-3">
                        <span className="font-bold text-slate-900 block">{l.topic}</span>
                        {l.content && (
                          <span className="text-[11px] text-slate-600 block mt-0.5">{l.content}</span>
                        )}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center text-[10px]">
                        {l.isAssessment ? (
                          <span className="font-bold text-purple-700 block">수행평가</span>
                        ) : l.homework ? (
                          <span className="text-slate-600 truncate block">{l.homework}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 text-center font-bold text-[10px]">
                        {l.status === 'completed' ? (
                          <span className="text-emerald-700">완료</span>
                        ) : l.status === 'planned' ? (
                          <span className="text-blue-700">예정</span>
                        ) : l.status === 'cancelled' ? (
                          <span className="text-rose-600">휴강</span>
                        ) : (
                          <span className="text-purple-700">보강</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Teacher Signature Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div>출력 일시: {new Date().toLocaleDateString('ko-KR')}</div>
            <div className="text-right">
              담당 교사: ______________________ (인)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
