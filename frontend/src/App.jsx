import React, { useState, createContext, useEffect } from 'react';
import { api, setAuthToken } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Estudiantes from './pages/Estudiantes';
import Actividades from './pages/Actividades';
import Inscripciones from './pages/Inscripciones';
import Asistencias from './pages/Asistencias';
import Reportes from './pages/Reportes';
import Disciplinas from './pages/Disciplinas';
import Espacios from './pages/Espacios';
import MiPerfil from './pages/MiPerfil';

export const AuthContext = createContext(null);

const NAV_ADMIN = [
  { key: 'dashboard', label: 'Inicio' },
  { key: 'estudiantes', label: 'Estudiantes' },
  { key: 'disciplinas', label: 'Disciplinas' },
  { key: 'espacios', label: 'Espacios' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'inscripciones', label: 'Inscripciones' },
  { key: 'asistencias', label: 'Asistencias' },
  { key: 'reportes', label: 'Reportes' },
];

const NAV_STUDENT = [
  { key: 'dashboard', label: 'Inicio' },
  { key: 'mi-perfil', label: 'Mi Perfil' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'mis-inscripciones', label: 'Mis Inscripciones' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loginError, setLoginError] = useState('');

  // Maneja la expiracion de sesion (401 desde el backend)
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setPage('dashboard');
      setLoginError('La sesion expiro. Por favor ingrese nuevamente.');
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  async function handleLogin(username, password) {
    try {
      const u = await api.login(username, password);
      setAuthToken(u.token);
      setUser(u);
      setPage('dashboard');
      setLoginError('');
    } catch (e) {
      setLoginError(e.message);
    }
  }

  function handleLogout() {
    api.logout().catch(() => {});
    setAuthToken(null);
    setUser(null);
    setPage('dashboard');
  }

  if (!user) return <Login onLogin={handleLogin} error={loginError} />;

  const nav = user.role === 'admin' ? NAV_ADMIN : NAV_STUDENT;

  const pageProps = { user, setPage };

  const renderPage = () => {
    if (page === 'dashboard') return <Dashboard {...pageProps} />;
    if (page === 'estudiantes') return <Estudiantes {...pageProps} />;
    if (page === 'disciplinas') return <Disciplinas {...pageProps} />;
    if (page === 'espacios') return <Espacios {...pageProps} />;
    if (page === 'actividades') return <Actividades {...pageProps} />;
    if (page === 'inscripciones') return <Inscripciones {...pageProps} />;
    if (page === 'mis-inscripciones') return <Inscripciones {...pageProps} estudiante_id={user.id_estudiante} />;
    if (page === 'mi-perfil') return <MiPerfil {...pageProps} />;
    if (page === 'asistencias') return <Asistencias {...pageProps} />;
    if (page === 'reportes') return <Reportes {...pageProps} />;
    return <Dashboard {...pageProps} />;
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div style={styles.shell}>
        <nav style={styles.sidebar}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>&#9917;</span>
            <div>
              <div style={styles.logoTitle}>Deportes UNI</div>
              <div style={styles.logoSub}>Sistema deportivo</div>
            </div>
          </div>
          <ul style={styles.navList}>
            {nav.map(n => (
              <li key={n.key}>
                <button
                  style={{ ...styles.navBtn, ...(page === n.key ? styles.navBtnActive : {}) }}
                  onClick={() => setPage(n.key)}
                >
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
          <div style={styles.sidebarFooter}>
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>{user.nombre[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.nombre}</div>
                <div style={{ fontSize: 11, color: '#8fa7c4' }}>{user.role}</div>
              </div>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Salir</button>
          </div>
        </nav>
        <main style={styles.main}>
          {renderPage()}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f4f8' },
  sidebar: { width: 220, background: '#1a3a5c', display: 'flex', flexDirection: 'column', padding: '0', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '24px 20px 20px', borderBottom: '1px solid #24527a' },
  logoIcon: { fontSize: 26 },
  logoTitle: { color: '#fff', fontWeight: 700, fontSize: 15 },
  logoSub: { color: '#8fa7c4', fontSize: 11 },
  navList: { listStyle: 'none', margin: 0, padding: '12px 0', flex: 1 },
  navBtn: {
    display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
    background: 'none', border: 'none', color: '#b8cfe4', fontSize: 14,
    cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'all 0.15s'
  },
  navBtnActive: { color: '#fff', background: '#24527a', borderLeftColor: '#5b9bd5' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid #24527a' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 32, height: 32, borderRadius: '50%', background: '#2e6da4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0
  },
  logoutBtn: {
    width: '100%', padding: '7px 0', background: 'none', border: '1px solid #3a6a9a',
    color: '#8fa7c4', borderRadius: 4, cursor: 'pointer', fontSize: 13
  },
  main: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
};
