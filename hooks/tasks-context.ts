import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskStatus } from '@/types/task';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TasksContextValue {
  tasks: Task[];
  allTasks: Task[];
  isLoading: boolean;
  error: string | null;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  isUpdating: boolean;
}

const TasksContext = createContext<TasksContextValue>({
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

interface TasksProviderProps {
  children: React.ReactNode;
}

export function TasksProvider({ children }: TasksProviderProps) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (cancelled) return;
        
        if (fetchError) throw fetchError;
        
        setAllTasks((data as Task[]) || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tasks');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTasks();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setIsUpdating(true);
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (updateError) throw updateError;
      
      setAllTasks(prev =>
        prev.map(task => task.id === taskId ? { ...task, status } : task)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const value: TasksContextValue = {
    tasks: allTasks,
    allTasks,
    isLoading,
    error,
    updateTaskStatus,
    isUpdating,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
