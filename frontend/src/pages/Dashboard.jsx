import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PageHeader, Card, StatCard } from '../components/UI';

const EMPTY_STATS = { estudiantes: '—', actividades: '—', abiertas: '—', inscripciones: '—', disciplinas: '—' };

export default function Dashboard({ user, setPage }) {
  const [stats, setStats] = useState(EMPTY_STATS);

  useEffect(() => {
    Promise.all([api.getEstudiantes(), api.getActividades(), api.getDisciplinas()])
      .then(([est, act, disc]) => {
        const abiertas = act.filter(a => a.estado === 'abierta');
        const totalConfirmados = act.reduce((s, a) => s + (a.confirmados || 0), 0);
        setStats({ estudiantes: est.length, actividades: act.length, abiertas: abiertas.length, inscripciones: totalConfirmados, disciplinas: disc.length });
      })
      .catch(() => {});
  }, []);

  const isAdmin = user.role === 'admin';

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${user.nombre}`}
        subtitle={isAdmin ? 'Panel de administración' : 'Portal estudiantil'}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        {isAdmin && <>
          <StatCard label="Estudiantes" value={stats.estudiantes} />
          <StatCard label="Actividades" value={stats.actividades} sub={`${stats.abiertas} abiertas`} />
          <StatCard label="Disciplinas" value={stats.disciplinas} />
        </>}
        <StatCard label="Inscripciones activas" value={stats.inscripciones} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {isAdmin && <>
          <QuickCard icon="👥" title="Estudiantes" desc="Alta, baja y modificación de estudiantes registrados." action={() => setPage('estudiantes')} />
          <QuickCard icon="🏃" title="Actividades" desc="Gestión de actividades deportivas y sus estados." action={() => setPage('actividades')} />
          <QuickCard icon="📋" title="Inscripciones" desc="Ver y gestionar inscripciones confirmadas y en espera." action={() => setPage('inscripciones')} />
          <QuickCard icon="✅" title="Asistencias" desc="Registrar y consultar asistencia por actividad." action={() => setPage('asistencias')} />
          <QuickCard icon="📊" title="Reportes" desc="Consultas y estadísticas del sistema deportivo." action={() => setPage('reportes')} />
        </>}
        {!isAdmin && <>
          <QuickCard icon="👤" title="Mi perfil" desc="Ver y editar tus datos personales." action={() => setPage('mi-perfil')} />
          <QuickCard icon="🏃" title="Ver actividades" desc="Explorar actividades deportivas e inscribirte." action={() => setPage('actividades')} />
          <QuickCard icon="📋" title="Mis inscripciones" desc="Ver el estado de tus inscripciones." action={() => setPage('mis-inscripciones')} />
        </>}
      </div>
    </div>
  );
}

function QuickCard({ icon, title, desc, action }) {
  return (
    <Card style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: '#1a3a5c', fontSize: 15, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#5a7a9a', fontSize: 13, marginBottom: 14 }}>{desc}</div>
      <button onClick={action} style={{
        background: '#eaf1f8', border: 'none', padding: '7px 14px',
        borderRadius: 4, color: '#2e6da4', fontWeight: 600, cursor: 'pointer', fontSize: 13
      }}>
        Ir →
      </button>
    </Card>
  );
}
