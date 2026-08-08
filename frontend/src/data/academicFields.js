// Canonical academic fields, keyed by the same IDs the backend normalizes in
// ai-agent-service/handlers/fields.go. This file owns display names only; the
// backend owns what each ID actually searches for.
//
// Program records store English discipline names, so free-text Vietnamese input
// ("Khoa học máy tính") used to match zero rows and render a blank result page.
// Sending an ID instead keeps that deterministic.
//
// Adding a field means adding it in both places, with the same ID.
export const ACADEMIC_FIELDS = [
  { id: 'computer-science', vi: 'Khoa học máy tính', en: 'Computer Science' },
  { id: 'data-science', vi: 'Khoa học dữ liệu', en: 'Data Science' },
  { id: 'ai-ml', vi: 'Trí tuệ nhân tạo / Máy học', en: 'AI / Machine Learning' },
  { id: 'software-engineering', vi: 'Kỹ thuật phần mềm', en: 'Software Engineering' },
  { id: 'statistics', vi: 'Thống kê', en: 'Statistics' },
  { id: 'robotics', vi: 'Robot & Tự động hóa', en: 'Robotics & Automation' }
];

export const fieldLabel = (id, lang = 'vi') => {
  const field = ACADEMIC_FIELDS.find((item) => item.id === id);
  if (!field) return id;
  return lang === 'vi' ? field.vi : field.en;
};
