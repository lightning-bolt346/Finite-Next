'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Priority = 0 | 1 | 2; // 0: Normal, 1: High, 2: Critical

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  deadline: string | null; // ISO string 
  linkedGoalId: string | null;
  scheduledTime: string | null; // e.g. "09:00"
  timeEstimate: number | null; // minutes
  createdAt: number;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  intention: string;
  setIntention: (intention: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [intention, setIntention] = useState<string>('');

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('finite_tasks');
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      
      const storedIntention = localStorage.getItem(`finite_intention_${new Date().toLocaleDateString('en-CA')}`);
      if (storedIntention) setIntention(storedIntention);
    } catch(e) {}
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('finite_tasks', JSON.stringify(newTasks));
  };

  const handleSetIntention = (val: string) => {
    setIntention(val);
    localStorage.setItem(`finite_intention_${new Date().toLocaleDateString('en-CA')}`, val);
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      completed: false
    };
    saveTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, intention, setIntention: handleSetIntention }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
