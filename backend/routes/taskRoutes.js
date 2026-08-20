const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, priority } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Please provide a task title' });
    }
    const task = await Task.create({ title, priority: priority || 'medium' });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/tasks/:id - Update task (title, completed status, priority)
router.put('/:id', async (req, res) => {
  try {
    const { title, completed, priority } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;

    const updatedTask = await task.save();
    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
