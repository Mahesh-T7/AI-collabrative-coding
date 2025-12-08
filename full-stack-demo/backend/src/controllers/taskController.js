const TaskModel = require('../models/taskModel');

const getTasks = (req, res) => {
    try {
        const tasks = TaskModel.getAll();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createTask = (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const newTask = TaskModel.create({ title });
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateTask = (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedTask = TaskModel.update(id, updates);

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteTask = (req, res) => {
    try {
        const { id } = req.params;
        const deleted = TaskModel.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
