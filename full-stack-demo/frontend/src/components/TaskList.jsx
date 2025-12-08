import React, { useEffect, useState } from 'react';
import { Trash2, CheckCircle, Circle, Plus } from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from '../services/api';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWrapper = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        try {
            const task = await createTask(newTaskTitle);
            setTasks([...tasks, task]);
            setNewTaskTitle('');
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    const handleToggle = async (task) => {
        try {
            const updated = await updateTask(task.id, { completed: !task.completed });
            setTasks(tasks.map(t => t.id === task.id ? updated : t));
        } catch (error) {
            console.error('Failed to update task', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading tasks...</div>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">My Tasks</h1>

            <form onSubmit={handleCreateWrapper} className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus size={20} />
                </button>
            </form>

            <div className="space-y-3">
                {tasks.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No tasks yet. Add one above!</div>
                )}
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                    >
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleToggle(task)}>
                            {task.completed ?
                                <CheckCircle className="text-green-500" size={20} /> :
                                <Circle className="text-gray-400" size={20} />
                            }
                            <span className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {task.title}
                            </span>
                        </div>
                        <button
                            onClick={() => handleDelete(task.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskList;
