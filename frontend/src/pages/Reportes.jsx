import React, { useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Spinner } from '../components/UI';

const REPORTES = [
  {
    key: 'inscriptosActividad', label: '1. Inscriptos por actividad',
    desc: 'Actividades ordenadas por cantidad de inscriptos confirmados.',
    columns: [
      { key: 'actividad', label: 'Actividad' },
      { key: 'total_confirmados', label: 'Confirmados' },
    ]
  },
  {
    key: 'cuposDisponibles', label: '2. Cupos disponibles',
    desc: 'Actividades abiertas con lugares disponibles.',
    columns: [
      { key: 'actividad', label: 'Actividad' },
      { key: 'cupo_maximo', label: 'Cupo máx.' },
      { key: 'confirmados', label: 'Confirmados' },
      { key: 'lugares_disponibles', label: 'Disponibles' },
    ]
  },
  {
    key: 'inscriptosDisciplina', label: '3. Inscriptos por disciplina',
    desc: 'Estudiantes únicos por disciplina deportiva.',
    columns: [
      { key: 'disciplina', label: 'Disciplina' },
      { key: 'estudiantes', label: 'Estudiantes' },
    ]
  },
  {
    key: 'inscriptosCarrera', label: '4. Inscriptos por carrera y facultad',
    desc: 'Cantidad de estudiantes con inscripciones confirmadas por carrera.',
    columns: [
      { key: 'facultad', label: 'Facultad' },
      { key: 'carrera', label: 'Carrera' },
      { key: 'estudiantes', label: 'Estudiantes' },
    ]
  },
  {
    key: 'ocupacion', label: '5. Porcentaje de ocupación',
    desc: 'Qué porcentaje del cupo está ocupado en cada actividad.',
    columns: [
      { key: 'actividad', label: 'Actividad' },
      { key: 'cupo_maximo', label: 'Cupo' },
      { key: 'confirmados', label: 'Confirmados' },
      { key: 'porcentaje_ocupacion', label: '% Ocupación', render: r => `${r.porcentaje_ocupacion}%` },
    ]
  },
  {
    key: 'asistenciaActividad', label: '6. Asistencia por actividad',
    desc: 'Porcentaje de asistencia efectiva en cada actividad.',
    columns: [
      { key: 'actividad', label: 'Actividad' },
      { key: 'total_registros', label: 'Registros' },
      { key: 'presentes', label: 'Presentes' },
      { key: 'porcentaje_asistencia', label: '% Asistencia', render: r => `${r.porcentaje_asistencia}%` },
    ]
  },
  {
    key: 'inasistencias', label: '7. Estudiantes con 3+ inasistencias',
    desc: 'Estudiantes con tres o más registros de ausencia.',
    columns: [
      { key: 'apellido', label: 'Apellido' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'documento', label: 'Documento' },
      { key: 'inasistencias', label: 'Inasistencias' },
    ]
  },
  {
    key: 'listaEspera', label: '8. Actividades con lista de espera',
    desc: 'Actividades con al menos un estudiante en espera.',
    columns: [
      { key: 'actividad', label: 'Actividad' },
      { key: 'en_espera', label: 'En espera' },
    ]
  },
  {
    key: 'asistenciaDisciplina', label: '9. Asistencia promedio por disciplina',
    desc: 'Ranking de disciplinas por porcentaje de asistencia.',
    columns: [
      { key: 'disciplina', label: 'Disciplina' },
      { key: 'total_registros', label: 'Registros' },
      { key: 'presentes', label: 'Presentes' },
      { key: 'porcentaje_asistencia', label: '% Asistencia', render: r => `${r.porcentaje_asistencia}%` },
    ]
  },
  {
    key: 'multiplesActividades', label: '10. Estudiantes en múltiples actividades',
    desc: 'Estudiantes con inscripciones confirmadas en 2 o más actividades.',
    columns: [
      { key: 'apellido', label: 'Apellido' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'actividades', label: 'Actividades' },
    ]
  },
];

export default function Reportes() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [active, setActive] = useState(null);

  async function runReporte(key, force = false) {
    setActive(key);
    if (!force && results[key]) return;
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const data = await api.reportes[key]();
      setResults(prev => ({ ...prev, [key]: data }));
    } catch (e) {
      setResults(prev => ({ ...prev, [key]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const current = REPORTES.find(r => r.key === active);

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Consultas estadísticas del sistema deportivo" />
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 240, flexShrink: 0 }}>
          <Card style={{ padding: 0 }}>
            {REPORTES.map(r => (
              <button key={r.key}
                onClick={() => runReporte(r.key)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px',
                  background: active === r.key ? '#eaf1f8' : 'transparent',
                  border: 'none', borderBottom: '1px solid #e8f0f8',
                  borderLeft: active === r.key ? '3px solid #2e6da4' : '3px solid transparent',
                  cursor: 'pointer', fontSize: 13,
                  color: active === r.key ? '#1a3a5c' : '#4a6a8a',
                  fontWeight: active === r.key ? 600 : 400,
                  transition: 'all 0.12s'
                }}>
                {r.label}
              </button>
            ))}
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          {!active && (
            <Card>
              <div style={{ textAlign: 'center', padding: 40, color: '#8fa7c4' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
                Seleccioná un reporte de la lista para ejecutarlo.
              </div>
            </Card>
          )}
          {active && current && (
            <Card>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', color: '#1a3a5c', fontSize: 16 }}>{current.label}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#5a7a9a' }}>{current.desc}</p>
                </div>
                <Btn size="sm" variant="ghost" onClick={() => runReporte(active, true)}>
                  ↻ Actualizar
                </Btn>
              </div>
              {loading[active] ? <Spinner /> : (
                <Table
                  columns={current.columns}
                  rows={results[active] || []}
                  emptyMsg="Sin resultados para esta consulta."
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
