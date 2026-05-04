const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const checkProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const member = project.members.find(m => m.user.toString() === userId.toString());
  if (!member) return { error: 'Access denied', status: 403 };
  return { project, role: member.role };
};

// @GET /api/tasks?project=id - Get tasks for a project
router.get('/', protect, async (req, res) => {
  try {
    const { project: projectId, status, priority, assignedTo } = req.query;
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });

    const check = await checkProjectMember(projectId, req.user._id);
    if (check.error) return res.status(check.status).json({ message: check.error });

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/tasks/my - Get tasks assigned to current user across all projects
router.get('/my', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @POST /api/tasks - Create a task
router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate, tags } = req.body;

    const check = await checkProjectMember(projectId, req.user._id);
    if (check.error) return res.status(check.status).json({ message: check.error });

    // Validate assignedTo is a project member
    if (assignedTo) {
      const isAssigneeMember = check.project.members.some(m => m.user.toString() === assignedTo);
      if (!isAssigneeMember) return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    const task = await Task.create({
      title, description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status, priority, dueDate, tags
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @GET /api/tasks/:id - Get single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const check = await checkProjectMember(task.project._id, req.user._id);
    if (check.error) return res.status(check.status).json({ message: check.error });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @PUT /api/tasks/:id - Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const check = await checkProjectMember(task.project, req.user._id);
    if (check.error) return res.status(check.status).json({ message: check.error });

    // Members can only update status; Admins can update everything
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    if (check.role === 'Member') {
      // Members can update status and assignedTo if it's themselves
      if (status) task.status = status;
    } else {
      // Admins can update all fields
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (tags) task.tags = tags;
    }

    await task.save();
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @DELETE /api/tasks/:id - Delete task (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const check = await checkProjectMember(task.project, req.user._id);
    if (check.error) return res.status(check.status).json({ message: check.error });
    if (check.role !== 'Admin') return res.status(403).json({ message: 'Admin required to delete tasks' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @POST /api/tasks/:id/comments - Add comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const check = await checkProjectMember(task.project, req.user._id);
    if (check.error) return res.status(check.status).json({ message: check.error });

    task.comments.push({ user: req.user._id, text: text.trim() });
    await task.save();
    await task.populate('comments.user', 'name email avatar');
    res.json(task.comments[task.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
