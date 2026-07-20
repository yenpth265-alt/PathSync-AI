export const mockKanbanData = [
  {
    id: '1',
    column: 'todo',
    university: 'University of Melbourne',
    location: 'AU Australia',
    type: 'Scholarship Application',
    deadline: 'Aug 15, 2026',
    progress: 0,
    totalTasks: 3,
    subtasks: [
      { id: 't1', title: 'Write personal statement (1000 words)', date: 'Jul 10, 2026', status: 'Urgent', completed: false },
      { id: 't2', title: 'Request two academic references', date: 'Jul 18, 2026', status: 'Soon', completed: false }
    ]
  },
  {
    id: '2',
    column: 'inprogress',
    university: 'Harvard University',
    location: 'US United States',
    type: 'Early Action',
    deadline: 'Nov 1, 2026',
    progress: 1,
    totalTasks: 4,
    subtasks: [
      { id: 't3', title: 'Submit Common App essay', date: 'Jul 5, 2026', status: 'Urgent', completed: true },
      { id: 't4', title: 'SAT score submission (target 1550+)', date: 'Jul 8, 2026', status: 'Urgent', completed: false }
    ]
  },
  {
    id: '3',
    column: 'completed',
    university: 'Sciences Po Paris',
    location: 'FR France',
    type: 'Exchange Semester',
    deadline: 'Jun 30, 2026',
    progress: 4,
    totalTasks: 4,
    subtasks: [
      { id: 't5', title: 'Nomination by home university', date: 'May 1, 2026', status: 'On Track', completed: true },
      { id: 't6', title: 'Online application form submitted', date: 'Jun 1, 2026', status: 'On Track', completed: true }
    ]
  }
];

export const mockStats = {
  total: 8,
  inProgress: 3,
  completed: 2,
  urgent: 3
};
