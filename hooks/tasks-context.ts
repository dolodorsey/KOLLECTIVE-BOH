import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import { Task, TaskStatus } from '@/types/task';
import { useUser } from '@/hooks/user-context';
import { getSupabase, SUPABASE_CONFIG_OK } from '@/lib/supabase';

export const [TasksContext, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!SUPABASE_CONFIG_OK) {
        console.error('❌ Supabase not configured in tasks context');
        throw new Error('Supabase not configured');
      }

      try {
        console.log('📋 Fetching tasks from Supabase...');
        const supabase = getSupabase();
        const { data: tasksData, error } = await supabase
          .from('tasks')
          .select('*')
          .order('dueDate', { ascending: true });

        if (error) {
          console.error('❌ Error fetching tasks:', error);
          throw error;
        }

        console.log(`✅ Loaded ${tasksData?.length || 0} tasks`);
        return (tasksData || []) as Task[];
      } catch (error) {
        console.error('❌ Error in tasks query:', error);
        throw error;
      }
    },
    enabled: SUPABASE_CONFIG_OK,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Task) => {
      if (!SUPABASE_CONFIG_OK) {
        throw new Error('Supabase not configured');
      }

      console.log('💾 Updating task:', updatedTask.id);
      const supabase = getSupabase();
      const { error } = await supabase
        .from('tasks')
        .update(updatedTask)
        .eq('id', updatedTask.id);

      if (error) {
        console.error('❌ Error updating task:', error);
        throw error;
      }

      console.log('✅ Task updated successfully');
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  useEffect(() => {
    if (tasksQuery.data) {
      setTasks(tasksQuery.data);
    }
  }, [tasksQuery.data]);

  const userTasks = useMemo(() => {
    if (!user) return [];
    
    return tasks.filter(task => 
      user.assignedBrands.includes(task.brandId) && 
      task.collaborators.some(collab => collab.id === user.id)
    );
  }, [tasks, user]);

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (taskToUpdate) {
      const updatedTask = { 
        ...taskToUpdate, 
        status, 
        lastUpdated: new Date().toISOString() 
      };
      updateTaskMutation.mutate(updatedTask);
    }
  };

  return {
    tasks: userTasks,
    allTasks: tasks,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    updateTaskStatus,
    isUpdating: updateTaskMutation.isPending
  };
});