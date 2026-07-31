const KEY = 'pathsync_demo_workspace';

const seed = {
  profile: {
    user_id: 'demo-student', full_name: 'Minh Anh', email: 'demo@pathsync.local',
    onboarding_done: true, education_level: 'Undergraduate', target_degree: 'Master',
    current_major: 'Computer Science', gpa: 3.45, test_scores: 'IELTS 7.0',
    fields_of_interest: '["Computer Science","Data Science"]', preferred_regions: '["Australia","Germany"]',
    budget_range: '30,000–45,000 USD / năm', intended_year: 2027, intended_term: 'Fall'
  },
  applications: [
    { id: 'demo-melbourne', university_name: 'University of Melbourne', university_id: 'melbourne-cs', application_type: 'Master of Computer Science', deadline: '2027-10-31', status: 'todo', subtasks: [{ id: 'task-1', title: 'Chuẩn bị bảng điểm', is_completed: true }, { id: 'task-2', title: 'Xin thư giới thiệu', is_completed: false }, { id: 'task-3', title: 'Hoàn thiện statement of purpose', is_completed: false }] },
    { id: 'demo-tum', university_name: 'Technical University of Munich', university_id: 'tum-data', application_type: 'MSc Data Engineering', deadline: '2027-05-31', status: 'inprogress', subtasks: [{ id: 'task-4', title: 'Đối chiếu yêu cầu đầu vào', is_completed: true }, { id: 'task-5', title: 'Đặt lịch thi ngoại ngữ', is_completed: false }] }
  ],
  documents: [],
  programs: [
    { id: 'melbourne-cs', university: 'University of Melbourne', name: 'Master of Computer Science', location: 'Australia', region: 'Australia', tuition: 'Xem website chương trình', deadline: 'Kiểm tra theo kỳ tuyển sinh', match: 'Target', source_label: 'Dữ liệu minh hoạ' },
    { id: 'tum-data', university: 'Technical University of Munich', name: 'MSc Data Engineering and Analytics', location: 'Germany', region: 'Germany', tuition: 'Xem website chương trình', deadline: 'Kiểm tra theo kỳ tuyển sinh', match: 'Target', source_label: 'Dữ liệu minh hoạ' },
    { id: 'toronto-ai', university: 'University of Toronto', name: 'MSc Applied Computing', location: 'Canada', region: 'Canada', tuition: 'Xem website chương trình', deadline: 'Kiểm tra theo kỳ tuyển sinh', match: 'Reach', source_label: 'Dữ liệu minh hoạ' }
  ],
  scholarships: [
    { id: 'demo-scholarship-1', uniName: 'University of Melbourne', title: 'Graduate scholarship opportunities', location: 'Australia', region: 'Australia', funding: 'Kiểm tra điều kiện chính thức', deadline: 'Theo từng đợt', match: 'Target', source_label: 'Dữ liệu minh hoạ' },
    { id: 'demo-scholarship-2', uniName: 'DAAD', title: 'Postgraduate funding opportunities', location: 'Germany', region: 'Germany', funding: 'Kiểm tra điều kiện chính thức', deadline: 'Theo từng chương trình', match: 'Target', source_label: 'Dữ liệu minh hoạ' }
  ]
};

const clone = (value) => JSON.parse(JSON.stringify(value));
export const isDemoSession = () => localStorage.getItem('auth_token') === 'pathsync-demo-token';
export const getWorkspace = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || clone(seed); } catch { return clone(seed); }
};
export const saveWorkspace = (workspace) => localStorage.setItem(KEY, JSON.stringify(workspace));
export const startDemo = () => {
  localStorage.setItem('auth_token', 'pathsync-demo-token');
  saveWorkspace(getWorkspace());
};
export const resetDemo = () => { localStorage.removeItem(KEY); };

