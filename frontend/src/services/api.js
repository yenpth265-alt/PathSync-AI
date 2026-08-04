import { getAuthToken, getCurrentUser } from '../utils/auth';
import { demoResponse, isDemoSession } from './demoStore';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const customFetch = async (url, options = {}) => {
  if (isDemoSession()) return demoResponse(url, options);
  const response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Unauthorized');
  }
  return response;
};

const parseJson = async (response) => {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = await response.json();
      message = errorBody.error || errorBody.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return response.json();
};

const unwrapData = (payload) => (payload?.data !== undefined ? payload.data : payload);

// --- Profile ---

export const getProfile = async () => getUserProfile();

export const getUserProfile = async () => {
  const response = await customFetch(`${API}/profile`, { headers: authHeaders() });
  const result = await parseJson(response);
  return unwrapData(result);
};

export const updateProfile = async (data) => updateUserProfile(data);

export const updateUserProfile = async (data) => {
  const response = await customFetch(`${API}/profile`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  const result = await parseJson(response);
  return unwrapData(result);
};

export const getProfileCompletion = async () => {
  const response = await customFetch(`${API}/profile/completion`, { headers: authHeaders() });
  return parseJson(response);
};

export const getDashboardMetrics = async () => {
  const response = await customFetch(`${API}/applications/metrics`, { headers: authHeaders() });
  return parseJson(response);
};

// --- Universities / Programs ---

export const getUniversities = async (params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value && value !== 'All')
  );
  const response = await customFetch(`${API}/universities?${new URLSearchParams(filtered)}`, {
    headers: authHeaders()
  });
  const result = await parseJson(response);
  return unwrapData(result) || [];
};
export const getUniversityDetail = async (id) => {
  const response = await customFetch(`${API}/universities/${id}`, {
    headers: authHeaders()
  });
  return parseJson(response);
};

export const getPrograms = async (params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value && value !== 'All')
  );
  const response = await customFetch(`${API}/programs?${new URLSearchParams(filtered)}`, {
    headers: authHeaders()
  });
  const result = await parseJson(response);
  return unwrapData(result) || [];
};

export const getProgramDetail = async (id) => {
  const response = await customFetch(`${API}/programs/${id}`, { headers: authHeaders() });
  const result = await parseJson(response);
  return unwrapData(result);
};

export const getProgramFit = async (id, profile) => {
  const response = await customFetch(`${API}/programs/${id}/fit?${new URLSearchParams(profile)}`, {
    headers: authHeaders()
  });
  return parseJson(response);
};

export const getScholarships = async (params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value && value !== 'All')
  );
  const response = await customFetch(`${API}/scholarships?${new URLSearchParams(filtered)}`, {
    headers: authHeaders()
  });
  const result = await parseJson(response);
  return unwrapData(result) || [];
};

// --- AI ---

export const aiChat = async (messages, context) => {
  const user = getCurrentUser();
  const profile = user || {};
  const response = await customFetch(`${API}/agent/counsel`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ messages, profile, session_id: 'default-session', context })
  });
  return parseJson(response);
};

export const aiSOPAssist = async (prompt, content, action) => {
  const response = await customFetch(`${API}/ai/sop-assist`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ prompt, existing_content: content, action })
  });
  return parseJson(response);
};

export const aiSmartMatch = async (profile) => {
  const response = await customFetch(`${API}/ai/smart-match`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(profile)
  });
  return parseJson(response);
};

export const aiEssayReview = async (content, prompt) => {
  const response = await customFetch(`${API}/ai/essay-review`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ content, prompt })
  });
  return parseJson(response);
};

// --- Applications ---

export const fetchApplications = async () => {
  const response = await customFetch(`${API}/applications`, { headers: authHeaders() });
  const result = await parseJson(response);
  const apps = unwrapData(result) || [];
  return apps.map((app) => ({
    id: app.id,
    column: app.status || 'todo',
    university: app.university_name,
    location: 'United States',
    type: app.application_type,
    deadline: app.deadline,
    progress: app.subtasks ? app.subtasks.filter((t) => t.is_completed).length : 0,
    totalTasks: app.subtasks ? app.subtasks.length : 0,
    subtasks: (app.subtasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.is_completed,
      date: t.due_date || 'No Date'
    }))
  }));
};

export const createApplication = async (data) => {
  const user = getCurrentUser();
  if (!user?.user_id) throw new Error('Not authenticated');
  const backendData = {
    user_id: user.user_id,
    university_id: data.university_id || 'custom-uni',
    university_name: data.university,
    deadline: data.deadline,
    application_type: data.type
  };
  const response = await customFetch(`${API}/applications`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(backendData)
  });
  const result = await parseJson(response);
  return unwrapData(result);
};

export const moveApplication = async (id, newColumnId) => {
  const response = await customFetch(`${API}/applications/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ status: newColumnId })
  });
  return parseJson(response);
};

export const toggleTask = async (taskId, isCompleted) => {
  const response = await customFetch(`${API}/subtasks/${taskId}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ is_completed: isCompleted })
  });
  return parseJson(response);
};

export const getApplicationSOP = async (id) => {
  const response = await customFetch(`${API}/applications/${id}/sop`, { headers: authHeaders() });
  const data = await parseJson(response);
  return {
    content: data.sop_content || '',
    prompt: data.sop_prompt || '',
    wordLimit: data.sop_word_limit || 500
  };
};

