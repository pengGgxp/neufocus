import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Settings, FilterState, Priority, STATUS_LABELS, PRIORITY_LABELS } from './types';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';
import { NeuButton, NeuInput, NeuCard, NeuSelect } from './components/NeuComponents';
import { Plus, Settings as SettingsIcon, Bell, Search, Filter, BellRing, BellOff } from 'lucide-react';

const STORAGE_KEY_TASKS = 'neu-focus-tasks';
const STORAGE_KEY_SETTINGS = 'neu-focus-settings';

const App: React.FC = () => {
  // --- State ---
  // Lazy initialization for persistence to prevent data loss on mount
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TASKS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load tasks", e);
      return [];
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const defaults = { idleReminderInterval: 2, notificationsEnabled: false };
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (e) {
      console.error("Failed to load settings", e);
      return defaults;
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  
  // Filtering with persistence
  const [filters, setFilters] = useState<FilterState>(() => {
    const defaults: FilterState = { status: 'ALL', type: 'ALL', priority: 'ALL', search: '' };
    try {
      const stored = localStorage.getItem('neu-focus-filters');
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  // --- Effects ---

  // Initial Permission Check
  useEffect(() => {
    if (settings.notificationsEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []); // Run once on mount

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('neu-focus-filters', JSON.stringify(filters));
  }, [filters]);

  // --- Background Logic (Smart Reminders) ---
  const sendNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, [settings.notificationsEnabled]);

  const handleTestNotification = () => {
    if (!settings.notificationsEnabled) {
      alert("请先开启通知开关。");
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification("测试通知", { body: "NeuFocus AI: 您的系统通知功能正常工作！" });
    } else {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification("测试通知", { body: "NeuFocus AI: 您的系统通知功能正常工作！" });
        } else {
          alert("无法发送通知，请检查浏览器权限设置。");
        }
      });
    }
  };

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const newTasks = [...tasks];
      let hasUpdates = false;

      // 1. Check for tasks starting now
      newTasks.forEach(task => {
        const start = new Date(task.startTime).getTime();
        if (task.status === TaskStatus.NOT_STARTED && now >= start && now < start + 60000) {
           sendNotification("任务开始", `是时候开始：${task.title}`);
           task.status = TaskStatus.REMINDED; // Mark as reminded so we don't spam
           hasUpdates = true;
        }
      });

      // 2. Idle / Overdue Monitor
      const inProgressTask = newTasks.find(t => t.status === TaskStatus.IN_PROGRESS);
      const overdueThreshold = settings.idleReminderInterval * 60 * 60 * 1000;
      
      if (inProgressTask) {
        // Case A: Task is running but Overdue
        const endTime = new Date(inProgressTask.endTime).getTime();
        
        if (now > endTime + overdueThreshold) {
           // Remind every 30 mins
           if (new Date().getMinutes() % 30 === 0 && new Date().getSeconds() < 10) {
              sendNotification("还在工作吗？", `任务 "${inProgressTask.title}" 已经严重超时。需要更新状态吗？`);
           }
        }
      } else {
        // Case B: No task running (Long Idle)
        // Find the last completed task to determine "idle time"
        const completedTasks = newTasks
          .filter(t => t.status === TaskStatus.COMPLETED)
          .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

        if (completedTasks.length > 0) {
          const lastEndTime = new Date(completedTasks[0].endTime).getTime();
          // Check if idle time exceeds threshold
          if (now - lastEndTime > overdueThreshold) {
             // Remind every 60 mins to avoid annoyance, but align with threshold logic
             // We use a simple modulo check on the hour relative to threshold to trigger "once" per cycle roughly
             const timeSince = now - lastEndTime;
             // If we are roughly at the threshold point (within last minute) OR it's been another hour since threshold
             if (Math.floor(timeSince / 1000) % 3600 < 60) {
                // Ensure we don't spam every second of that minute, simple hack: check seconds < 5
                 if (new Date().getSeconds() < 5) {
                    sendNotification("空闲提醒", `您已经休息了较长时间。要开始新的任务吗？`);
                 }
             }
          }
        }
      }

      if (hasUpdates) setTasks(newTasks);

    }, 60000); // Every minute

    return () => clearInterval(checkInterval);
  }, [tasks, settings, sendNotification]);

  // Check on Mount/Visibility change for "Empty State" reminder (Immediate check)
  useEffect(() => {
    const checkIdleState = () => {
      if (document.visibilityState === 'visible') {
        const inProgress = tasks.find(t => t.status === TaskStatus.IN_PROGRESS);
        if (!inProgress) {
          // Check if we haven't completed anything recently (e.g. last 10 mins)
          const recentlyCompleted = tasks.some(t => 
             t.status === TaskStatus.COMPLETED && 
             (Date.now() - new Date(t.endTime).getTime() < 1000 * 60 * 10) // 10 mins buffer
          );

          if (!recentlyCompleted && tasks.length > 0) {
             // Only notify if user has tasks but none are running
             sendNotification("准备好专注了吗？", "你目前没有进行中的任务。");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", checkIdleState);
    const timer = setTimeout(checkIdleState, 5000);

    return () => {
      document.removeEventListener("visibilitychange", checkIdleState);
      clearTimeout(timer);
    };
  }, [tasks, sendNotification]);


  // --- CRUD Handlers ---

  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      setTasks(prev => [task, ...prev]);
    }
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  // Used for updating subtasks or general task data from TaskItem without closing modal
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("确定要删除这个任务吗？")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleStatusUpdate = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const updates: Partial<Task> = { status: newStatus };
      
      // Logic for Actual Duration
      if (newStatus === TaskStatus.COMPLETED) {
        const start = new Date(t.startTime).getTime();
        const now = Date.now();
        updates.actualDuration = Math.max(1, Math.floor((now - start) / 60000));
        updates.endTime = new Date().toISOString(); 
      }
      
      return { ...t, ...updates };
    }));
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // --- Derived Data ---
  
  const uniqueTypes = useMemo(() => {
    const types = new Set(tasks.map(t => t.type));
    return Array.from(types);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'ALL' || t.status === filters.status;
      const matchesType = filters.type === 'ALL' || t.type === filters.type;
      const matchesPriority = filters.priority === 'ALL' || t.priority === filters.priority;
      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    }).sort((a, b) => {
      // Sort by priority logic (High > Medium > Low)
      const priorityWeight = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (diff !== 0) return diff;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [tasks, filters]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    const totalMinutes = completed.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
    return {
      count: completed.length,
      minutes: totalMinutes
    };
  }, [tasks]);

  const toggleNotifications = () => {
    if (!settings.notificationsEnabled) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          setSettings(s => ({ ...s, notificationsEnabled: true }));
        } else {
          alert("权限被拒绝。请在浏览器设置中启用通知。");
        }
      });
    } else {
      setSettings(s => ({ ...s, notificationsEnabled: false }));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black selection:bg-neu-accent selection:text-black">
      
      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 border-b border-neu-dark pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-neu-accent mb-2 tracking-tighter uppercase">
              <span className="animate-blink mr-2">&gt;_</span>NeuFocus
            </h1>
            <p className="text-neu-text/60 font-mono text-sm">
               [系统状态]: 在线 | 任务完成数: {stats.count} | 专注时长: {Math.floor(stats.minutes / 60)}小时 {stats.minutes % 60}分钟
            </p>
          </div>
          <div className="flex gap-4">
            <NeuButton onClick={() => setShowSettings(!showSettings)} className="p-3">
              <SettingsIcon size={20} />
            </NeuButton>
            <NeuButton onClick={() => setIsFormOpen(true)} variant="primary" className="p-3 flex items-center gap-2">
              <Plus size={20} /> <span className="hidden md:inline">新建任务</span>
            </NeuButton>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <NeuCard className="mb-8 animate-fade-in border-l-4 border-l-neu-accent">
            <h3 className="text-xl font-bold text-neu-text mb-4 uppercase tracking-widest border-b border-neu-dark pb-2">系统配置</h3>
            <div className="space-y-6">
              
              {/* Notifications Config */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-neu-dark bg-neu-dark/10">
                <div className="flex items-center gap-3">
                  {settings.notificationsEnabled ? <BellRing className="text-neu-accent" /> : <BellOff className="text-neu-text/50" />}
                  <div>
                    <h4 className="font-bold text-neu-text font-mono">系统通知</h4>
                    <p className="text-xs text-neu-text/50">启用桌面提醒功能</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                   <NeuButton onClick={handleTestNotification} className="text-sm px-4">
                     测试连接
                   </NeuButton>
                   <NeuButton 
                      onClick={toggleNotifications}
                      className={settings.notificationsEnabled ? 'text-neu-accent border-neu-accent' : 'text-neu-text/50'}
                   >
                     {settings.notificationsEnabled ? '禁用' : '启用'}
                   </NeuButton>
                </div>
              </div>

              {/* Threshold Config */}
              <div className="space-y-2">
                <label className="text-neu-text font-medium font-mono">空闲提醒阈值 (小时)</label>
                <NeuInput 
                  type="number" 
                  value={settings.idleReminderInterval}
                  onChange={(e) => setSettings(s => ({...s, idleReminderInterval: Number(e.target.value)}))}
                />
                <p className="text-xs text-neu-text/60 font-mono">
                  当[正在进行的任务超时]，或者[系统空闲时间]超过此阈值时，将触发警报。
                </p>
              </div>

            </div>
          </NeuCard>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-text/60 group-focus-within:text-neu-accent" size={18} />
            <NeuInput 
              placeholder="输入关键词搜索..." 
              className="pl-12 font-mono uppercase"
              value={filters.search}
              onChange={(e) => setFilters(f => ({...f, search: e.target.value}))}
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-neu-text/60" size={16} />
              <NeuSelect 
                className="pl-10 font-mono uppercase"
                value={filters.status}
                onChange={(e) => setFilters(f => ({...f, status: e.target.value as any}))}
              >
                <option value="ALL">所有状态</option>
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </NeuSelect>
            </div>
             <div className="relative w-full md:w-32">
              <NeuSelect 
                value={filters.priority}
                className="font-mono uppercase"
                onChange={(e) => setFilters(f => ({...f, priority: e.target.value as any}))}
              >
                <option value="ALL">所有优先级</option>
                {Object.values(Priority).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </NeuSelect>
            </div>
            <NeuSelect 
              className="w-full md:w-40 font-mono uppercase"
              value={filters.type}
              onChange={(e) => setFilters(f => ({...f, type: e.target.value}))}
            >
               <option value="ALL">所有类型</option>
               {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </NeuSelect>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20 border border-neu-dark border-dashed">
              <div className="inline-block p-6 border border-neu-text/30 mb-4">
                 <Search size={48} className="text-neu-text/50" />
              </div>
               <h3 className="text-2xl font-bold text-neu-text font-mono">未检索到任务</h3>
               <p className="text-neu-text/70 font-mono">请初始化新任务协议</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onUpdateStatus={handleStatusUpdate}
                onUpdateTask={handleTaskUpdate}
                onEdit={handleEdit}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        {/* Modal Form */}
        {isFormOpen && (
          <TaskForm 
            existingTask={editingTask}
            onSave={handleSaveTask}
            onCancel={() => { setIsFormOpen(false); setEditingTask(undefined); }}
            availableTypes={uniqueTypes.length > 0 ? uniqueTypes : ['工作', '学习', '个人', '健康']}
          />
        )}
      </div>
    </div>
  );
};

export default App;