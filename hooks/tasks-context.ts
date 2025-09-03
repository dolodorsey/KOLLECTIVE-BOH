import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import { tasks as mockTasks } from '@/mocks/tasks';
import { Task, TaskStatus } from '@/types/task';
import { useUser } from '@/hooks/user-context';

export const [TasksContext, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
          return JSON.parse(storedTasks) as Task[];
        }
        // For demo purposes, we'll use the mock data
        await AsyncStorage.setItem('tasks', JSON.stringify(mockTasks));
        return mockTasks;
      } catch (error) {
        console.error('Error fetching tasks data:', error);
        return mockTasks;
      }
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Task) => {
      const currentTasks = [...tasks];
      const taskIndex = currentTasks.findIndex(task => task.id === updatedTask.id);
      
      if (taskIndex !== -1) {
        currentTasks[taskIndex] = updatedTask;
        await AsyncStorage.setItem('tasks', JSON.stringify(currentTasks));
      }
      
      return currentTasks;
    },
    onSuccess: (updatedTasks) => {
      setTasks(updatedTasks);
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
    
    // Filter tasks based on user's assigned brands
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
    updateTaskStatus
  };
});