const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../utils/db.json');

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

const readData = () => {
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const TaskModel = {
    getAll: () => {
        return readData();
    },

    create: (taskData) => {
        const tasks = readData();
        const newTask = {
            id: uuidv4(),
            title: taskData.title,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        writeData(tasks);
        return newTask;
    },

    update: (id, updates) => {
        const tasks = readData();
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return null;

        tasks[index] = { ...tasks[index], ...updates };
        writeData(tasks);
        return tasks[index];
    },

    delete: (id) => {
        let tasks = readData();
        const initialLength = tasks.length;
        tasks = tasks.filter(t => t.id !== id);

        if (tasks.length === initialLength) return false;

        writeData(tasks);
        return true;
    }
};

module.exports = TaskModel;
