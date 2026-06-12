import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, Btn, Modal, Field, inputStyle, Alert, Spinner } from '../components/UI';

export default function MiPerfil({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [carreras, setCarreras] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function load() {
    Promise.all([api.getEstudiante(user.id_estudiante), api.getCarreras()])
      .then(([p, c]) => { setPerfil(p); setCarreras(c); });
  }
  useEffect(load, []);

  function openEdit() { setForm({ ...perfil }); setError(''); setSuccess(''); setModal(true); }
  function closeModal() { setModal(false); setError(''); setSuccess(''); }

  async function handleSave() {
    try {
      await api.updateEstudiante(user.id_estudiante, form);
      setSuccess('Perfil actualizado correctamente.');
      load();
      setTimeout(closeModal, 1500);
    } catch (e) { setError(e.message); }
  }

  if (!perfil) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Mi perfil"
        subtitle="Tus datos en el sistema deportivo"
        action={<Btn onClick={openEdit}>Editar</Btn>}
      />
      <Card style={{ maxWidth: 500 }}>
        <Row label="Documento" value={perfil.documento} />
        <Row label="Apellido" value={perfil.apellido} />
        <Row label="Nombre" value={perfil.nombre} />
        <Row label="Correo" value={perfil.correo_electronico} />
        <Row label="Carrera" value={perfil.carrera_nombre} />
        <Row label="Facultad" value={perfil.facultad_nombre} />
      </Card>

      {modal && (
        <Modal title="Editar perfil" onClose={closeModal}>
          <Alert msg={error} />
          <Alert msg={success} type="success" />
          <Field label="Documento">
            <input style={inputStyle} value={form.documento || ''} onChange={e => setForm({ ...form, documento: e.target.value })} />
          </Field>
          <Field label="Nombre">
            <input style={inputStyle} value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Apellido">
            <input style={inputStyle} value={form.apellido || ''} onChange={e => setForm({ ...form, apellido: e.target.value })} />
          </Field>
          <Field label="Correo electrónico">
            <input style={inputStyle} type="email" value={form.correo_electronico || ''} onChange={e => setForm({ ...form, correo_electronico: e.target.value })} />
          </Field>
          <Field label="Carrera">
            <select style={inputStyle} value={form.id_carrera || ''} onChange={e => setForm({ ...form, id_carrera: e.target.value })}>
              {carreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.facultad_nombre} — {c.nombre}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
            <Btn onClick={handleSave}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #e8f0f8' }}>
      <span style={{ width: 110, fontSize: 13, color: '#5a7a9a', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#1a3a5c' }}>{value || '—'}</span>
    </div>
  );
}
