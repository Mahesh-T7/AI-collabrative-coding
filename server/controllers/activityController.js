import ActivityLog from '../models/ActivityLog.js';
import Project from '../models/Project.js';

// @desc    Get project activity log
// @route   GET /api/activity/:projectId
// @access  Private
const getProjectActivity = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check ownership or membership
        const isOwner = project.ownerId.toString() === req.user._id.toString();
        const isMember = project.members.some(
            (member) => member.toString() === req.user._id.toString()
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const activities = await ActivityLog.find({ projectId })
            .sort({ createdAt: -1 })
            .populate('userId', 'username email avatarUrl')
            .limit(50); // Limit to last 50 activities

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getProjectActivity };
