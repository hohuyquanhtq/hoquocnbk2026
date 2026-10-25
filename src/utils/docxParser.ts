import mammoth from 'mammoth';
import type { Question, QuestionOption, QuestionType } from '../types';

export interface ParseResult {
  questions: Question[];
  totalParsed: number;
  validCount: number;
  warningCount: number;
  warnings: string[];
}

/**
 * Extracts questions, options, answers, and explanations from text
 */
export function parseExamText(rawText: string): ParseResult {
  const warnings: string[] = [];
  const questions: Question[] = [];

  // Normalize line breaks & tabs
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' '); // Non-breaking spaces

  // Split text by "Câu [0-9]+" pattern
  // Regex to detect "Câu 1:", "Câu 1.", "Câu 1 -", "Bài 1:"
  const questionSplitter = /(?:^|\n)\s*(?:Câu|Bài)\s*([0-9]+)\s*[:.-]\s*/gi;

  const matches: { index: number; questionNumber: number; matchStr: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionSplitter.exec(text)) !== null) {
    matches.push({
      index: match.index,
      questionNumber: parseInt(match[1], 10),
      matchStr: match[0],
    });
  }

  if (matches.length === 0) {
    // If no "Câu X" was found, try splitting by lines starting with numbers like "1.", "1:"
    const altSplitter = /(?:^|\n)\s*([0-9]+)\s*[:.)-]\s+/g;
    while ((match = altSplitter.exec(text)) !== null) {
      matches.push({
        index: match.index,
        questionNumber: parseInt(match[1], 10),
        matchStr: match[0],
      });
    }
  }

  if (matches.length === 0) {
    return {
      questions: [],
      totalParsed: 0,
      validCount: 0,
      warningCount: 1,
      warnings: ['Không tìm thấy cấu trúc "Câu 1:", "Câu 2:" hoặc "1.", "2." trong tài liệu. Vui lòng kiểm tra định dạng file.'],
    };
  }

  const seenNumbers = new Set<number>();

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].matchStr.length;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const block = text.slice(start, end).trim();
    const qNum = matches[i].questionNumber;

    if (seenNumbers.has(qNum)) {
      warnings.push(`Trùng số thứ tự câu hỏi: Câu ${qNum}. Đã tự động đánh số lại.`);
    }
    seenNumbers.add(qNum);

    const parsedQuestion = parseSingleQuestionBlock(block, i + 1);
    questions.push(parsedQuestion);

    if (parsedQuestion.hasError && parsedQuestion.errorMessage) {
      warnings.push(`Câu ${i + 1}: ${parsedQuestion.errorMessage}`);
    }
  }

  const validCount = questions.filter(q => !q.hasError).length;
  const warningCount = questions.filter(q => q.hasError).length;

  return {
    questions,
    totalParsed: questions.length,
    validCount,
    warningCount,
    warnings,
  };
}

/**
 * Parses an individual question block into question text, options, answers, and explanation
 */
