import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    type: {
        type: String,
        enum: ['text', 'code', 'system'],
        default: 'text'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ projectId: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