export const updateApplicationSOP = async (id, data) => {
  const response = await customFetch(`${API}/applications/${id}/sop`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({
      sop_content: data.content ?? data.sop_content ?? '',
      sop_prompt: data.prompt ?? data.sop_prompt ?? '',
      sop_word_limit: data.wordLimit ?? data.sop_word_limit ?? 500
    })
  });
  return parseJson(response);
};

export const deleteApplication = async (id) => {
  const response = await customFetch(`${API}/applications/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return parseJson(response);
};

export const updateApplicationDetails = async (id, data) => {
  const response = await customFetch(`${API}/applications/${id}/details`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  return parseJson(response);
};

export const reviewEssayAI = async (essay, prompt = '') => aiEssayReview(essay, prompt);

export const smartMatchUniversities = async (data) => {
  const payload = {
    gpa: parseFloat(data.gpa) || 0,
    ielts: parseFloat(String(data.ielts).replace(/[^\d.]/g, '')) || 0,
    toefl: data.toefl || 0,
    work_exp: data.work_exp || data.workExp || 0,
    fields: data.fields || (data.major ? [data.major] : []),
    target_countries: data.target_countries || (data.location ? [data.location] : []),
    budget: data.budget || 50000
  };
  return aiSmartMatch(payload);
};

// --- Documents ---

export const fetchDocuments = async () => {
  const response = await customFetch(`${API}/documents`, { headers: authHeaders() });
  const result = await parseJson(response);
  return unwrapData(result) || [];
};

export const createDocument = async (data) => {
  const user = getCurrentUser();
  if (!user?.user_id) throw new Error('Not authenticated');
  const backendData = { user_id: user.user_id, title: data.title, doc_type: data.doc_type };
  const response = await customFetch(`${API}/documents`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(backendData)
  });
  return parseJson(response);
};

export const deleteDocument = async (id) => {
  const response = await customFetch(`${API}/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return parseJson(response);
};

export const uploadDocumentFile = async (file, title, docType) => {
  if (isDemoSession()) {
    return customFetch(`${API}/documents`, {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ title: title || file.name, doc_type: docType || 'PDF' })
    }).then(parseJson);
  }
  const user = getCurrentUser();
  if (!user?.user_id) throw new Error('Not authenticated');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || file.name);
  formData.append('doc_type', docType || 'PDF');
  formData.append('user_id', user.user_id);

  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await customFetch(`${API}/documents`, { method: 'POST', headers, body: formData });
  return parseJson(response);
};

// --- Auth / OTP ---
export const sendOTP = async (email, password, fullName) => {
  const response = await customFetch(`${API}/auth/send-otp`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password, full_name: fullName })
  });
  return parseJson(response);
};

export const verifyOTP = async (email, otpCode) => {
  const response = await customFetch(`${API}/auth/verify-otp`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, otp_code: otpCode })
  });
  return parseJson(response);
};

// --- Admin ---
export const getAdminUsers = async () => {
  const response = await customFetch(`${API}/admin/users`, { headers: authHeaders() });
  return parseJson(response);
};

export const updateAdminUserRole = async (id, role) => {
  const response = await customFetch(`${API}/admin/users/${id}/role`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ role })
  });
  return parseJson(response);
};

export const updateAdminUserStatus = async (id, isActive) => {
  const response = await customFetch(`${API}/admin/users/${id}/status`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ is_active: isActive })
  });
  return parseJson(response);
};

export const deleteAdminUser = async (id) => {
  const response = await customFetch(`${API}/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return parseJson(response);
};

export const createAdminUniversity = async (data) => {
  const response = await customFetch(`${API}/admin/universities`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  return parseJson(response);
};

export const createAdminScholarship = async (data) => {
  const response = await customFetch(`${API}/admin/scholarships`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  return parseJson(response);
};

export const triggerAdminCrawl = async () => {
  const response = await customFetch(`${API}/admin/sync-universities`, {
    method: 'POST',
    headers: jsonHeaders()
  });
  return parseJson(response);
};

export const getMentors = async () => {
  const response = await customFetch(`${API}/mentors`, {
    headers: authHeaders()
  });
  const result = await parseJson(response);
  return unwrapData(result) || [];
};

export const createBooking = async (data) => {
  const response = await customFetch(`${API}/bookings`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  const result = await parseJson(response);
  return result.data || result;
};

export const getBookings = async () => {
  const response = await customFetch(`${API}/bookings`, {
    headers: authHeaders()
  });
  const result = await parseJson(response);
  return unwrapData(result) || [];
};

export const updateBookingStatus = async (id, data) => {
  const response = await customFetch(`${API}/bookings/${id}/status`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  return parseJson(response);
};

export const updateMentorProfile = async (data) => {
  const response = await customFetch(`${API}/mentors/profile`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(data)
  });
  return parseJson(response);
};

export const extractActionsFromDocument = async (fileName, textSnippet = '') => {
  const tasks = [
    { title: `Hoàn thiện Personal Statement (${fileName})`, deadline: '2026-11-15', stage: 'in_progress' },
    { title: `Xin 2 Thư Giới Thiệu (Recommendation Letters)`, deadline: '2026-12-01', stage: 'todo' },
    { title: `Gửi Điểm IELTS & Học Bạ Đã Công Chứng`, deadline: '2026-12-10', stage: 'todo' },
    { title: `Nộp Phí Đăng Ký & Xác Nhận Nộp Hồ Sơ`, deadline: '2026-12-15', stage: 'todo' }
  ];
  return tasks;
};