export function demoResponse(url, options = {}) {
  const workspace = getWorkspace();
  const method = (options.method || 'GET').toUpperCase();
  const pathname = new URL(url).pathname.replace('/api/v1', '');
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const data = (payload) => ({ ok: true, status: 200, json: async () => payload });

  if (pathname === '/profile') {
    if (method === 'PUT') { workspace.profile = { ...workspace.profile, ...body }; saveWorkspace(workspace); }
    return data({ data: workspace.profile });
  }
  if (pathname === '/profile/completion') return data({ completion_percentage: 100 });
  if (pathname === '/programs') return data({ data: workspace.programs });
  if (pathname === '/scholarships') return data({ data: workspace.scholarships });
  if (pathname === '/applications/metrics') {
    const apps = workspace.applications; const tasks = apps.flatMap((app) => app.subtasks || []);
    const todo = apps.filter((app) => app.status === 'todo').length;
    const progress = apps.filter((app) => app.status === 'inprogress').length;
    const completed = apps.filter((app) => app.status === 'completed').length;
    const next = [...apps].sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
    return data({ target_schools: apps.length, overall_readiness: tasks.length ? Math.round(tasks.filter((task) => task.is_completed).length / tasks.length * 100) : 0, task_status: { todo, in_progress: progress, completed }, next_deadline: next ? { university: next.university_name, type: next.application_type, days_left: Math.max(0, Math.ceil((new Date(next.deadline) - new Date()) / 86400000)) } : null });
  }
  if (pathname === '/applications') {
    if (method === 'GET') return data({ data: workspace.applications });
    if (method === 'POST') { const app = { id: crypto.randomUUID(), university_name: body.university_name, university_id: body.university_id || 'custom', application_type: body.application_type, deadline: body.deadline, status: 'todo', subtasks: [{ id: crypto.randomUUID(), title: 'Xác minh yêu cầu tuyển sinh', is_completed: false }, { id: crypto.randomUUID(), title: 'Chuẩn bị hồ sơ học thuật', is_completed: false }] }; workspace.applications.push(app); saveWorkspace(workspace); return data({ data: app }); }
  }
  const appMatch = pathname.match(/^\/applications\/([^/]+)(?:\/(.*))?$/);
  if (appMatch) {
    const app = workspace.applications.find((item) => item.id === appMatch[1]); const suffix = appMatch[2];
    if (method === 'DELETE') { workspace.applications = workspace.applications.filter((item) => item.id !== appMatch[1]); saveWorkspace(workspace); return data({}); }
    if (method === 'PUT' && !suffix) { app.status = body.status; saveWorkspace(workspace); return data({ data: app }); }
    if (suffix === 'sop') { if (method === 'GET') return data({ sop_content: app.sop_content || '', sop_prompt: app.sop_prompt || '', sop_word_limit: 500 }); app.sop_content = body.sop_content; app.sop_prompt = body.sop_prompt; saveWorkspace(workspace); return data({ data: app }); }
  }
  const taskMatch = pathname.match(/^\/subtasks\/([^/]+)$/);
  if (taskMatch && method === 'PUT') { for (const app of workspace.applications) { const task = app.subtasks.find((item) => item.id === taskMatch[1]); if (task) task.is_completed = body.is_completed; } saveWorkspace(workspace); return data({}); }
  if (pathname === '/documents') { if (method === 'GET') return data({ data: workspace.documents }); const doc = { id: crypto.randomUUID(), title: body.title || 'Tài liệu mới', doc_type: body.doc_type || 'PDF', created_at: new Date().toISOString() }; workspace.documents.push(doc); saveWorkspace(workspace); return data({ data: doc }); }
  if (pathname.startsWith('/documents/') && method === 'DELETE') { workspace.documents = workspace.documents.filter((doc) => doc.id !== pathname.split('/').pop()); saveWorkspace(workspace); return data({}); }
  if (pathname === '/ai/essay-review') return data({ score: 72, feedback: 'Bản nháp đã có hướng đi tốt. Hãy thêm một ví dụ cụ thể: bối cảnh, hành động của bạn và kết quả đo được.', issues: [], strengths: ['Mục tiêu học tập rõ ràng'] });
  if (pathname === '/ai/sop-assist') return data({ suggestion: 'Mở đầu bằng một khoảnh khắc cụ thể, sau đó nối trải nghiệm đó với kỹ năng bạn muốn phát triển trong chương trình.', improvements: [] });
  return data({ reply: 'Hãy bắt đầu từ mục tiêu: ngành học, quốc gia và kỳ nhập học bạn đang cân nhắc. Sau đó mình sẽ giúp bạn xác định bước tiếp theo.', nodes: [] });
}
