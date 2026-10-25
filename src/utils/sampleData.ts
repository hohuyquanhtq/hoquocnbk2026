import type { Question } from '../types';

export const SAMPLE_CHEMISTRY_QUESTIONS: Question[] = [
  {
    id: 'q1',
    order: 1,
    content: 'Chất nào sau đây là đồng phân của glucozơ (C₆H₁₂O₆)?',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'Fructozơ' },
      { id: 'B', content: 'Saccarozơ' },
      { id: 'C', content: 'Mantozơ' },
      { id: 'D', content: 'Xenlulozơ' }
    ],
    correctAnswers: ['A'],
    explanation: 'Glucozơ và fructozơ đều có cùng công thức phân tử là C₆H₁₂O₆ nhưng khác nhau về cấu tạo phân tử (glucozơ là polihiđroxi anđehit, còn fructozơ là polihiđroxi xeton) nên chúng là đồng phân của nhau.',
    points: 1
  },
  {
    id: 'q2',
    order: 2,
    content: 'Kim loại nào sau đây có tính dẫn điện tốt nhất ở điều kiện thường?',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'Đồng (Cu)' },
      { id: 'B', content: 'Bạc (Ag)' },
      { id: 'C', content: 'Vàng (Au)' },
      { id: 'D', content: 'Nhôm (Al)' }
    ],
    correctAnswers: ['B'],
    explanation: 'Thứ tự dẫn điện giảm dần của các kim loại thông dụng là: Ag > Cu > Au > Al > Fe. Do đó, Bạc (Ag) là kim loại dẫn điện tốt nhất.',
    points: 1
  },
  {
    id: 'q3',
    order: 3,
    content: 'Cho phương trình nhiệt hóa học: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) với ΔᵣH°₂₉₈ = -92 kJ. Để cân bằng chuyển dịch theo chiều thuận, ta cần tác động những yếu tố nào sau đây?',
    type: 'multiple_choice',
    options: [
      { id: 'A', content: 'Tăng áp suất chung của hệ' },
      { id: 'B', content: 'Giảm nhiệt độ của hệ' },
      { id: 'C', content: 'Tăng nhiệt độ của hệ' },
      { id: 'D', content: 'Thêm chất xúc tác Fe' }
    ],
    correctAnswers: ['A', 'B'],
    explanation: 'Phản ứng thuận là phản ứng tỏa nhiệt (ΔH < 0) và có sự giảm số mol khí (4 mol khí → 2 mol khí). Theo nguyên lý Le Chatelier: Khi giảm nhiệt độ, cân bằng chuyển dịch theo chiều tỏa nhiệt (chiều thuận); Khi tăng áp suất, cân bằng chuyển dịch theo chiều giảm số mol khí (chiều thuận). Chất xúc tác chỉ làm tăng tốc độ phản ứng, không làm dịch chuyển cân bằng.',
    points: 1
  },
  {
    id: 'q4',
    order: 4,
    content: 'Dung dịch làm quỳ tím chuyển sang màu đỏ là:',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'NaOH' },
      { id: 'B', content: 'HCl' },
      { id: 'C', content: 'NaCl' },
      { id: 'D', content: 'Ba(OH)₂' }
    ],
    correctAnswers: ['B'],
    explanation: 'Axit clohiđric (HCl) là axit mạnh phân li hoàn toàn tạo ion H⁺ trong nước làm quỳ tím hóa đỏ. NaOH và Ba(OH)₂ là bazơ làm quỳ tím hóa xanh. NaCl là muối trung tính không làm đổi màu quỳ.',
    points: 1
  },
  {
    id: 'q5',
    order: 5,
    content: 'Khi cho lá Fe vào dung dịch CuSO₄, hiện tượng quan sát được là:',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'Có khí thoát ra, dung dịch chuyển sang màu đỏ' },
      { id: 'B', content: 'Có lớp kim loại màu đỏ bám ngoài lá Fe, màu xanh của dung dịch nhạt dần' },
      { id: 'C', content: 'Lá Fe tan hoàn toàn không có chất rắn bám vào' },
      { id: 'D', content: 'Dung dịch chuyển sang màu tím đậm' }
    ],
    correctAnswers: ['B'],
    explanation: 'Phương trình hóa học: Fe + CuSO₄ → FeSO₄ + Cu↓. Kim loại Cu sinh ra có màu đỏ bám trên bề mặt đinh Fe, ion Cu²⁺ (màu xanh lam) bị khử thành Cu nên màu xanh của dung dịch nhạt dần.',
    points: 1
  },
  {
    id: 'q6',
    order: 6,
    content: 'Khí nào sau đây là nguyên nhân chính gây ra hiệu ứng nhà kính làm trái đất nóng lên?',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'O₂' },
      { id: 'B', content: 'N₂' },
      { id: 'C', content: 'CO₂' },
      { id: 'D', content: 'H₂' }
    ],
    correctAnswers: ['C'],
    explanation: 'Khí cacbon đioxit (CO₂) cùng với khí metan (CH₄) và hơi nước là các khí nhà kính chủ yếu giữ nhiệt bức xạ hồng ngoại của trái đất, trong đó lượng CO₂ phát thải từ hoạt động công nghiệp là nguyên nhân nhân tạo lớn nhất.',
    points: 1
  },
  {
    id: 'q7',
    order: 7,
    content: 'Hợp chất hữu cơ nào sau đây tác dụng được với dung dịch AgNO₃ trong NH₃ sinh ra kết tủa Ag trắng sáng (phản ứng tráng bạc)?',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'Anđehit axetic (CH₃CHO)' },
      { id: 'B', content: 'Axit axetic (CH₃COOH)' },
      { id: 'C', content: 'Rượu etylic (C₂H₅OH)' },
      { id: 'D', content: 'Etyl axetat (CH₃COOC₂H₅)' }
    ],
    correctAnswers: ['A'],
    explanation: 'Anđehit axetic CH₃CHO có nhóm chức anđehit (-CHO) nên có khả năng tham gia phản ứng tráng bạc: CH₃CHO + 2AgNO₃ + 3NH₃ + H₂O → CH₃COONH₄ + 2Ag↓ + 2NH₄NO₃.',
    points: 1
  },
  {
    id: 'q8',
    order: 8,
    content: 'Polymer nào sau đây được dùng để sản xuất chai nhựa đựng nước ngọt, hộp đựng thực phẩm tiện lợi?',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'Poly(etylen terephtalat) (PET)' },
      { id: 'B', content: 'Cao su buna' },
      { id: 'C', content: 'Nilon-6,6' },
      { id: 'D', content: 'Tơ tằm' }
    ],
    correctAnswers: ['A'],
    explanation: 'PET (Polyethylene terephthalate) là loại nhựa nhiệt dẻo trong suốt, bền cơ học cao, an toàn cho thực phẩm và đồ uống nên được dùng rất phổ biến làm chai nước uống.',
    points: 1
  },
  {
    id: 'q9',
    order: 9,
    content: 'Độ pH của dung dịch máu người bình thường duy trì trong khoảng nào sau đây?',
    type: 'single_choice',
    options: [
      { id: 'A', content: '1.5 - 2.5' },
      { id: 'B', content: '5.5 - 6.5' },
      { id: 'C', content: '7.35 - 7.45' },
      { id: 'D', content: '9.0 - 10.0' }
    ],
    correctAnswers: ['C'],
    explanation: 'Máu người có tính kiềm nhẹ, pH được điều hòa rất chặt chẽ trong khoảng 7.35 đến 7.45 nhờ các hệ đệm bicacbonat, photphat và protein.',
    points: 1
  },
  {
    id: 'q10',
    order: 10,
    content: 'Chất béo là trieste của axit béo với hợp chất nào sau đây?',
    type: 'single_choice',
    options: [
      { id: 'A', content: 'Metanol' },
      { id: 'B', content: 'Etylen glicol' },
      { id: 'C', content: 'Glixerol (C₃H₅(OH)₃)' },
      { id: 'D', content: 'Phenol' }
    ],
    correctAnswers: ['C'],
    explanation: 'Định nghĩa: Chất béo là trieste của glixerol với các axit béo (axit monocacboxylic có mạch C dài, không phân nhánh), có công thức chung là (RCOO)₃C₃H₅.',
    points: 1
  }
];

