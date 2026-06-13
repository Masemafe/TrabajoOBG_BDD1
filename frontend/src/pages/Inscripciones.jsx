import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Modal, Field, inputStyle, Alert, Spinner, estadoBadge } from '../components/UI';

export default function Inscripciones({ user, estudiante_id }) {
  const [rows, setRows] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id_estudiante: estudiante_id || '', id_actividad: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user.role === 'admin';

  const load = () => {
    setLoading(true);
    const params = estudiante_id ? { id_estudiante: estudiante_id } : {};
    Promise.all([
      api.getInscripciones(params),
      api.getActividades(),
      isAdmin ? api.getEstudiantes() : Promise.resolve([])
    ]).then(([i, a, e]) => {
      setRows(i); setActividades(a); setEstudiantes(e);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openNew() { setForm({ id_estudiante: estudiante_id || '', id_actividad: '' }); setError(''); setSuccess(''); setModal(true); }
  function closeModal() { setModal(false); setError(''); setSuccess(''); }

  async function handleSave() {
    setError(''); setSuccess('');
    try {
      const res = await api.createInscripcion(form);
      setSuccess(res.estado === 'confirmada'
        ? '✓ Inscripción confirmada exitosamente.'
        : '⏳ No había cupo. Quedaste en lista de espera.');
      load();
      setTimeout(closeModal, 2500);
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Cancelar esta inscripción?')) return;
    try { await api.deleteInscripcion(id); load(); }
    catch (e) { alert(e.message); }
  }

  // Columnas distintas para admin (ve todos) vs. estudiante (ve las propias)
  const columns = isAdmin
    ? [
        { key: 'est_apellido', label: 'Apellido' },
        { key: 'est_nombre', label: 'Nombre' },
        { key: 'documento', label: 'Documento' },
        { key: 'actividad_nombre', label: 'Actividad' },
        { key: 'fecha_inscripcion', label: 'Fecha' },
        { key: 'estado', label: 'Estado', render: r => estadoBadge(r.estado) },
        { key: 'acciones', label: '', render: r => <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id_inscripcion)}>Cancelar</Btn> }
      ]
    : [
        { key: 'actividad_nombre', label: 'Actividad' },
        { key: 'fecha_inscripcion', label: 'Fecha' },
        { key: 'estado', label: 'Estado', render: r => estadoBadge(r.estado) },
        { key: 'acciones', label: '', render: r => <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id_inscripcion)}>Cancelar</Btn> }
      ];

  return (
    <div>
      <PageHeader
        title={estudiante_id ? 'Mis inscripciones' : 'Inscripciones'}
        subtitle="Gestión de inscripciones a actividades deportivas"
        action={<Btn onClick={openNew}>+ Nueva inscripción</Btn>}
      />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} rows={rows} emptyMsg="No hay inscripciones registradas" />}
      </Card>

      {modal && (
        <Modal title="Nueva inscripción" onClose={closeModal}>
          <Alert msg={error} />
          <Alert msg={success} type="success" />
          {isAdmin && (
            <Field label="Estudiante">
              <select style={inputStyle} value={form.id_estudiante} onChange={e => setForm({ ...form, id_estudiante: e.target.value })}>
                <option value="">Seleccionar estudiante...</option>
                {estudiantes.map(e => <option key={e.id_estudiante} value={e.id_estudiante}>{e.apellido}, {e.nombre} — {e.documento}</option>)}
              </select>
            </Field>
          )}
          <Field label="Actividad">
            <select style={inputStyle} value={form.id_actividad} onChange={e => setForm({ ...form, id_actividad: e.target.value })}>
              <option value="">Seleccionar actividad...</option>
              {actividades.filter(a => a.estado === 'abierta').map(a => (
                <option key={a.id_actividad} value={a.id_actividad}>
                  {a.nombre} — {a.dia} {a.horario?.substring(0, 5)} ({a.confirmados}/{a.cupo_maximo})
                </option>
              ))}
            </select>
          </Field>
          <div style={{ fontSize: 12, color: '#8fa7c4', marginBottom: 14 }}>
            Solo las actividades abiertas aceptan inscripciones. Si el cupo está completo, quedás en lista de espera.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={handleSave}>Inscribir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
