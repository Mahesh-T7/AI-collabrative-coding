import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: ['CREATE_FILE', 'UPDATE_FILE', 'DELETE_FILE', 'RENAME_FILE', 'CREATE_PROJECT'],
        },
        details: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries by project
activityLogSchema.index({ projectId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
