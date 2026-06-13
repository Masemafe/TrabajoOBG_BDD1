# Deportes UNI — Sistema de Gestión de Actividades Deportivas
Trabajo Obligatorio de Bases de Datos 1

## Stack Tecnologico
- **Backend**: Python 3 + Flask
- **Frontend**: React 18
- **Base de datos**: MySQL 8
- **Contenedores**: Docker + docker-compose

---

## Opción A — Correr con Docker (recomendado)

### Requisitos
- Docker Desktop instalado y corriendo

### Pasos

```bash
# 1. Clonar / descomprimir el proyecto
cd TrabajoOBG_BDD1

# 2. Levantar todo
docker-compose up --build

# 3. Abrir en el navegador
#    Frontend: http://localhost:3000
#    Backend (API): http://localhost:5000
```

La base de datos se inicializa automáticamente con el script `backend/init_db.sql`.

---

## Opción B — Correr local (sin Docker)

### Requisitos
- Python 3.10+
- Node.js 18+
- MySQL 8 corriendo localmente

### Base de datos

```sql
-- En MySQL Workbench o terminal MySQL:
source ruta/al/backend/init_db.sql
```

### Backend

```bash
cd backend
pip install -r requirements.txt

# Variables de entorno (opcional, defaults apuntan a localhost)
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=tu_password
export DB_NAME=deportes_uni

python app.py
# Corre en http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Abre automáticamente http://localhost:3000
# El proxy está configurado para apuntar al backend en :5000
```

---

## Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador (acceso completo) |
| `pparker` | `spiderman` | Estudiante (vista limitada) |

---

## Estructura del proyecto

```
sports-app/
├── backend/
│   ├── app.py              # API Flask con todas las rutas
│   ├── init_db.sql         # Script SQL: tablas + datos maestros
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Layout, navegación, autenticación
│   │   ├── api/index.jsx    # Funciones de comunicación con el backend
│   │   ├── components/UI.jsx # Componentes reutilizables (tabla, modal, etc.)
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Estudiantes.jsx
│   │       ├── Disciplinas.jsx
│   │       ├── Espacios.jsx
│   │       ├── Actividades.jsx
│   │       ├── Inscripciones.jsx
│   │       ├── Asistencias.jsx
│   │       └── Reportes.jsx     # Las 10 consultas requeridas
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---

## Funcionalidades

### Como administrador
- ABM de estudiantes, disciplinas, espacios y actividades
- Gestión de inscripciones (con control de cupo y lista de espera)
- Registro de asistencias por actividad y fecha
- 10 reportes estadísticos

### Como estudiante
- Ver actividades disponibles
- Inscribirse a actividades
- Ver estado de sus inscripciones

---

## Reglas de negocio implementadas

1. Solo se permiten inscripciones a actividades con estado `abierta`
2. Si hay cupo disponible → estado `confirmada`
3. Si no hay cupo → estado `lista_espera`
4. No se permite inscribir el mismo estudiante dos veces a la misma actividad
5. Solo se puede registrar asistencia de inscripciones `confirmadas`
6. Las validaciones están tanto en el backend (Python) como a nivel de BD (UNIQUE, FK)
