import { getAuthToken, getCurrentUser } from '../utils/auth';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const jsonHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const customFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Unauthorized');
  }
  return response;
};

// --- NEW API ENDPOINTS ---

export const getProfile = () => customFetch(`${API}/profile`, { headers: authHeaders() });
export const updateProfile = (data) => customFetch(`${API}/profile`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) });
export const getProfileCompletion = () => customFetch(`${API}/profile/completion`, { headers: authHeaders() });
export const getDashboardMetrics = () => customFetch(`${API}/applications/metrics`, { headers: authHeaders() });

export const getPrograms = (params) => customFetch(`${API}/programs?${new URLSearchParams(params)}`, { headers: authHeaders() });
export const getProgramDetail = (id) => customFetch(`${API}/programs/${id}`, { headers: authHeaders() });
export const getProgramFit = (id, profile) => customFetch(`${API}/programs/${id}/fit?${new URLSearchParams(profile)}`, { headers: authHeaders() });

export const getScholarships = (params) => customFetch(`${API}/scholarships?${new URLSearchParams(params)}`, { headers: authHeaders() });

export const getApplicationSOP = (id) => customFetch(`${API}/applications/${id}/sop`, { headers: authHeaders() });
export const updateApplicationSOP = (id, data) => customFetch(`${API}/applications/${id}/sop`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) });

export const aiChat = (messages, context) => customFetch(`${API}/ai/chat`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ messages, context }) });
export const aiSOPAssist = (prompt, content, action) => customFetch(`${API}/ai/sop-assist`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ prompt, existing_content: content, action }) });
export const aiSmartMatch = (profile) => customFetch(`${API}/ai/smart-match`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(profile) });
export const aiEssayReview = (content, prompt) => customFetch(`${API}/ai/essay-review`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ content, prompt }) });

// --- EXISTING API ENDPOINTS ---

export const fetchApplications = async () => {
  const response = await customFetch(`${API}/applications`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to fetch applications');
  const result = await response.json();
  return result.data.map(app => ({
    id: app.id,
    column: app.status || 'todo',
    university: app.university_name,
    location: 'United States',
    type: app.application_type,
    deadline: app.deadline,
    progress: app.subtasks ? app.subtasks.filter(t => t.is_completed).length : 0,
    totalTasks: app.subtasks ? app.subtasks.length : 0,
    subtasks: (app.subtasks || []).map(t => ({
      id: t.id,
      title: t.title,
      completed: t.is_completed,
      date: t.due_date || 'No Date'
    }))
  }));
};

export const createApplication = async (data) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const backendData = {
    user_id: user.user_id,
    university_id: data.university_id || "custom-uni",
    university_name: data.university,
    deadline: data.deadline,
    application_type: data.type
  };
  const response = await customFetch(`${API}/applications`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(backendData) });
  if (!response.ok) throw new Error('Failed to create application');
  return response.json();
};

export const moveApplication = async (id, newColumnId) => {
  const response = await customFetch(`${API}/applications/${id}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify({ status: newColumnId }) });
  if (!response.ok) throw new Error('Failed to move application');
  return response.json();
};

export const toggleTask = async (taskId, isCompleted) => {
  const response = await customFetch(`${API}/subtasks/${taskId}`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify({ is_completed: isCompleted }) });
  if (!response.ok) throw new Error('Failed to toggle task');
  return response.json();
};

export const fetchDocuments = async () => {
  const response = await customFetch(`${API}/documents`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to fetch documents');
  const result = await response.json();
  return result.data;
};

export const createDocument = async (data) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const backendData = { user_id: user.user_id, title: data.title, doc_type: data.doc_type };
  const response = await customFetch(`${API}/documents`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(backendData) });
  if (!response.ok) throw new Error('Failed to create document');
  return response.json();
};

export const deleteDocument = async (id) => {
  const response = await customFetch(`${API}/documents/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to delete document');
  return response.json();
};

export const smartMatchUniversities = async (data) => {
  const response = await customFetch(`${API}/universities/smart-match`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!response.ok) throw new Error('Failed to run Smart Match');
  const result = await response.json();
  return result.data;
};

export const reviewEssayAI = async (essay, prompt = "") => {
  const response = await customFetch(`${API}/applications/review-essay`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ essay, prompt }) });
  if (!response.ok) throw new Error('Failed to review essay');
  return response.json();
};

export const getUserProfile = async () => {
  const response = await customFetch(`${API}/profile`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  const result = await response.json();
  return result.data;
};

export const updateUserProfile = async (data) => {
  const response = await customFetch(`${API}/profile`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!response.ok) throw new Error('Failed to update user profile');
  const result = await response.json();
  return result.data;
};

export const deleteApplication = async (id) => {
  const response = await customFetch(`${API}/applications/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to delete application');
  return response.json();
};

export const updateApplicationDetails = async (id, data) => {
  const response = await customFetch(`${API}/applications/${id}/details`, { method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data) });
  if (!response.ok) throw new Error('Failed to update application details');
  return response.json();
};

export const uploadDocumentFile = async (file, title, docType) => {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || file.name);
  formData.append('doc_type', docType || 'PDF');
  formData.append('user_id', user.user_id);

  const token = getAuthToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await customFetch(`${API}/documents`, { method: 'POST', headers, body: formData });
  if (!response.ok) throw new Error('Failed to upload document file');
  return response.json();
};

