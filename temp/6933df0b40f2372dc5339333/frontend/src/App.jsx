import { useEffect, useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  const load = async () => {
    const r = await fetch('http://localhost:4000/todos');
    setTodos(await r.json());
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    await fetch('http://localhost:4000/todos', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text})
    });
    setText('');
    load();
  };

  const toggle = async (t) => {
    await fetch('http://localhost:4000/todos/'+t._id, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({done:!t.done})
    });
    load();
  };

  const remove = async (id) => {
    await fetch('http://localhost:4000/todos/'+id, {method:'DELETE'});
    load();
  };

  return (
    <div style={{padding:20}}>
      <h1>Todo</h1>
      <input value={text} onChange={e=>setText(e.target.value)} />
      <button onClick={add}>Add</button>
      <ul>
        {todos.map(t=>(
          <li key={t._id}>
            <span onClick={()=>toggle(t)} style={{cursor:'pointer', textDecoration:t.done?'line-through':''}}>
              {t.text}
            </span>
            <button onClick={()=>remove(t._id)}>x</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
