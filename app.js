const API_BASE = 'http://localhost:8080/api/facultades';
const statusBadge = document.getElementById('statusBadge');
const alertBox = document.getElementById('alertBox');
const facultyTableBody = document.getElementById('facultyTableBody');
const facultyForm = document.getElementById('facultyForm');
const refreshButton = document.getElementById('refreshButton');

function setStatus(text, type = 'neutral') {
  statusBadge.textContent = text;
  statusBadge.style.background = type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#e2e8f0';
  statusBadge.style.color = type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#1f2937';
}

function showAlert(message, type = 'success') {
  alertBox.hidden = false;
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
}

function clearAlert() {
  alertBox.hidden = true;
  alertBox.textContent = '';
  alertBox.className = 'alert';
}

function validateForm(data) {
  let isValid = true;
  const fields = ['nombre', 'decano', 'ubicacion'];

  fields.forEach((field) => {
    const input = document.getElementById(field);
    const error = document.getElementById(`${field}Error`);
    if (!data[field] || data[field].trim().length < 3) {
      error.textContent = `El campo ${input.previousElementSibling.textContent.toLowerCase()} es obligatorio y debe tener al menos 3 caracteres.`;
      isValid = false;
    } else {
      error.textContent = '';
    }
  });

  return isValid;
}

function mapFacultiesToRows(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return `<tr><td colspan="4" class="empty-state">No hay facultades registradas aún.</td></tr>`;
  }

  return list
    .map((faculty) => {
      const id = faculty.id ?? faculty.ID ?? '-';
      const nombre = faculty.nombre ?? faculty.name ?? '-';
      const decano = faculty.decano ?? faculty.responsable ?? '-';
      const ubicacion = faculty.ubicacion ?? faculty.ubicación ?? faculty.location ?? '-';

      return `
        <tr>
          <td>${id}</td>
          <td>${escapeHtml(nombre)}</td>
          <td>${escapeHtml(decano)}</td>
          <td>${escapeHtml(ubicacion)}</td>
        </tr>
      `;
    })
    .join('');
}

function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function loadFaculties() {
  setStatus('Cargando facultades...', 'neutral');
  clearAlert();
  facultyTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Cargando...</td></tr>`;

  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al cargar facultades: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    facultyTableBody.innerHTML = mapFacultiesToRows(data);
    setStatus('Datos cargados correctamente', 'success');
  } catch (error) {
    facultyTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No se pudo cargar la lista de facultades.</td></tr>`;
    setStatus('Error de conexión', 'error');
    showAlert(error.message || 'No se pudo conectar con el backend. Asegúrate de que Spring Boot esté activo en http://localhost:8080.', 'error');
  }
}

async function submitFaculty(event) {
  event.preventDefault();
  clearAlert();

  const payload = {
    nombre: document.getElementById('nombre').value.trim(),
    decano: document.getElementById('decano').value.trim(),
    ubicacion: document.getElementById('ubicacion').value.trim(),
  };

  if (!validateForm(payload)) {
    showAlert('Corrige los campos marcados antes de continuar.', 'error');
    return;
  }

  setStatus('Enviando nueva facultad...', 'neutral');
  document.getElementById('submitButton').disabled = true;

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error al guardar: ${response.status} ${response.statusText} ${errorBody}`);
    }

    await loadFaculties();
    showAlert('Facultad registrada correctamente.', 'success');
    facultyForm.reset();
  } catch (error) {
    setStatus('Error al guardar', 'error');
    showAlert(error.message || 'No se pudo guardar la facultad. Verifica la conexión con el backend.', 'error');
  } finally {
    document.getElementById('submitButton').disabled = false;
  }
}

facultyForm.addEventListener('submit', submitFaculty);
refreshButton.addEventListener('click', loadFaculties);
window.addEventListener('DOMContentLoaded', loadFaculties);
