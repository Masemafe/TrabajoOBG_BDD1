import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Alert, Spinner, inputStyle, Badge } from '../components/UI';

export default function Asistencias() {
  const [actividades, setActividades] = useState([]);
  const [selectedAct, setSelectedAct] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [inscriptos, setInscriptos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.getActividades().then(setActividades); }, []);

  async function cargarInscriptos() {
    if (!selectedAct || !fecha) return;
    setLoading(true); setMsg(''); setError('');
    try {
      const [insc, asist] = await Promise.all([
        api.getInscripciones({ id_actividad: selectedAct }),
        api.getAsistencias({ id_actividad: selectedAct, fecha })
      ]);
      const confirmados = insc.filter(i => i.estado === 'confirmada');
      setInscriptos(confirmados);
      const map = {};
      asist.forEach(a => { map[a.id_inscripcion] = a.asistio; });
      // Default: false if not yet registered
      confirmados.forEach(i => { if (!(i.id_inscripcion in map)) map[i.id_inscripcion] = false; });
      setAsistencias(map);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleGuardar() {
    setSaving(true); setMsg(''); setError('');
    try {
      await Promise.all(inscriptos.map(i =>
        api.registrarAsistencia({ id_inscripcion: i.id_inscripcion, fecha, asistio: !!asistencias[i.id_inscripcion] })
      ));
      setMsg('Asistencias guardadas correctamente.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const presentes = Object.values(asistencias).filter(Boolean).length;

  const columns = [
    { key: 'est_apellido', label: 'Apellido' },
    { key: 'est_nombre', label: 'Nombre' },
    { key: 'documento', label: 'Documento' },
    {
      key: 'asistio', label: 'Asistencia', render: r => (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!asistencias[r.id_inscripcion]}
            onChange={e => setAsistencias({ ...asistencias, [r.id_inscripcion]: e.target.checked })}
          />
          {asistencias[r.id_inscripcion]
            ? <Badge label="Presente" color="green" />
            : <Badge label="Ausente" color="red" />
          }
        </label>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Registro de asistencias" subtitle="Control de asistencia por actividad y fecha" />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d4a66', marginBottom: 5 }}>Actividad</label>
            <select style={{ ...inputStyle, minWidth: 240 }} value={selectedAct} onChange={e => setSelectedAct(e.target.value)}>
              <option value="">Seleccionar actividad...</option>
              {actividades.filter(a => a.estado === 'abierta').map(a => (
                <option key={a.id_actividad} value={a.id_actividad}>{a.nombre} — {a.dia}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d4a66', marginBottom: 5 }}>Fecha</label>
            <input style={{ ...inputStyle, width: 160 }} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <Btn onClick={cargarInscriptos} disabled={!selectedAct || !fecha}>Cargar lista</Btn>
        </div>
      </Card>

      {loading && <Spinner />}

      {!loading && inscriptos.length > 0 && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#5a7a9a' }}>
                <strong style={{ color: '#1a3a5c' }}>{presentes}</strong> / {inscriptos.length} presentes
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" size="sm" onClick={() => {
                  const all = {}; inscriptos.forEach(i => { all[i.id_inscripcion] = true; }); setAsistencias(all);
                }}>Marcar todos</Btn>
                <Btn variant="ghost" size="sm" onClick={() => {
                  const none = {}; inscriptos.forEach(i => { none[i.id_inscripcion] = false; }); setAsistencias(none);
                }}>Desmarcar todos</Btn>
              </div>
            </div>
          </Card>

          <Alert msg={error} />
          <Alert msg={msg} type="success" />

          <Card>
            <Table columns={columns} rows={inscriptos} />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn onClick={handleGuardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar asistencias'}</Btn>
            </div>
          </Card>
        </>
      )}

      {!loading && inscriptos.length === 0 && selectedAct && (
        <Card><div style={{ textAlign: 'center', color: '#8fa7c4', padding: 28 }}>No hay estudiantes confirmados en esta actividad.</div></Card>
      )}
    </div>
  );
}
