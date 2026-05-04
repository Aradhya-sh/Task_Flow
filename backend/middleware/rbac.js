const Project = require('../models/Project');

// Check if user is member of project
exports.requireProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ message: 'Access denied: not a project member' });

    req.project = project;
    req.userRole = member.role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is Admin of the project
exports.requireProjectAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    req.project = project;
    req.userRole = 'Admin';
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
