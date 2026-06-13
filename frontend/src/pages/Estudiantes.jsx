import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Modal, Field, inputStyle, Alert, Spinner } from '../components/UI';

const EMPTY = { documento: '', nombre: '', apellido: '', correo_electronico: '', id_carrera: '' };

export default function Estudiantes() {
  const [rows, setRows] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.getEstudiantes(), api.getCarreras()])
      .then(([e, c]) => { setRows(e); setCarreras(c); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  function openNew() { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }
  function openEdit(r) { setForm(r); setEditing(r.id_estudiante); setError(''); setModal(true); }
  function closeModal() { setModal(false); setError(''); }

  async function handleSave() {
    try {
      if (editing) await api.updateEstudiante(editing, form);
      else await api.createEstudiante(form);
      closeModal(); load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar estudiante?')) return;
    try { await api.deleteEstudiante(id); load(); }
    catch (e) { alert(e.message); }
  }

  const filtered = rows.filter(r =>
    `${r.nombre} ${r.apellido} ${r.documento}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'documento', label: 'Documento' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'carrera_nombre', label: 'Carrera' },
    { key: 'facultad_nombre', label: 'Facultad' },
    { key: 'correo_electronico', label: 'Correo' },
    {
      key: 'acciones', label: '', render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Btn>
          <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id_estudiante)}>Eliminar</Btn>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Estudiantes"
        subtitle="Gestión de estudiantes registrados"
        action={<Btn onClick={openNew}>+ Nuevo estudiante</Btn>}
      />
      <Card style={{ marginBottom: 16 }}>
        <input
          style={{ ...inputStyle, maxWidth: 300 }}
          placeholder="Buscar por nombre, apellido o documento..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </Card>
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} rows={filtered} emptyMsg="No hay estudiantes registrados" />}
      </Card>

      {modal && (
        <Modal title={editing ? 'Editar estudiante' : 'Nuevo estudiante'} onClose={closeModal}>
          <Alert msg={error} />
          <Field label="Documento"><input style={inputStyle} value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} /></Field>
          <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Apellido"><input style={inputStyle} value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} /></Field>
          <Field label="Correo electrónico"><input style={inputStyle} type="email" value={form.correo_electronico} onChange={e => setForm({ ...form, correo_electronico: e.target.value })} /></Field>
          <Field label="Carrera">
            <select style={inputStyle} value={form.id_carrera} onChange={e => setForm({ ...form, id_carrera: e.target.value })}>
              <option value="">Seleccionar carrera...</option>
              {carreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.facultad_nombre} — {c.nombre}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear estudiante'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
