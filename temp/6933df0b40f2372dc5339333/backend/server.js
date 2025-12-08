const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/todos');

const Todo = mongoose.model('Todo', { text: String, done: Boolean });

app.get('/todos', async (req, res) => {
  res.json(await Todo.find());
});

app.post('/todos', async (req, res) => {
  const todo = await Todo.create({ text: req.body.text, done: false });
  res.json(todo);
});

app.put('/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(todo);
});

app.delete('/todos/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({});
});

app.listen(4000, () => console.log('Server running on 4000'));
