const API_BASE_URL = 'http://localhost:8080/api';

export const fetchApplications = async () => {
  const response = await fetch(`${API_BASE_URL}/applications`);
  if (!response.ok) throw new Error('Failed to fetch applications');
  return response.json();
};

export const createApplication = async (data) => {
  const response = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create application');
  return response.json();
};

export const moveApplication = async (id, newColumnId) => {
  const response = await fetch(`${API_BASE_URL}/applications/${id}/move`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ column: newColumnId }),
  });
  if (!response.ok) throw new Error('Failed to move application');
  return response.json();
};

export const createTask = async (data) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
};

export const toggleTask = async (taskId) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to toggle task');
  return response.json();
};
