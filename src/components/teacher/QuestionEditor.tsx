import React from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { Question, QuestionType, QuestionOption } from '../../types';

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

const COMMON_SYMBOLS = ['²', '³', '₂', '₃', '₄', '⁺', '⁻', '°', '√', 'π', '±', '≤', '≥', '≠', '→', '⇌', 'Δ', 'α', 'β'];

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ questions, onChange }) => {

  const handleUpdateQuestion = (index: number, updated: Partial<Question>) => {
    const next = [...questions];
    const current = next[index];
    const merged = { ...current, ...updated };

    // Recheck errors
    if (merged.type === 'single_choice' || merged.type === 'multiple_choice') {
      if (!merged.correctAnswers || merged.correctAnswers.length === 0) {
        merged.hasError = true;
        merged.errorMessage = 'Chưa chọn đáp án đúng';
      } else {
        merged.hasError = false;
        merged.errorMessage = undefined;
      }
    }

    next[index] = merged;
    onChange(next);
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: questions.length + 1,
      content: '',
      type: 'single_choice',
      options: [
        { id: 'A', content: '' },
        { id: 'B', content: '' },
        { id: 'C', content: '' },
        { id: 'D', content: '' },
      ],
      correctAnswers: [],
      explanation: '',
      points: 1,
      hasError: true,
      errorMessage: 'Chưa nhập nội dung và chọn đáp án',
    };
    onChange([...questions, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Đề thi cần có ít nhất 1 câu hỏi.');
      return;
    }
    const next = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 }));
    onChange(next);
  };

  const handleCloneQuestion = (index: number) => {
    const target = questions[index];
    const cloned: Question = {
      ...target,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: index + 2,
    };
    const next = [...questions];
    next.splice(index + 1, 0, cloned);
    onChange(next.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...questions];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleToggleOptionAnswer = (qIndex: number, optionId: string) => {
    const q = questions[qIndex];
    if (q.type === 'single_choice' || q.type === 'true_false') {
      handleUpdateQuestion(qIndex, { correctAnswers: [optionId] });
    } else if (q.type === 'multiple_choice') {
      const current = q.correctAnswers || [];
      const nextAnswers = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      handleUpdateQuestion(qIndex, { correctAnswers: nextAnswers });
    }
  };

  const handleInsertSymbol = (qIndex: number, field: 'content' | 'explanation', symbol: string) => {
    const q = questions[qIndex];
    const currentVal = q[field] || '';
    handleUpdateQuestion(qIndex, { [field]: currentVal + symbol });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Danh sách câu hỏi ({questions.length} câu)</h3>
          <p className="text-xs text-slate-600">
            Nhấp chuột vào chữ cái A, B, C, D để đặt đáp án đúng. Các câu viền đỏ cần được bổ sung đáp án.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddQuestion}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi mới</span>
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const isError = q.hasError || !q.correctAnswers || q.correctAnswers.length === 0;

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs transition-all ${
                isError ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                    {qIndex + 1}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">Câu {qIndex + 1}</span>

                  {isError && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {q.errorMessage || 'Chưa chọn đáp án đúng'}
                    </span>
                  )}
                </div>

                {/* Question Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(qIndex, 'up')}
                    disabled={qIndex === 0}
                    title="Di chuyển lên"
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(qIndex, 'down')}
                    disabled={qIndex === questions.length - 1}
                    title="Di chuyển xuống"
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCloneQuestion(qIndex)}
                    title="Nhân bản câu này"
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    title="Xóa câu hỏi"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Type & Points */}
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dạng câu:</label>
                  <select
                    value={q.type}
                    onChange={e => handleUpdateQuestion(qIndex, { type: e.target.value as QuestionType })}
                    className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-blue-600"
                  >
                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                    <option value="multiple_choice">Nhiều đáp án đúng</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="short_answer">Điền đáp án ngắn</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm:</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={q.points || 1}
                    onChange={e => handleUpdateQuestion(qIndex, { points: parseFloat(e.target.value) || 1 })}
                    className="w-16 px-2 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-800 text-center"
                  />
                </div>

                {/* Quick math/chem symbol insertion */}
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  <span className="text-[11px] text-slate-400 font-medium">Chèn nhanh:</span>
                  {COMMON_SYMBOLS.slice(0, 10).map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleInsertSymbol(qIndex, 'content', sym)}
                      className="px-1.5 py-0.5 text-xs bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded text-slate-700 font-mono transition-colors"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Content Input */}
              <div className="mb-4">
                <textarea
                  rows={2}
                  value={q.content}
                  onChange={e => handleUpdateQuestion(qIndex, { content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Options Section */}
              {q.type !== 'short_answer' ? (
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Các phương án lựa chọn:</span>
                    <span className="text-blue-600 font-normal">Nhấp chữ cái để chọn đáp án đúng</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correctAnswers?.includes(opt.id);

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-400'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleOptionAnswer(qIndex, opt.id)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-700 hover:bg-blue-100 hover:text-blue-700'
                            }`}
                            title={`Chọn ${opt.id} là đáp án đúng`}
                          >
                            {isCorrect ? <Check className="w-4 h-4" /> : opt.id}
                          </button>

                          <input
                            type="text"
                            value={opt.content}
                            onChange={e => {
                              const newOpts = [...q.options];
                              newOpts[optIndex] = { ...opt, content: e.target.value };
                              handleUpdateQuestion(qIndex, { options: newOpts });
                            }}
                            placeholder={`Phương án ${opt.id}...`}
                            className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Short answer standard */
                <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <label className="text-xs font-semibold text-blue-900 block mb-1">
                    Đáp án chuẩn chấp nhận (nếu có nhiều phương án đúng, cách nhau bằng dấu chấm phẩy ;):
                  </label>
                  <input
                    type="text"
                    value={q.correctAnswers?.join('; ') || ''}
                    onChange={e => {
                      const answers = e.target.value.split(';').map(s => s.trim()).filter(Boolean);
                      handleUpdateQuestion(qIndex, { correctAnswers: answers });
                    }}
                    placeholder="Ví dụ: 15.5; 15,5; mười lăm phẩy năm"
                    className="w-full px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-lg text-slate-800"
                  />
                </div>
              )}

              {/* Explanation / Solution */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Hướng dẫn giải chi tiết (hiển thị khi học sinh đạt ngưỡng điểm):
                </label>
                <textarea
                  rows={2}
                  value={q.explanation || ''}
                  onChange={e => handleUpdateQuestion(qIndex, { explanation: e.target.value })}
                  placeholder="Nhập lời giải thích chi tiết từng bước, định lý áp dụng..."
                  className="w-full px-3 py-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={handleAddQuestion}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Thêm câu hỏi mới vào cuối đề</span>
        </button>
      </div>
    </div>
  );
};