function parseSingleQuestionBlock(block: string, fallbackOrder: number): Question {
  let content = '';
  const options: QuestionOption[] = [];
  let correctAnswers: string[] = [];
  let explanation = '';
  let questionType: QuestionType = 'single_choice';
  let hasError = false;
  let errorMessage = '';

  // Extract explanation: "Hướng dẫn giải:", "Lời giải:", "Giải chi tiết:", "Gợi ý:"
  const explanationRegex = /(?:^|\n)\s*(?:Hướng dẫn giải|Lời giải|Giải chi tiết|Gợi ý|Giải)\s*[:.-]\s*([\s\S]*)$/i;
  let blockWithoutExp = block;
  const expMatch = block.match(explanationRegex);
  if (expMatch) {
    explanation = expMatch[1].trim();
    blockWithoutExp = block.slice(0, expMatch.index).trim();
  }

  // Extract Answer: "Đáp án:", "Đáp án đúng:", "Đ/A:"
  const answerRegex = /(?:^|\n)\s*(?:Đáp án đúng|Đáp án|Đ\/A|Key)\s*[:.-]\s*([^\n]+)/i;
  let blockWithoutAns = blockWithoutExp;
  const ansMatch = blockWithoutExp.match(answerRegex);
  if (ansMatch) {
    const rawAnswer = ansMatch[1].trim();
    blockWithoutAns = blockWithoutExp.slice(0, ansMatch.index).trim();

    // Check if it's multiple answers like "A, C" or "A và C"
    const mcAnswers = rawAnswer.match(/[A-D]/gi);
    if (mcAnswers && mcAnswers.length > 1) {
      questionType = 'multiple_choice';
      correctAnswers = Array.from(new Set(mcAnswers.map(a => a.toUpperCase())));
    } else if (mcAnswers && mcAnswers.length === 1) {
      questionType = 'single_choice';
      correctAnswers = [mcAnswers[0].toUpperCase()];
    } else if (/đúng|sai/i.test(rawAnswer)) {
      questionType = 'true_false';
      correctAnswers = [rawAnswer];
    } else {
      // Short answer or literal text
      correctAnswers = [rawAnswer];
      questionType = 'short_answer';
    }
  }

  // Check True/False sub-questions pattern: a) Đúng; b) Sai...
  const tfRegex = /(?:^|\n)\s*([a-d])\)\s*([^;\n]+)/gi;
  const tfMatches: { key: string; text: string }[] = [];
  let tfm: RegExpExecArray | null;
  while ((tfm = tfRegex.exec(blockWithoutAns)) !== null) {
    tfMatches.push({ key: tfm[1].toLowerCase(), text: tfm[2].trim() });
  }

  if (tfMatches.length >= 2 && !/[A-D]\.\s+/.test(blockWithoutAns)) {
    questionType = 'true_false';
    // The content is before the first a)
    const firstIndex = blockWithoutAns.search(/(?:^|\n)\s*[a-d]\)\s*/i);
    content = firstIndex > 0 ? blockWithoutAns.slice(0, firstIndex).trim() : blockWithoutAns;
    tfMatches.forEach(item => {
      options.push({
        id: item.key.toUpperCase(),
        content: item.text,
      });
    });
  } else {
    // Standard Multiple Choice options: A. B. C. D. or A) B) C) D)
    // Options might be on separate lines or on the same line (e.g., A. 5   B. 10   C. 15   D. 20)
    // We look for patterns like A. ... B. ...
    const optionRegex = /(?:^|\s|\n)([A-D])\s*[:.)-]\s*([\s\S]*?)(?=(?:(?:^|\s|\n)[A-D]\s*[:.)-]\s*)|$)/g;

    // Find the first option location
    const firstOptMatch = /(?:^|\s|\n)([A-D])\s*[:.)-]\s*/.exec(blockWithoutAns);
    if (firstOptMatch) {
      content = blockWithoutAns.slice(0, firstOptMatch.index).trim();
      const optionsPart = blockWithoutAns.slice(firstOptMatch.index);

      let optMatch: RegExpExecArray | null;
      while ((optMatch = optionRegex.exec(optionsPart)) !== null) {
        const optLetter = optMatch[1].toUpperCase();
        const optContent = optMatch[2].trim();
        // Avoid duplicate options for same letter
        if (!options.some(o => o.id === optLetter)) {
          options.push({
            id: optLetter,
            content: optContent,
          });
        }
      }
    } else {
      // No standard A, B, C, D found
      content = blockWithoutAns.trim();
    }
  }

  // Validate extracted data
  if (options.length === 0 && questionType !== 'short_answer') {
    hasError = true;
    errorMessage = 'Không tìm thấy các phương án lựa chọn (A, B, C, D).';
  } else if (options.length > 0 && options.length < 2) {
    hasError = true;
    errorMessage = 'Thiếu phương án lựa chọn (chỉ tìm thấy ít hơn 2 lựa chọn).';
  }

  if (correctAnswers.length === 0) {
    hasError = true;
    errorMessage = errorMessage
      ? `${errorMessage} Chưa có đáp án đúng.`
      : 'Chưa có đáp án đúng. Vui lòng chọn đáp án.';
  }

  return {
    id: `q_${fallbackOrder}_${Math.random().toString(36).substring(2, 7)}`,
    order: fallbackOrder,
    content: cleanSpecialChars(content),
    type: questionType,
    options: options.map(o => ({ ...o, content: cleanSpecialChars(o.content) })),
    correctAnswers,
    explanation: cleanSpecialChars(explanation),
    points: 1,
    hasError,
    errorMessage,
  };
}

/**
 * Clean and normalize mathematical and chemical formulas, accents, subscripts
 */
function cleanSpecialChars(text: string): string {
  if (!text) return '';
  return text
    // Normalize unicode accents
    .normalize('NFC')
    // Chemistry subscript formatting cleanup if already Unicode (H2O -> H₂O when indicated or keep clean)
    .replace(/<[^>]+>/g, '') // strip rogue raw html tags if any
    .trim();
}

/**
 * Main parser entry point for .docx File
 */
export async function parseDocxFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Try extracting raw text with mammoth
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value;

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('File Word rỗng hoặc không thể trích xuất văn bản.');
  }

  return parseExamText(rawText);
}
