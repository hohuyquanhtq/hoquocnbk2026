import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, FileCode, ArrowRight, BookOpen } from 'lucide-react';
import { parseDocxFile, parseExamText, type ParseResult } from '../../utils/docxParser';
import { SAMPLE_CHEMISTRY_QUESTIONS, SAMPLE_WORD_TEXT } from '../../utils/sampleData';
import type { Question } from '../../types';

interface WordUploaderProps {
  onQuestionsLoaded: (questions: Question[]) => void;
  onNext: () => void;
}

export const WordUploader: React.FC<WordUploaderProps> = ({ onQuestionsLoaded, onNext }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawTextInput, setRawTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setErrorMsg('Vui lòng chọn file định dạng Word (.docx)');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const result = await parseDocxFile(file);
      setParseResult(result);
      if (result.questions.length > 0) {
        onQuestionsLoaded(result.questions);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể đọc file Word. Vui lòng kiểm tra lại file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseText = () => {
    if (!rawTextInput.trim()) {
      setErrorMsg('Vui lòng dán nội dung đề thi vào ô văn bản.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    try {
      const result = parseExamText(rawTextInput);
      setParseResult(result);
      if (result.questions.length > 0) {
        onQuestionsLoaded(result.questions);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi phân tích nội dung');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSampleExam = () => {
    setIsParsing(true);
    setErrorMsg(null);
    setTimeout(() => {
      onQuestionsLoaded(SAMPLE_CHEMISTRY_QUESTIONS);
      setParseResult({
        questions: SAMPLE_CHEMISTRY_QUESTIONS,
        totalParsed: SAMPLE_CHEMISTRY_QUESTIONS.length,
        validCount: SAMPLE_CHEMISTRY_QUESTIONS.length,
        warningCount: 0,
        warnings: [],
      });
      setIsParsing(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setInputMode('upload')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            inputMode === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tải file Word (.docx)
        </button>
        <button
          type="button"
          onClick={() => setInputMode('text')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            inputMode === 'text'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dán nội dung đề trực tiếp
        </button>
      </div>

      {inputMode === 'upload' ? (
        <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 rounded-2xl p-8 text-center transition-all">
          <input
            type="file"
            id="wordFileInput"
            accept=".docx,.doc"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Upload className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            Kéo thả hoặc nhấp để chọn file Word (.docx)
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            Hệ thống tự động đọc câu hỏi, phương án A, B, C, D, đáp án đúng và lời giải chi tiết.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="wordFileInput"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Chọn file từ máy tính</span>
            </label>

            <button
              type="button"
              onClick={handleLoadSampleExam}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Dùng đề thi mẫu Hóa Học (10 câu)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Dán nội dung đề thi vào đây:</label>
            <button
              type="button"
              onClick={() => setRawTextInput(SAMPLE_WORD_TEXT)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Dán nội dung mẫu
            </button>
          </div>
          <textarea
            rows={10}
            value={rawTextInput}
            onChange={e => setRawTextInput(e.target.value)}
            placeholder="Câu 1. Nội dung câu hỏi...&#10;A. Phương án A&#10;B. Phương án B&#10;C. Phương án C&#10;D. Phương án D&#10;Đáp án: B&#10;Hướng dẫn giải: ..."
            className="w-full p-4 text-xs font-mono border border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleParseText}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs"
          >
            Phân tích câu hỏi
          </button>
        </div>
      )}

      {/* Parsing progress */}
      {isParsing && (
        <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang phân tích cấu trúc câu hỏi, đáp án và lời giải...</span>
        </div>
      )}

      {/* Error display */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Parsing result banner */}
      {parseResult && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">
                Kết quả phân tích đề thi: {parseResult.totalParsed} câu hỏi
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                {parseResult.validCount} câu hoàn chỉnh
              </span>
              {parseResult.warningCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                  {parseResult.warningCount} câu cần kiểm tra lại
                </span>
              )}
            </div>
          </div>

          {parseResult.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Lưu ý định dạng đề:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {parseResult.warnings.slice(0, 4).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all"
            >
              <span>Xem và Chỉnh sửa câu hỏi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formatting Guide card */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h5 className="font-bold text-slate-800">Mẫu định dạng file Word chuẩn được hỗ trợ tốt nhất:</h5>
        <pre className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 leading-relaxed overflow-x-auto">
{`Câu 1. Đồng phân của glucozơ là:
A. Fructozơ
B. Saccarozơ
C. Mantozơ
D. Xenlulozơ
Đáp án: A
Hướng dẫn giải: Glucozơ và fructozơ đều có CTPT là C₆H₁₂O₆...`}
        </pre>
      </div>
    </div>
  );
};
