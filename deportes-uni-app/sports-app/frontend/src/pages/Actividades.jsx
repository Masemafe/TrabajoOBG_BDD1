import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Modal, Field, inputStyle, Alert, Spinner, estadoBadge } from '../components/UI';

const EMPTY = { nombre: '', id_disciplina: '', id_espacio: '', cupo_maximo: '', dia: '', horario: '', estado: 'abierta' };
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ESTADOS = ['abierta', 'cerrada', 'finalizada', 'cancelada'];

export default function Actividades({ user }) {
  const [rows, setRows] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [inscMsg, setInscMsg] = useState({ text: '', type: 'success' });

  const isAdmin = user.role === 'admin';

  const load = () => {
    setLoading(true);
    Promise.all([api.getActividades(), api.getDisciplinas(), api.getEspacios()])
      .then(([a, d, e]) => { setRows(a); setDisciplinas(d); setEspacios(e); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openNew() { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }
  function openEdit(r) {
    setForm({ ...r, horario: r.horario?.substring(0, 5) || '' });
    setEditing(r.id_actividad); setError(''); setModal(true);
  }
  function closeModal() { setModal(false); setError(''); }

  async function handleSave() {
    try {
      if (editing) await api.updateActividad(editing, form);
      else await api.createActividad(form);
      closeModal(); load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar actividad?')) return;
    try { await api.deleteActividad(id); load(); }
    catch (e) { alert(e.message); }
  }

  async function handleInscribir(id_actividad) {
    setInscMsg({ text: '', type: 'success' });
    try {
      const res = await api.createInscripcion({ id_estudiante: user.id_estudiante, id_actividad });
      setInscMsg({
        text: res.estado === 'confirmada' ? '✓ Inscripción confirmada.' : '⏳ Sin cupo disponible. Quedaste en lista de espera.',
        type: res.estado === 'confirmada' ? 'success' : 'info'
      });
      load();
    } catch (e) {
      setInscMsg({ text: e.message, type: 'error' });
    }
    setTimeout(() => setInscMsg({ text: '', type: 'success' }), 4000);
  }

  const filtered = filterEstado ? rows.filter(r => r.estado === filterEstado) : rows;

  const columns = [
    { key: 'nombre', label: 'Actividad' },
    { key: 'disciplina_nombre', label: 'Disciplina' },
    { key: 'espacio_nombre', label: 'Espacio' },
    { key: 'dia', label: 'Día' },
    { key: 'horario', label: 'Horario', render: r => r.horario?.substring(0, 5) },
    { key: 'cupo', label: 'Cupo', render: r => <span>{r.confirmados || 0} / {r.cupo_maximo}</span> },
    { key: 'estado', label: 'Estado', render: r => estadoBadge(r.estado) },
    ...(isAdmin ? [{
      key: 'acciones', label: '', render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Btn>
          <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id_actividad)}>Eliminar</Btn>
        </div>
      )
    }] : [{
      key: 'inscribirse', label: '', render: r => (
        <Btn size="sm" variant={r.estado === 'abierta' ? 'primary' : 'ghost'} onClick={() => handleInscribir(r.id_actividad)}>
          Inscribirse
        </Btn>
      )
    }])
  ];

  return (
    <div>
      <PageHeader
        title="Actividades deportivas"
        subtitle="Listado de actividades y su estado"
        action={isAdmin ? <Btn onClick={openNew}>+ Nueva actividad</Btn> : null}
      />
      {inscMsg.text && (
        <div style={{ marginBottom: 16 }}>
          <Alert msg={inscMsg.text} type={inscMsg.type} />
        </div>
      )}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#5a7a9a' }}>Filtrar por estado:</span>
          <select style={{ ...inputStyle, maxWidth: 160 }} value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </Card>
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} rows={filtered} emptyMsg="No hay actividades" />}
      </Card>

      {modal && (
        <Modal title={editing ? 'Editar actividad' : 'Nueva actividad'} onClose={closeModal}>
          <Alert msg={error} />
          <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Disciplina">
            <select style={inputStyle} value={form.id_disciplina} onChange={e => setForm({ ...form, id_disciplina: e.target.value })}>
              <option value="">Seleccionar...</option>
              {disciplinas.map(d => <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre}</option>)}
            </select>
          </Field>
          <Field label="Espacio">
            <select style={inputStyle} value={form.id_espacio} onChange={e => setForm({ ...form, id_espacio: e.target.value })}>
              <option value="">Seleccionar...</option>
              {espacios.map(e => <option key={e.id_espacio} value={e.id_espacio}>{e.nombre}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Cupo máximo"><input style={inputStyle} type="number" value={form.cupo_maximo} onChange={e => setForm({ ...form, cupo_maximo: e.target.value })} /></Field>
            <Field label="Horario"><input style={inputStyle} type="time" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Día">
              <select style={inputStyle} value={form.dia} onChange={e => setForm({ ...form, dia: e.target.value })}>
                <option value="">Seleccionar...</option>
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select style={inputStyle} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
