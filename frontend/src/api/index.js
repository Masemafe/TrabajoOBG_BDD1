const BASE = '/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['X-Auth-Token'] = authToken;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      authToken = null;
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(data.error || 'Error del servidor');
  }
  return data;
}

export const api = {
  login: (u, p) => req('POST', '/login', { username: u, password: p }),
  logout: () => req('POST', '/logout'),

  // Disciplinas
  getDisciplinas: () => req('GET', '/disciplinas'),
  createDisciplina: (d) => req('POST', '/disciplinas', d),
  updateDisciplina: (id, d) => req('PUT', `/disciplinas/${id}`, d),
  deleteDisciplina: (id) => req('DELETE', `/disciplinas/${id}`),

  // Espacios
  getEspacios: () => req('GET', '/espacios'),
  createEspacio: (d) => req('POST', '/espacios', d),
  updateEspacio: (id, d) => req('PUT', `/espacios/${id}`, d),
  deleteEspacio: (id) => req('DELETE', `/espacios/${id}`),

  // Estudiantes
  getEstudiantes: () => req('GET', '/estudiantes'),
  getEstudiante: (id) => req('GET', `/estudiantes/${id}`),
  createEstudiante: (d) => req('POST', '/estudiantes', d),
  updateEstudiante: (id, d) => req('PUT', `/estudiantes/${id}`, d),
  deleteEstudiante: (id) => req('DELETE', `/estudiantes/${id}`),

  // Carreras / Facultades
  getFacultades: () => req('GET', '/facultades'),
  getCarreras: () => req('GET', '/carreras'),

  // Actividades
  getActividades: () => req('GET', '/actividades'),
  createActividad: (d) => req('POST', '/actividades', d),
  updateActividad: (id, d) => req('PUT', `/actividades/${id}`, d),
  deleteActividad: (id) => req('DELETE', `/actividades/${id}`),

  // Inscripciones
  getInscripciones: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/inscripciones${q ? '?' + q : ''}`);
  },
  createInscripcion: (d) => req('POST', '/inscripciones', d),
  deleteInscripcion: (id) => req('DELETE', `/inscripciones/${id}`),

  // Asistencias
  getAsistencias: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/asistencias${q ? '?' + q : ''}`);
  },
  registrarAsistencia: (d) => req('POST', '/asistencias', d),

  // Reportes
  reportes: {
    inscriptosActividad: () => req('GET', '/reportes/inscriptos-por-actividad'),
    cuposDisponibles: () => req('GET', '/reportes/cupos-disponibles'),
    inscriptosDisciplina: () => req('GET', '/reportes/inscriptos-por-disciplina'),
    inscriptosCarrera: () => req('GET', '/reportes/inscriptos-por-carrera'),
    ocupacion: () => req('GET', '/reportes/ocupacion'),
    asistenciaActividad: () => req('GET', '/reportes/asistencia-por-actividad'),
    inasistencias: () => req('GET', '/reportes/inasistencias'),
    listaEspera: () => req('GET', '/reportes/lista-espera'),
    asistenciaDisciplina: () => req('GET', '/reportes/asistencia-por-disciplina'),
    multiplesActividades: () => req('GET', '/reportes/multiples-actividades'),
  }
};
