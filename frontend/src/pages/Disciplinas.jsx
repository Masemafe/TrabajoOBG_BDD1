import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Table, Btn, Modal, Field, inputStyle, Alert, Spinner } from '../components/UI';

export default function Disciplinas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); api.getDisciplinas().then(setRows).finally(() => setLoading(false)); };
  useEffect(load, []);

  function openNew() { setForm({ nombre: '' }); setEditing(null); setError(''); setModal(true); }
  function openEdit(r) { setForm(r); setEditing(r.id_disciplina); setError(''); setModal(true); }
  function closeModal() { setModal(false); setError(''); }

  async function handleSave() {
    try {
      if (editing) await api.updateDisciplina(editing, form);
      else await api.createDisciplina(form);
      closeModal(); load();
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar disciplina?')) return;
    try { await api.deleteDisciplina(id); load(); }
    catch (e) { alert(e.message); }
  }

  const columns = [
    { key: 'id_disciplina', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'acciones', label: '', render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Btn>
          <Btn size="sm" variant="danger" onClick={() => handleDelete(r.id_disciplina)}>Eliminar</Btn>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Disciplinas" subtitle="Disciplinas deportivas disponibles" action={<Btn onClick={openNew}>+ Nueva disciplina</Btn>} />
      <Card>
        {loading ? <Spinner /> : <Table columns={columns} rows={rows} emptyMsg="No hay disciplinas registradas" />}
      </Card>
      {modal && (
        <Modal title={editing ? 'Editar disciplina' : 'Nueva disciplina'} onClose={closeModal}>
          <Alert msg={error} />
          <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
