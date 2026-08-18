import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth-context';

interface TasksContextValue {
  tasks: Task[];
  allTasks: Task[];
  isLoading: boolean;
  error: string | null;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  isUpdating: boolean;
}

export const TasksContext = createContext<TasksContextValue>({
  tasks: [],
  allTasks: [],
  isLoading: false,
  error: null,
  updateTaskStatus: async () => {},
  isUpdating: false,
});

export function useTasksContext() {
  return useContext(TasksContext);
}

export const useTasks = useTasksContext;

interface TasksProviderProps {
  children: ReactNode;
}

export function TasksProvider({ children }: TasksProviderProps) {
  const { userId, activeOrgId, orgRole, entityMemberships } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!userId || !activeOrgId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTasks() {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase.from('tasks').select('*').eq('org_id', activeOrgId);

        if (orgRole === 'staff') {
          query = query.eq('assigned_to', userId);
        } else if (orgRole === 'manager') {
          const entityIds = entityMemberships.map((membership) => membership.entity_id);
          if (entityIds.length > 0) {
            // Current task/entity relation. The legacy tasks.entity_id column is
            // retired from the client data path and is NULL on live tasks.
            query = query.in('enterprise_entity_id', entityIds);
          } else {
            query = query.eq('assigned_to', userId);
          }
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        if (cancelled) return;
        if (fetchError) throw fetchError;
        setAllTasks((data as Task[]) || []);
      } catch (err) {
        if (!cancelled) {
          console.error('Task fetch failed:', err);
          setError(err instanceof Error ? err.message : 'Failed to load tasks');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchTasks();
    return () => {
      cancelled = true;
    };
  }, [userId, activeOrgId, orgRole, entityMemberships]);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase.from('tasks').update({ status }).eq('id', taskId);
      if (updateError) throw updateError;
      setAllTasks((previous) => previous.map((task) => (task.id === taskId ? { ...task, status } : task)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TasksContext.Provider
      value={{ tasks: allTasks, allTasks, isLoading, error, updateTaskStatus, isUpdating }}
    >
      {children}
    </TasksContext.Provider>
  );
}
