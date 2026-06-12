import React, { useState } from 'react';

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a3a5c' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', color: '#5a7a9a', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #d9e6f2', padding: 20, ...style }}>
      {children}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ columns, rows, emptyMsg = 'Sin datos' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={thStyle}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 28, color: '#8fa7c4' }}>{emptyMsg}</td></tr>
            : rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7fafd' }}>
                {columns.map(c => (
                  <td key={c.key} style={tdStyle}>{c.render ? c.render(r) : r[c.key]}</td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: '10px 14px', textAlign: 'left', background: '#eaf1f8',
  color: '#1a3a5c', fontWeight: 600, fontSize: 13, borderBottom: '2px solid #c8ddef'
};
const tdStyle = { padding: '9px 14px', borderBottom: '1px solid #e8f0f8', color: '#2d4a66' };

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', style, disabled }) {
  const base = {
    border: 'none', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500, transition: 'background 0.15s', opacity: disabled ? 0.6 : 1,
    fontSize: size === 'sm' ? 12 : 14, padding: size === 'sm' ? '5px 10px' : '8px 16px',
    ...style
  };
  const variants = {
    primary: { background: '#2e6da4', color: '#fff' },
    danger: { background: '#c0392b', color: '#fff' },
    ghost: { background: '#eaf1f8', color: '#1a3a5c' },
    success: { background: '#1e7e48', color: '#fff' },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose }) {
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <strong style={{ fontSize: 16, color: '#1a3a5c' }}>{title}</strong>
          <button style={modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalBox = {
  background: '#fff', borderRadius: 8, width: '90%', maxWidth: 480,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto'
};
const modalHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 20px', borderBottom: '1px solid #e8f0f8'
};
const modalClose = {
  background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#7a9ab8'
};

// ─── FormField ────────────────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d4a66', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #c8ddef', borderRadius: 4,
  fontSize: 14, color: '#1a3a5c', boxSizing: 'border-box', outline: 'none'
};

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ msg, type = 'error' }) {
  if (!msg) return null;
  const colors = { error: '#fde8e8', success: '#e8f5ee', info: '#e8f1fb' };
  const textColors = { error: '#922', success: '#1e5c35', info: '#1a3a5c' };
  return (
    <div style={{ background: colors[type], color: textColors[type], borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontSize: 14 }}>
      {msg}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, color }) {
  const palettes = {
    green: { bg: '#e8f5ee', color: '#1e5c35' },
    blue: { bg: '#e8f1fb', color: '#1a3a5c' },
    yellow: { bg: '#fef9e7', color: '#7a5c00' },
    red: { bg: '#fde8e8', color: '#922' },
    gray: { bg: '#edf2f7', color: '#4a6a8a' },
  };
  const p = palettes[color] || palettes.gray;
  return (
    <span style={{ ...p, padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{label}</span>
  );
}

export function estadoBadge(estado) {
  const map = {
    abierta: ['Abierta', 'green'],
    cerrada: ['Cerrada', 'yellow'],
    finalizada: ['Finalizada', 'gray'],
    cancelada: ['Cancelada', 'red'],
    confirmada: ['Confirmada', 'green'],
    lista_espera: ['Lista de espera', 'yellow'],
  };
  const [label, color] = map[estado] || [estado, 'gray'];
  return <Badge label={label} color={color} />;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return <div style={{ textAlign: 'center', padding: 40, color: '#8fa7c4' }}>Cargando...</div>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub }) {
  return (
    <Card style={{ minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#2e6da4' }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a5c', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#8fa7c4', marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}