export const SAMPLE_WORD_TEXT = `Câu 1. Chất nào sau đây là đồng phân của glucozơ (C₆H₁₂O₆)?
A. Fructozơ
B. Saccarozơ
C. Mantozơ
D. Xenlulozơ
Đáp án: A
Hướng dẫn giải: Glucozơ và fructozơ đều có cùng công thức phân tử C₆H₁₂O₆ nhưng khác nhau về cấu tạo nên là đồng phân của nhau.

Câu 2. Kim loại nào sau đây có tính dẫn điện tốt nhất ở điều kiện thường?
A. Đồng (Cu)
B. Bạc (Ag)
C. Vàng (Au)
D. Nhôm (Al)
Đáp án: B
Hướng dẫn giải: Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe.

Câu 3. Cho phương trình nhiệt hóa học: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) với ΔᵣH°₂₉₈ = -92 kJ. Để cân bằng chuyển dịch theo chiều thuận, ta cần tác động những yếu tố nào?
A. Tăng áp suất chung của hệ
B. Giảm nhiệt độ của hệ
C. Tăng nhiệt độ của hệ
D. Thêm chất xúc tác Fe
Đáp án: A, B
Hướng dẫn giải: Phản ứng tỏa nhiệt và giảm thể tích khí nên tăng áp suất và giảm nhiệt độ làm dịch chuyển theo chiều thuận.

Câu 4. Dung dịch làm quỳ tím chuyển sang màu đỏ là:
A. NaOH
B. HCl
C. NaCl
D. Ba(OH)₂
Đáp án: B
Hướng dẫn giải: HCl là axit mạnh làm quỳ tím chuyển màu đỏ.

Câu 5. Khi cho lá Fe vào dung dịch CuSO₄, hiện tượng quan sát được là:
A. Có khí thoát ra
B. Có lớp kim loại màu đỏ bám ngoài lá Fe, màu xanh nhạt dần
C. Không có hiện tượng gì
D. Dung dịch chuyển sang màu tím
Đáp án: B
Hướng dẫn giải: Fe đẩy Cu ra khỏi dung dịch muối: Fe + CuSO₄ → FeSO₄ + Cu↓.
`;
