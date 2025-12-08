import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Please add a file name'],
            trim: true,
        },
        language: {
            type: String,
            default: 'javascript',
        },
        content: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index to prevent duplicate file names in same project
fileSchema.index({ projectId: 1, name: 1 }, { unique: true });

const File = mongoose.model('File', fileSchema);

export default File;
