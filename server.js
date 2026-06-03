const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const faculties = [];
let nextId = 1;

app.get('/api/facultades', (req, res) => {
  res.json(faculties);
});

app.post('/api/facultades', (req, res) => {
  const { nombre, decano, ubicacion } = req.body;

  if (!nombre || !decano || !ubicacion) {
    return res.status(400).json({ message: 'Los campos nombre, decano y ubicacion son obligatorios.' });
  }

  const faculty = {
    id: nextId++,
    nombre,
    decano,
    ubicacion,
  };

  faculties.push(faculty);
  res.status(201).json(faculty);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor local iniciado en http://localhost:${PORT}`);
});
