import React, { useEffect, useState } from 'react';
import { Task, TaskStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import { NeuCard, NeuButton, NeuCheckbox } from './NeuComponents';
import { Clock, Play, CheckCircle, AlertTriangle, Edit2, Trash2, XCircle, Flag, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdateStatus, onUpdateTask, onEdit, onDelete }) => {
  const [now, setNow] = useState(Date.now());
  const [showSubtasks, setShowSubtasks] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000 * 60); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const startDate = new Date(task.startTime);
  const endDate = new Date(task.endTime);
  const isOverdue = now > endDate.getTime() && task.status === TaskStatus.IN_PROGRESS;
  
  const getStatusColor = (s: TaskStatus) => {
    switch(s) {
      case TaskStatus.IN_PROGRESS: return 'text-neu-accent border-neu-accent';
      case TaskStatus.COMPLETED: return 'text-neu-success border-neu-success';
      case TaskStatus.CANCELED: return 'text-neu-text line-through opacity-50 border-neu-text';
      case TaskStatus.REMINDED: return 'text-neu-warning border-neu-warning';
      case TaskStatus.NOT_STARTED: 
      default: return 'text-neu-text/60 border-neu-text/60';
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.HIGH: return 'text-neu-danger';
      case Priority.MEDIUM: return 'text-neu-warning';
      case Priority.LOW: return 'text-neu-success';
      default: return 'text-neu-dark';
    }
  };

  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  return (
    <NeuCard className="mb-6 relative overflow-hidden group">
      {/* Overdue Indicator Strip - Glitch effect */}
      {isOverdue && (
        <div className="absolute top-0 left-0 w-1 h-full bg-neu-danger animate-pulse" />
      )}
      
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 pl-4 p-4">
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
            <span className={`font-bold px-2 py-0.5 border uppercase tracking-wider ${getStatusColor(task.status)}`}>
              [{STATUS_LABELS[task.status]}]
            </span>
            <span className="text-neu-text font-medium px-2 py-0.5 border border-neu-dark">
              类型::{task.type}
            </span>
            <div className={`flex items-center gap-1 font-bold px-2 py-0.5 ${getPriorityColor(task.priority)}`}>
              <Flag size={12} fill="currentColor" />
              {PRIORITY_LABELS[task.priority]}
            </div>
          </div>
          
          <h3 className={`text-xl font-bold font-mono text-neu-text ${task.status === TaskStatus.COMPLETED ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm text-neu-text/80 mt-2 font-mono">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              开始: {startDate.toLocaleString([], {month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'})}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              结束: {endDate.toLocaleString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          </div>

          {/* Progress Bar (Terminal Style) */}
          {totalSubtasks > 0 && (
            <div className="mt-3 max-w-md">
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span>子任务进度</span>
                <span>{Math.round(subtaskProgress)}%</span>
              </div>
              <div className="h-2 w-full bg-neu-dark border border-neu-dark">
                <div 
                  className="h-full bg-neu-accent transition-all duration-500"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row md:flex-col gap-2 justify-end shrink-0">
          {task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.IN_PROGRESS && (
            <NeuButton 
              variant="primary" 
              className="w-full md:w-auto text-xs"
              onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)}
            >
              <Play size={14} className="mr-1" /> 执行任务
            </NeuButton>
          )}
          
          {task.status === TaskStatus.IN_PROGRESS && (
             <NeuButton 
              variant="success" 
              className="w-full md:w-auto text-xs"
              onClick={() => onUpdateStatus(task.id, TaskStatus.COMPLETED)}
            >
              <CheckCircle size={14} className="mr-1" /> 完成任务
            </NeuButton>
          )}

          <div className="flex gap-2">
            <NeuButton className="flex-1 px-3 py-1" onClick={() => onEdit(task)}>
              <Edit2 size={14} />
            </NeuButton>
            <NeuButton className="flex-1 px-3 py-1 hover:text-neu-danger hover:border-neu-danger" onClick={() => onDelete(task.id)}>
              <Trash2 size={14} />
            </NeuButton>
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
      {totalSubtasks > 0 && (
        <div className="border-t border-neu-dark bg-black/50">
          <button 
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono text-neu-text/70 hover:bg-neu-text/10 transition-colors"
          >
            <span>{showSubtasks ? '[-] 折叠模块' : `[+] 展开模块 (${completedSubtasks}/${totalSubtasks})`}</span>
            {showSubtasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showSubtasks && (
            <div className="p-4 space-y-2 border-t border-neu-dark border-dashed">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-start gap-3 group/sub">
                  <NeuCheckbox 
                    checked={subtask.isCompleted} 
                    onChange={() => toggleSubtask(subtask.id)}
                    className="mt-0.5"
                  />
                  <div className={`flex flex-1 justify-between text-sm font-mono ${subtask.isCompleted ? 'text-neu-text/40 line-through' : 'text-neu-text'}`}>
                    <span>{subtask.title}</span>
                    {subtask.estimatedDuration && <span className="opacity-60 text-xs">[{subtask.estimatedDuration}m]</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </NeuCard>
  );
};

export default TaskItem;
