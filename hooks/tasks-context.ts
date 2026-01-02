import createContextHook from '@nkzw/create-context-hook';

import { Task, TaskStatus } from '@/types/task';

export const [TasksContext, useTasks] = createContextHook(() => {
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    console.log('Update task:', taskId, status);
  };

  return {
    tasks: [] as Task[],
    allTasks: [] as Task[],
    isLoading: false,
    error: null,
    updateTaskStatus,
    isUpdating: false
  };
});
