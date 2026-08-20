import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Layers, Server, Database, CheckCircle, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState({ backend: 'checking', db: 'checking' });

  // Fetch Health Status (Express + MongoDB connection check)
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthStatus({
          backend: 'online',
          db: data.database?.connected ? 'online' : 'offline'
        });
      } else {
        setHealthStatus({ backend: 'offline', db: 'offline' });
      }
    } catch (err) {
      setHealthStatus({ backend: 'offline', db: 'offline' });
    }
  };

  // Fetch Tasks from API
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchTasks();
    const interval = setInterval(checkHealth, 10000); // refresh status every 10s
    return () => clearInterval(interval);
  }, []);

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks([data.data, ...tasks]);
        setTitle('');
        setPriority('medium');
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Toggle Task Completion
  const toggleTask = async (id, currentCompleted) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(tasks.map(t => (t._id === id ? data.data : t)));
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Delete Task
  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalTasks - completedCount;

  return (
    <div className="container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-title">
          <Layers size={32} color="#38bdf8" />
          <span>MERN Task Manager</span>
        </div>
        <p className="subtitle">Learn Docker by containerizing Express, React, and MongoDB</p>
      </header>

      {/* System Status Banner */}
      <div className="status-banner">
        <div className="status-group">
          <div className="status-indicator">
            <Server size={18} color="#38bdf8" />
            <span>Backend:</span>
            <span className={`dot ${healthStatus.backend}`}></span>
            <span style={{ color: healthStatus.backend === 'online' ? '#22c55e' : '#ef4444' }}>
              {healthStatus.backend === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="status-indicator">
            <Database size={18} color="#a855f7" />
            <span>MongoDB:</span>
            <span className={`dot ${healthStatus.db}`}></span>
            <span style={{ color: healthStatus.db === 'online' ? '#22c55e' : '#ef4444' }}>
              {healthStatus.db === 'online' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <button onClick={() => { checkHealth(); fetchTasks(); }} className="priority-select" style={{ fontSize: '0.8rem' }}>
          🔄 Refresh Status
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#38bdf8' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-val">{totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#22c55e' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="task-form">
        <input
          type="text"
          className="task-input"
          placeholder="Enter a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="priority-select"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <button type="submit" className="btn-add">
          <Plus size={18} />
          <span>Add</span>
        </button>
      </form>

      {/* Task List */}
      <div className="task-list">
        {loading ? (
          <div className="empty-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <Layers size={40} className="empty-icon" />
            <p>No tasks yet. Create one above!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-left">
                <button
                  type="button"
                  onClick={() => toggleTask(task._id, task.completed)}
                  className={`checkbox-btn ${task.completed ? 'checked' : ''}`}
                >
                  {task.completed && <Check size={14} />}
                </button>
                <span className="task-text">{task.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${task.priority}`}>{task.priority}</span>
                <button
                  onClick={() => deleteTask(task._id)}
                  className="btn-delete"
                  title="Delete task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
