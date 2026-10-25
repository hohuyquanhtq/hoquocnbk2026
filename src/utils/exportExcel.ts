import * as XLSX from 'xlsx';
import type { QuizAttempt, Quiz } from '../types';

export function exportAttemptsToExcel(attempts: QuizAttempt[], quiz: Quiz) {
  // 1. Prepare main table data
  const rows = attempts.map((attempt, index) => {
    const mins = Math.floor(attempt.durationSeconds / 60);
    const secs = attempt.durationSeconds % 60;
    const durationFormatted = `${mins}m ${secs}s`;

    return {
      'STT': index + 1,
      'Họ và tên': attempt.studentName,
      'Lớp': attempt.studentClass,
      'Trường': attempt.studentSchool || '—',
      'Điểm số': attempt.score,
      'Thang điểm': attempt.maxScore,
      'Số câu đúng': attempt.correctCount,
      'Số câu sai': attempt.wrongCount,
      'Chưa làm': attempt.unansweredCount,
      'Đạt ngưỡng xem giải': attempt.passedThreshold ? 'Đạt' : 'Chưa đạt',
      'Thời gian làm': durationFormatted,
      'Thời điểm nộp': new Date(attempt.submittedAt).toLocaleString('vi-VN'),
    };
  });

  // Calculate statistics
  const total = attempts.length;
  const scores = attempts.map(a => a.score);
  const avgScore = total > 0 ? (scores.reduce((a, b) => a + b, 0) / total).toFixed(2) : 0;
  const maxScore = total > 0 ? Math.max(...scores) : 0;
  const minScore = total > 0 ? Math.min(...scores) : 0;
  const passCount = attempts.filter(a => a.score >= (quiz.minScoreToViewAnswers || 5)).length;
  const passRate = total > 0 ? ((passCount / total) * 100).toFixed(1) + '%' : '0%';

  // Summary sheet data
  const summaryRows = [
    { 'Chỉ tiêu': 'Tên đề thi', 'Giá trị': quiz.title },
    { 'Chỉ tiêu': 'Mã đề', 'Giá trị': quiz.code },
    { 'Chỉ tiêu': 'Môn học', 'Giá trị': quiz.subject },
    { 'Chỉ tiêu': 'Khối lớp', 'Giá trị': quiz.grade },
    { 'Chỉ tiêu': 'Giáo viên', 'Giá trị': quiz.teacherName },
    { 'Chỉ tiêu': 'Tổng số lượt làm bài', 'Giá trị': total },
    { 'Chỉ tiêu': 'Điểm trung bình', 'Giá trị': avgScore },
    { 'Chỉ tiêu': 'Điểm cao nhất', 'Giá trị': maxScore },
    { 'Chỉ tiêu': 'Điểm thấp nhất', 'Giá trị': minScore },
    { 'Chỉ tiêu': 'Tỷ lệ đạt ngưỡng (≥ ' + quiz.minScoreToViewAnswers + 'đ)', 'Giá trị': passRate },
    { 'Chỉ tiêu': 'Ngày xuất báo cáo', 'Giá trị': new Date().toLocaleString('vi-VN') },
  ];

  // 2. Create workbook
  const wb = XLSX.utils.book_new();

  // Add submissions sheet
  const wsAttempts = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsAttempts, 'Danh sách kết quả');

  // Add summary sheet
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Thống kê tổng quan');

  // 3. Save file
  const safeTitle = quiz.title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 30);
  const fileName = `Ket_Qua_${quiz.code}_${safeTitle}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
