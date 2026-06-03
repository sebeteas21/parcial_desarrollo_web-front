const BASE_URL = window.BASE_URL || '';
const FACULTIES_API = `${BASE_URL}/api/facultades`;
const statusBadge = document.getElementById('statusBadge');
const alertBox = document.getElementById('alertBox');
const facultyTableBody = document.getElementById('facultyTableBody');
const facultyForm = document.getElementById('facultyForm');
const refreshButton = document.getElementById('refreshButton');
const programTableBody = document.getElementById('programTableBody');
const programNameInput = document.getElementById('programaNombre');
const programLevelInput = document.getElementById('programaNivel');
const programDurationSemestersInput = document.getElementById('programaDuracionSemestres');
const programAlertBox = document.getElementById('programAlertBox');
let facultiesCache = [];

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
    const response = await fetch(FACULTIES_API, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al cargar facultades: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    facultiesCache = data;
    facultyTableBody.innerHTML = mapFacultiesToRows(data);
    populateFacultyOptions(data);
    setStatus('Datos cargados correctamente', 'success');
    await loadPrograms();
  } catch (error) {
    facultyTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No se pudo cargar la lista de facultades.</td></tr>`;
    setStatus('Error de conexión', 'error');
    showAlert(error.message || 'No se pudo conectar con el backend. Asegúrate de que el servidor esté activo en http://localhost:8080.', 'error');
  }
}

function clearProgramAlert() {
  programAlertBox.hidden = true;
  programAlertBox.textContent = '';
  programAlertBox.className = 'alert';
}

function showProgramAlert(message, type = 'success') {
  programAlertBox.hidden = false;
  programAlertBox.textContent = message;
  programAlertBox.className = `alert ${type}`;
}

function mapProgramsToRows(faculties) {
  const rows = [];

  (Array.isArray(faculties) ? faculties : []).forEach((faculty) => {
    const facultadNombre = faculty.nombre ?? faculty.name ?? '-';
    const programas = Array.isArray(faculty.programas) ? faculty.programas : [];

    programas.forEach((program) => {
      const id = program.id ?? program.ID ?? '-';
      const nombre = program.nombre ?? program.name ?? '-';
      const nivel = program.nivel ?? program.level ?? '-';
      const duracion = program.duracionSemestres ?? program.duracion ?? program.duration ?? '-';

      rows.push(`
        <tr>
          <td>${id}</td>
          <td>${escapeHtml(nombre)}</td>
          <td>${escapeHtml(facultadNombre)}</td>
          <td>${escapeHtml(nivel)}</td>
          <td>${escapeHtml(duracion)}</td>
        </tr>
      `);
    });
  });

  if (rows.length === 0) {
    return `<tr><td colspan="5" class="empty-state">No hay programas académicos registrados aún.</td></tr>`;
  }

  return rows.join('');
}

function buildProgramPayload() {
  const nombre = programNameInput.value.trim();
  const nivel = programLevelInput.value.trim();
  const duracionSemestres = programDurationSemestersInput.value.trim();

  if (!nombre && !nivel && !duracionSemestres) {
    return [];
  }

  return [
    {
      nombre,
      nivel,
      duracionSemestres: isNaN(Number(duracionSemestres)) || duracionSemestres === '' ? duracionSemestres : Number(duracionSemestres),
    },
  ];
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

  const programNombreError = document.getElementById('programaNombreError');
  const programNivelError = document.getElementById('programaNivelError');
  const programDuracionSemestresError = document.getElementById('programaDuracionSemestresError');
  const isProgramFilled = data.programaNombre || data.programaNivel || data.programaDuracionSemestres;

  if (isProgramFilled) {
    if (!data.programaNombre || data.programaNombre.trim().length < 3) {
      programNombreError.textContent = 'El nombre del programa debe tener al menos 3 caracteres.';
      isValid = false;
    } else {
      programNombreError.textContent = '';
    }

    if (!data.programaNivel || data.programaNivel.trim().length < 3) {
      programNivelError.textContent = 'El nivel del programa debe tener al menos 3 caracteres.';
      isValid = false;
    } else {
      programNivelError.textContent = '';
    }

    if (!data.programaDuracionSemestres || data.programaDuracionSemestres.trim().length < 1) {
      programDuracionSemestresError.textContent = 'La duración en semestres es obligatoria si registras un programa.';
      isValid = false;
    } else {
      programDuracionSemestresError.textContent = '';
    }
  } else {
    programNombreError.textContent = '';
    programNivelError.textContent = '';
    programDuracionSemestresError.textContent = '';
  }

  return isValid;
}

async function loadFaculties() {
  setStatus('Cargando facultades...', 'neutral');
  clearAlert();
  facultyTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Cargando...</td></tr>`;

  try {
    const response = await fetch(FACULTIES_API, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al cargar facultades: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    facultiesCache = data;
    facultyTableBody.innerHTML = mapFacultiesToRows(data);
    programTableBody.innerHTML = mapProgramsToRows(data);
    setStatus('Datos cargados correctamente', 'success');
  } catch (error) {
    facultyTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No se pudo cargar la lista de facultades.</td></tr>`;
    programTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No se pudo cargar la lista de programas.</td></tr>`;
    setStatus('Error de conexión', 'error');
    showAlert(error.message || 'No se pudo conectar con el backend. Asegúrate de que el servidor esté activo en http://localhost:8080.', 'error');
  }
}

async function submitFaculty(event) {
  event.preventDefault();
  clearAlert();

  const payload = {
    nombre: document.getElementById('nombre').value.trim(),
    decano: document.getElementById('decano').value.trim(),
    ubicacion: document.getElementById('ubicacion').value.trim(),
    programas: buildProgramPayload(),
    programaNombre: document.getElementById('programaNombre').value.trim(),
    programaNivel: document.getElementById('programaNivel').value.trim(),
    programaDuracionSemestres: document.getElementById('programaDuracionSemestres').value.trim(),
  };

  if (!validateForm(payload)) {
    showAlert('Corrige los campos marcados antes de continuar.', 'error');
    return;
  }

  const body = {
    nombre: payload.nombre,
    decano: payload.decano,
    ubicacion: payload.ubicacion,
  };

  if (payload.programas.length) {
    body.programas = payload.programas;
  }

  setStatus('Enviando nueva facultad...', 'neutral');
  document.getElementById('submitButton').disabled = true;

  try {
    const response = await fetch(FACULTIES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
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
