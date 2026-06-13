import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Modal, Field, inputStyle, Alert, Spinner } from '../components/UI';

export default function Espacios() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); api.getEspacios().then(setRows).finally(() => setLoading(false)); };
  useEffect(load, []);

  function openNew() { setForm({ nombre: '', descripcion: '' }); setEditing(null); setError(''); setModal(true); }
  function openEdit(r) { setForm(r); setEditing(r.id_espacio); setError(''); setModal(true); }
  function closeModal() { setModal(false); setError(''); }

  async function handleSave() {
    try {
      if (editing) await api.updateEspacio(editing, form);
      else await api.createEspacio(form);
      closeModal(); load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar espacio?')) return;
    try { await api.deleteEspacio(id); load(); }
    catch (e) { alert(e.message); }
  }

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'acciones', label: '', render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Btn>
          <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id_espacio)}>Eliminar</Btn>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Espacios deportivos" subtitle="Canchas, gimnasios y salones" action={<Btn onClick={openNew}>+ Nuevo espacio</Btn>} />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} rows={rows} emptyMsg="No hay espacios registrados" />}
      </Card>
      {modal && (
        <Modal title={editing ? 'Editar espacio' : 'Nuevo espacio'} onClose={closeModal}>
          <Alert msg={error} />
          <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Descripción"><input style={inputStyle} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
