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

        console.log('📋 Fetching tasks for role:', orgRole);

        let query = supabase
          .from('tasks')
          .select('*')
          .eq('org_id', activeOrgId);

        if (orgRole === 'staff') {
          query = query.eq('assigned_to', userId);
          console.log('📋 Staff: filtering by assigned_to');
        } else if (orgRole === 'manager') {
          const entityIds = entityMemberships.map(em => em.entity_id);
          if (entityIds.length > 0) {
            query = query.in('entity_id', entityIds);
            console.log('📋 Manager: filtering by entity access:', entityIds);
          } else {
            query = query.eq('assigned_to', userId);
            console.log('📋 Manager: no entity access, showing assigned only');
          }
        } else {
          console.log('📋 Owner/Admin: showing all org tasks');
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (cancelled) return;
        
        if (fetchError) throw fetchError;
        
        console.log('✅ Tasks loaded:', (data || []).length);
        setAllTasks((data as Task[]) || []);
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Tasks fetch error:', err);
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
  }, [userId, activeOrgId, orgRole, entityMemberships]);

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
