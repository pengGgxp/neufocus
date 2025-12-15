import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Priority, Subtask, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import { NeuButton, NeuInput, NeuCard, NeuSelect } from './NeuComponents';
import { X, Save, Plus, Trash2, Calendar, Clock, Tag, Flag, CheckSquare, AlignLeft } from 'lucide-react';

interface TaskFormProps {
  existingTask?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
  availableTypes: string[];
}

// Helper to convert Date to local ISO string (YYYY-MM-DDTHH:mm) for datetime-local input
const toLocalISOString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const TaskForm: React.FC<TaskFormProps> = ({ existingTask, onSave, onCancel, availableTypes }) => {
  const [title, setTitle] = useState(existingTask?.title || '');
  const [type, setType] = useState(existingTask?.type || availableTypes[0] || '工作');
  const [priority, setPriority] = useState<Priority>(existingTask?.priority || Priority.MEDIUM);
  
  // Initialize with existing time (formatted for local input) or Current Local Time
  const [startTime, setStartTime] = useState(
    existingTask?.startTime 
      ? toLocalISOString(new Date(existingTask.startTime)) 
      : toLocalISOString(new Date())
  );

  const [endTime, setEndTime] = useState(existingTask?.endTime ? toLocalISOString(new Date(existingTask.endTime)) : '');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(existingTask?.estimatedDuration || 30);
  const [status, setStatus] = useState<TaskStatus>(existingTask?.status || TaskStatus.NOT_STARTED);
  
  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>(existingTask?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDuration, setNewSubtaskDuration] = useState('');

  // Auto-calculate end time when duration changes or start time changes
  useEffect(() => {
    if (startTime && estimatedDuration) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + estimatedDuration * 60000);
      setEndTime(toLocalISOString(end));
    }
  }, [startTime, estimatedDuration]);

  const handleAddSubtask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    setSubtasks([...subtasks, {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      estimatedDuration: newSubtaskDuration ? parseInt(newSubtaskDuration) : undefined
    }]);
    setNewSubtaskTitle('');
    setNewSubtaskDuration('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: existingTask?.id || crypto.randomUUID(),
      title,
      type,
      priority,
      status,
      subtasks,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      estimatedDuration,
      actualDuration: existingTask?.actualDuration,
    };
    onSave(newTask);
  };

  return (
    // Overlay: High contrast grid
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-all duration-300">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg animate-fade-in-up">
        
        <NeuCard className="relative w-full max-h-[90vh] overflow-y-auto !bg-black !border-neu-accent !shadow-[0_0_50px_rgba(0,255,65,0.1)]">
          
          {/* Header */}
          <div className="sticky top-0 z-10 flex justify-between items-center mb-6 pb-4 border-b border-neu-dark -mx-6 px-6 bg-black">
            <h2 className="text-2xl font-mono font-bold text-neu-accent flex items-center gap-2 uppercase">
              {existingTask ? <CheckSquare className="text-neu-accent" /> : <Plus className="text-neu-accent" />}
              {existingTask ? '编辑任务协议' : '初始化新任务'}
            </h2>
            <button 
              onClick={onCancel} 
              className="p-2 hover:bg-neu-danger hover:text-black transition-all duration-300 text-neu-text border border-transparent hover:border-neu-danger"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-mono font-bold text-neu-text flex items-center gap-2 uppercase">
                <AlignLeft size={16} /> 任务标识符 (TITLE)
              </label>
              <NeuInput 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="输入任务名称..." 
                required 
                className="text-lg font-medium"
              />
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-sm font-mono font-bold text-neu-text flex items-center gap-2 uppercase">
                  <Flag size={16} /> 优先级
                </label>
                <NeuSelect 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  {Object.values(Priority).map(p => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </NeuSelect>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-mono font-bold text-neu-text flex items-center gap-2 uppercase">
                  <Tag size={16} /> 分类
                </label>
                <NeuInput 
                  list="types" 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  placeholder="选择或输入类型..."
                />
                <datalist id="types">
                  {availableTypes.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>
            
            {/* Time Configuration */}
            <div className="p-4 border border-neu-dark border-dashed space-y-4">
              <div className="flex items-center gap-2 text-neu-accent font-bold border-b border-neu-dark pb-2 mb-2 font-mono uppercase">
                 <Clock size={18} /> 时间配置
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-neu-text/70 uppercase">开始时间</label>
                  <NeuInput 
                    type="datetime-local" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    required
                    className="!py-2 !text-sm !bg-neu-dark/20 focus:!bg-neu-accent/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-neu-text/70 uppercase">结束时间</label>
                  <NeuInput 
                    type="datetime-local" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    required
                    className="!py-2 !text-sm !bg-neu-dark/20 focus:!bg-neu-accent/10"
                  />
                </div>
              </div>
              
               <div className="space-y-1">
                  <label className="text-xs font-mono font-semibold text-neu-text/70 uppercase">预计耗时 (分钟)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="5" 
                      max="480" 
                      step="5"
                      value={estimatedDuration} 
                      onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                      className="flex-1 h-1 bg-neu-dark rounded-none appearance-none cursor-pointer accent-neu-accent"
                    />
                    <NeuInput 
                      type="number" 
                      min="1"
                      value={estimatedDuration} 
                      onChange={(e) => setEstimatedDuration(Number(e.target.value))} 
                      className="!w-20 !py-1 !text-center"
                    />
                  </div>
                </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-3">
               <label className="text-sm font-mono font-bold text-neu-text flex items-center gap-2 uppercase">
                 <CheckSquare size={16} /> 子任务模块
               </label>
               <div className="flex gap-2">
                 <NeuInput 
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="添加子模块..."
                    className="flex-1"
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                 />
                 <NeuInput 
                    type="number"
                    min="1"
                    value={newSubtaskDuration}
                    onChange={(e) => setNewSubtaskDuration(e.target.value)}
                    placeholder="分钟"
                    className="!w-24 text-center"
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                 />
                 <NeuButton type="button" onClick={handleAddSubtask} className="px-3 aspect-square flex items-center justify-center border-neu-accent text-neu-accent hover:bg-neu-accent hover:text-black">
                   <Plus size={24} />
                 </NeuButton>
               </div>
               
               {subtasks.length > 0 && (
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                   {subtasks.map(st => (
                     <div key={st.id} className="flex items-center justify-between p-2 border border-neu-dark hover:border-neu-text transition-colors">
                       <span className="text-sm text-neu-text truncate flex-1 font-mono">
                         {st.title}
                         {st.estimatedDuration && <span className="text-neu-text/50 ml-2">[{st.estimatedDuration}m]</span>}
                       </span>
                       <button type="button" onClick={() => handleRemoveSubtask(st.id)} className="text-neu-text/50 hover:text-neu-danger p-1 transition-colors">
                         <Trash2 size={16} />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {existingTask && (
               <div className="space-y-2 pt-2 border-t border-neu-dark">
               <label className="text-sm font-mono font-bold text-neu-text uppercase">当前状态</label>
               <NeuSelect 
                 value={status} 
                 onChange={(e) => setStatus(e.target.value as TaskStatus)}
               >
                  {Object.values(TaskStatus).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
               </NeuSelect>
             </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-neu-dark">
              <NeuButton type="submit" variant="primary" className="flex-1 flex justify-center items-center gap-2 py-3">
                <Save size={18} /> 保存协议
              </NeuButton>
            </div>
          </form>
        </NeuCard>
      </div>
    </div>
  );
};

export default TaskForm;
