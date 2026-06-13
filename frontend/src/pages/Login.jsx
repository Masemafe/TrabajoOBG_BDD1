import React, { useState } from 'react';

export default function Login({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onLogin(username, password);
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={{ fontSize: 40 }}>⚽</span>
          <h1 style={styles.title}>Deportes UNI</h1>
          <p style={styles.sub}>Sistema de Gestión de Actividades Deportivas</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin / estudiante"
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button style={styles.btn} type="submit">Ingresar</button>
        </form>
        <div style={styles.hint}>
          <strong>Accesos de prueba:</strong><br />
          Admin: <code>admin</code> / <code>admin123</code><br />
          Estudiante: <code>pparker</code> / <code>spiderman</code> (Peter Parker)
        </div>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#eaf1f8', fontFamily: "'Segoe UI', system-ui, sans-serif"
  },
  card: {
    background: '#fff', borderRadius: 10, width: 360,
    boxShadow: '0 4px 24px rgba(26,58,92,0.12)', overflow: 'hidden'
  },
  header: {
    background: '#1a3a5c', padding: '28px 28px 20px', textAlign: 'center'
  },
  title: { color: '#fff', margin: '8px 0 4px', fontSize: 22, fontWeight: 700 },
  sub: { color: '#8fa7c4', margin: 0, fontSize: 13 },
  form: { padding: '24px 28px 0' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#2d4a66', marginBottom: 5 },
  input: {
    width: '100%', padding: '9px 12px', border: '1px solid #c8ddef',
    borderRadius: 4, fontSize: 14, boxSizing: 'border-box', outline: 'none'
  },
  btn: {
    width: '100%', padding: '10px 0', background: '#2e6da4', color: '#fff',
    border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 4, marginBottom: 20
  },
  error: {
    background: '#fde8e8', color: '#922', padding: '9px 12px',
    borderRadius: 4, marginBottom: 14, fontSize: 13
  },
  hint: {
    background: '#f0f6fc', borderTop: '1px solid #d9e6f2',
    padding: '14px 28px', fontSize: 12, color: '#4a6a8a', lineHeight: 1.7
  },
};
