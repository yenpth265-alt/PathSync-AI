const API_BASE_URL = 'http://localhost:8000/api/v1';

export const fetchApplications = async () => {
  const response = await fetch(`${API_BASE_URL}/applications`);
  if (!response.ok) throw new Error('Failed to fetch applications');
  const result = await response.json();
  
  // map backend model to frontend model expected by KanbanBoard
  return result.data.map(app => ({
    id: app.id,
    column: app.status || 'todo',
    university: app.university_name,
    location: 'United States', // mocked since backend doesn't store this
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
  const backendData = {
    user_id: "dummy-user-id",
    university_id: "dummy-uni-id",
    university_name: data.university,
    deadline: data.deadline,
    application_type: data.type
  };

  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendData),
  });
  if (!response.ok) throw new Error('Failed to create application');
  return response.json();
};

export const moveApplication = async (id, newColumnId) => {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newColumnId }),
  });
  if (!response.ok) throw new Error('Failed to move application');
  return response.json();
};

export const toggleTask = async (taskId, isCompleted) => {
  const response = await fetch(`${API_BASE_URL}/subtasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_completed: isCompleted }),
  });
  if (!response.ok) throw new Error('Failed to toggle task');
  return response.json();
};
