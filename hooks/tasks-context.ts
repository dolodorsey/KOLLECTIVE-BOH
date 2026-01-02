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
        return [];
      }

      try {
        console.log('📋 Fetching tasks from Supabase...');
        const supabase = getSupabase();
        const { data: tasksData, error } = await supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true });

        if (error) {
          console.error('❌ Error fetching tasks:', error.message || error);
          return [];
        }

        if (!tasksData) {
          console.log('ℹ️ No tasks found (table might be empty)');
          return [];
        }

        console.log(`✅ Loaded ${tasksData.length} tasks`);
        
        const normalizedTasks: Task[] = (tasksData || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.due_date || task.dueDate,
          priority: task.priority || 'medium',
          status: task.status || 'pending',
          brandId: task.brand_id || task.brandId,
          agentOrigin: task.agent_origin || task.agentOrigin,
          collaborators: Array.isArray(task.collaborators) 
            ? task.collaborators 
            : [],
          attachments: Array.isArray(task.attachments) 
            ? task.attachments 
            : [],
          sopLink: task.sop_link || task.sopLink,
          createdAt: task.created_at || task.createdAt || new Date().toISOString(),
          lastUpdated: task.last_updated || task.lastUpdated || new Date().toISOString(),
          automationTrail: Array.isArray(task.automation_trail) 
            ? task.automation_trail 
            : (task.automationTrail ? task.automationTrail : []),
        }));
        
        return normalizedTasks;
      } catch (error) {
        console.error('❌ Error in tasks query:', error);
        return [];
      }
    },
    enabled: SUPABASE_CONFIG_OK,
    retry: false,
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
    
    return tasks.filter(task => {
      const brandMatch = user.assignedBrands.length === 0 || user.assignedBrands.includes(task.brandId);
      const collabMatch = task.collaborators.length === 0 || task.collaborators.some(collab => collab.id === user.id);
      return brandMatch && collabMatch;
    });
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