from flask import Flask, jsonify, request, g
from flask_cors import CORS
import mysql.connector
import os
import hashlib
import secrets
import datetime
from functools import wraps

app = Flask(__name__)
app.json.ensure_ascii = False  # Permite tildes y caracteres Unicode en respuestas JSON
CORS(app)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'deportes_uni'),
    'charset': 'utf8mb4',
    'use_unicode': True,
}

# Sesiones activas en memoria: token → datos de usuario
# Se limpian al reiniciar el backend; aceptable para entorno de desarrollo.
active_sessions = {}


def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def get_db():
    conn = mysql.connector.connect(**DB_CONFIG)
    # set_charset_collation actualiza tanto el servidor (SET NAMES) como el
    # estado interno del conector Python para decodificar correctamente.
    conn.set_charset_collation('utf8mb4', 'utf8mb4_unicode_ci')
    return conn


def _serialize_value(v):
    if isinstance(v, datetime.timedelta):
        total = int(v.total_seconds())
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return f'{h:02d}:{m:02d}:{s:02d}'
    if isinstance(v, str):
        # Repara doble-encodeo: cuando los datos fueron almacenados con conexión
        # latin1, los bytes UTF-8 de cada acento quedan como dos chars Latin-1.
        # encode('latin-1') recupera los bytes originales; decode('utf-8') los
        # reinterpreta correctamente. Falla para texto ya correcto → se devuelve tal cual.
        try:
            return v.encode('latin-1').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            return v
    return v


def _serialize_row(row):
    if row is None:
        return None
    return {k: _serialize_value(v) for k, v in row.items()}


def db_query(sql, params=None, fetchone=False, commit=False):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or ())
        if commit:
            conn.commit()
            return cursor.lastrowid
        if fetchone:
            return _serialize_row(cursor.fetchone())
        return [_serialize_row(r) for r in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


# ─── Decoradores de seguridad ─────────────────────────────────────────────────

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Auth-Token', '')
        session = active_sessions.get(token)
        if not session:
            return jsonify({'error': 'No autorizado'}), 401
        g.user = session
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Auth-Token', '')
        session = active_sessions.get(token)
        if not session:
            return jsonify({'error': 'No autorizado'}), 401
        if session['role'] != 'admin':
            return jsonify({'error': 'Acceso denegado: se requiere rol administrador'}), 403
        g.user = session
        return f(*args, **kwargs)
    return decorated


# ─── AUTH ─────────────────────────────────────────────────────────────────────

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '')
    password = data.get('password', '')
    user = db_query("SELECT * FROM USUARIO WHERE username=%s", (username,), fetchone=True)
    if not user or user['password_hash'] != hash_password(password):
        return jsonify({'error': 'Credenciales incorrectas'}), 401
    token = secrets.token_hex(32)
    active_sessions[token] = {
        'username': username,
        'role': user['role'],
        'nombre': user['nombre'],
        'id_estudiante': user['id_estudiante'],
    }
    return jsonify({
        'token': token,
        'username': username,
        'role': user['role'],
        'nombre': user['nombre'],
        'id_estudiante': user['id_estudiante'],
    })


@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('X-Auth-Token', '')
    active_sessions.pop(token, None)
    return jsonify({'ok': True})


# ─── DISCIPLINAS ──────────────────────────────────────────────────────────────

@app.route('/api/disciplinas', methods=['GET'])
@require_auth
def get_disciplinas():
    return jsonify(db_query("SELECT * FROM DISCIPLINA ORDER BY nombre"))


@app.route('/api/disciplinas', methods=['POST'])
@require_admin
def create_disciplina():
    d = request.json or {}
    if not d.get('nombre'):
        return jsonify({'error': 'nombre requerido'}), 400
    id_ = db_query("INSERT INTO DISCIPLINA (nombre) VALUES (%s)", (d['nombre'],), commit=True)
    return jsonify({'id_disciplina': id_, 'nombre': d['nombre']}), 201


@app.route('/api/disciplinas/<int:id_>', methods=['PUT'])
@require_admin
def update_disciplina(id_):
    d = request.json or {}
    db_query("UPDATE DISCIPLINA SET nombre=%s WHERE id_disciplina=%s", (d['nombre'], id_), commit=True)
    return jsonify({'ok': True})


@app.route('/api/disciplinas/<int:id_>', methods=['DELETE'])
@require_admin
def delete_disciplina(id_):
    try:
        db_query("DELETE FROM DISCIPLINA WHERE id_disciplina=%s", (id_,), commit=True)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── ESPACIOS ─────────────────────────────────────────────────────────────────

@app.route('/api/espacios', methods=['GET'])
@require_auth
def get_espacios():
    return jsonify(db_query("SELECT * FROM ESPACIO ORDER BY nombre"))


@app.route('/api/espacios', methods=['POST'])
@require_admin
def create_espacio():
    d = request.json or {}
    if not d.get('nombre'):
        return jsonify({'error': 'nombre requerido'}), 400
    id_ = db_query("INSERT INTO ESPACIO (nombre, descripcion) VALUES (%s, %s)",
                   (d['nombre'], d.get('descripcion', '')), commit=True)
    return jsonify({'id_espacio': id_}), 201


@app.route('/api/espacios/<int:id_>', methods=['PUT'])
@require_admin
def update_espacio(id_):
    d = request.json or {}
    db_query("UPDATE ESPACIO SET nombre=%s, descripcion=%s WHERE id_espacio=%s",
             (d['nombre'], d.get('descripcion', ''), id_), commit=True)
    return jsonify({'ok': True})


@app.route('/api/espacios/<int:id_>', methods=['DELETE'])
@require_admin
def delete_espacio(id_):
    try:
        db_query("DELETE FROM ESPACIO WHERE id_espacio=%s", (id_,), commit=True)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── FACULTADES / CARRERAS ────────────────────────────────────────────────────

@app.route('/api/facultades', methods=['GET'])
@require_auth
def get_facultades():
    return jsonify(db_query("SELECT * FROM FACULTAD ORDER BY nombre"))


@app.route('/api/carreras', methods=['GET'])
@require_auth
def get_carreras():
    sql = """SELECT c.*, f.nombre AS facultad_nombre
             FROM CARRERA c JOIN FACULTAD f ON c.id_facultad = f.id_facultad
             ORDER BY f.nombre, c.nombre"""
    return jsonify(db_query(sql))


# ─── ESTUDIANTES ──────────────────────────────────────────────────────────────

@app.route('/api/estudiantes', methods=['GET'])
@require_admin
def get_estudiantes():
    sql = """SELECT e.*, c.nombre AS carrera_nombre, f.nombre AS facultad_nombre
             FROM ESTUDIANTE e
             JOIN CARRERA c ON e.id_carrera = c.id_carrera
             JOIN FACULTAD f ON c.id_facultad = f.id_facultad
             ORDER BY e.apellido, e.nombre"""
    return jsonify(db_query(sql))


@app.route('/api/estudiantes/<int:id_>', methods=['GET'])
@require_auth
def get_estudiante(id_):
    # Estudiante solo puede ver su propio perfil
    if g.user['role'] == 'estudiante' and g.user['id_estudiante'] != id_:
        return jsonify({'error': 'Acceso denegado'}), 403
    sql = """SELECT e.*, c.nombre AS carrera_nombre, f.nombre AS facultad_nombre
             FROM ESTUDIANTE e
             JOIN CARRERA c ON e.id_carrera = c.id_carrera
             JOIN FACULTAD f ON c.id_facultad = f.id_facultad
             WHERE e.id_estudiante = %s"""
    return jsonify(db_query(sql, (id_,), fetchone=True))


@app.route('/api/estudiantes', methods=['POST'])
@require_admin
def create_estudiante():
    d = request.json or {}
    required = ['documento', 'nombre', 'apellido', 'correo_electronico', 'id_carrera']
    for field in required:
        if not d.get(field):
            return jsonify({'error': f'{field} requerido'}), 400
    if db_query("SELECT id_estudiante FROM ESTUDIANTE WHERE documento=%s", (d['documento'],), fetchone=True):
        return jsonify({'error': 'Ya existe un estudiante con ese documento'}), 400
    if db_query("SELECT id_estudiante FROM ESTUDIANTE WHERE correo_electronico=%s", (d['correo_electronico'],), fetchone=True):
        return jsonify({'error': 'Ya existe un estudiante con ese correo electronico'}), 400
    sql = """INSERT INTO ESTUDIANTE (documento, nombre, apellido, correo_electronico, id_carrera)
             VALUES (%s, %s, %s, %s, %s)"""
    id_ = db_query(sql, (d['documento'], d['nombre'], d['apellido'],
                         d['correo_electronico'], d['id_carrera']), commit=True)
    return jsonify({'id_estudiante': id_}), 201


@app.route('/api/estudiantes/<int:id_>', methods=['PUT'])
@require_auth
def update_estudiante(id_):
    # Estudiante solo puede editar su propio perfil
    if g.user['role'] == 'estudiante' and g.user['id_estudiante'] != id_:
        return jsonify({'error': 'Acceso denegado'}), 403
    d = request.json or {}
    # Validar unicidad excluyendo al propio registro
    if db_query("SELECT id_estudiante FROM ESTUDIANTE WHERE documento=%s AND id_estudiante!=%s",
                (d['documento'], id_), fetchone=True):
        return jsonify({'error': 'Ya existe un estudiante con ese documento'}), 400
    if db_query("SELECT id_estudiante FROM ESTUDIANTE WHERE correo_electronico=%s AND id_estudiante!=%s",
                (d['correo_electronico'], id_), fetchone=True):
        return jsonify({'error': 'Ya existe un estudiante con ese correo electronico'}), 400
    sql = """UPDATE ESTUDIANTE SET documento=%s, nombre=%s, apellido=%s,
             correo_electronico=%s, id_carrera=%s WHERE id_estudiante=%s"""
    db_query(sql, (d['documento'], d['nombre'], d['apellido'],
                   d['correo_electronico'], d['id_carrera'], id_), commit=True)
    return jsonify({'ok': True})


@app.route('/api/estudiantes/<int:id_>', methods=['DELETE'])
@require_admin
def delete_estudiante(id_):
    try:
        db_query("DELETE FROM ESTUDIANTE WHERE id_estudiante=%s", (id_,), commit=True)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── ACTIVIDADES ──────────────────────────────────────────────────────────────

@app.route('/api/actividades', methods=['GET'])
@require_auth
def get_actividades():
    sql = """SELECT a.*, d.nombre AS disciplina_nombre, e.nombre AS espacio_nombre,
             COUNT(CASE WHEN i.estado = 'confirmada' THEN 1 END) AS confirmados,
             COUNT(CASE WHEN i.estado = 'lista_espera' THEN 1 END) AS en_espera
             FROM ACTIVIDAD a
             JOIN DISCIPLINA d ON a.id_disciplina = d.id_disciplina
             JOIN ESPACIO e ON a.id_espacio = e.id_espacio
             LEFT JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad
             GROUP BY a.id_actividad
             ORDER BY a.nombre"""
    return jsonify(db_query(sql))


@app.route('/api/actividades/<int:id_>', methods=['GET'])
@require_auth
def get_actividad(id_):
    sql = """SELECT a.*, d.nombre AS disciplina_nombre, e.nombre AS espacio_nombre
             FROM ACTIVIDAD a
             JOIN DISCIPLINA d ON a.id_disciplina = d.id_disciplina
             JOIN ESPACIO e ON a.id_espacio = e.id_espacio
             WHERE a.id_actividad = %s"""
    return jsonify(db_query(sql, (id_,), fetchone=True))


@app.route('/api/actividades', methods=['POST'])
@require_admin
def create_actividad():
    d = request.json or {}
    sql = """INSERT INTO ACTIVIDAD (nombre, id_disciplina, id_espacio, cupo_maximo, dia, horario, estado)
             VALUES (%s, %s, %s, %s, %s, %s, %s)"""
    id_ = db_query(sql, (d['nombre'], d['id_disciplina'], d['id_espacio'],
                         d['cupo_maximo'], d['dia'], d['horario'],
                         d.get('estado', 'abierta')), commit=True)
    return jsonify({'id_actividad': id_}), 201


@app.route('/api/actividades/<int:id_>', methods=['PUT'])
@require_admin
def update_actividad(id_):
    d = request.json or {}
    sql = """UPDATE ACTIVIDAD SET nombre=%s, id_disciplina=%s, id_espacio=%s,
             cupo_maximo=%s, dia=%s, horario=%s, estado=%s WHERE id_actividad=%s"""
    db_query(sql, (d['nombre'], d['id_disciplina'], d['id_espacio'],
                   d['cupo_maximo'], d['dia'], d['horario'], d['estado'], id_), commit=True)
    return jsonify({'ok': True})


@app.route('/api/actividades/<int:id_>', methods=['DELETE'])
@require_admin
def delete_actividad(id_):
    try:
        db_query("DELETE FROM ACTIVIDAD WHERE id_actividad=%s", (id_,), commit=True)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── INSCRIPCIONES ────────────────────────────────────────────────────────────

@app.route('/api/inscripciones', methods=['GET'])
@require_auth
def get_inscripciones():
    id_estudiante = request.args.get('id_estudiante')
    id_actividad = request.args.get('id_actividad')
    # Estudiante solo puede ver sus propias inscripciones (se fuerza el filtro)
    if g.user['role'] == 'estudiante':
        id_estudiante = str(g.user['id_estudiante'])
    sql = """SELECT i.*, e.nombre AS est_nombre, e.apellido AS est_apellido,
             e.documento, a.nombre AS actividad_nombre, a.id_actividad
             FROM INSCRIPCION i
             JOIN ESTUDIANTE e ON i.id_estudiante = e.id_estudiante
             JOIN ACTIVIDAD a ON i.id_actividad = a.id_actividad
             WHERE 1=1"""
    params = []
    if id_estudiante:
        sql += " AND i.id_estudiante = %s"
        params.append(id_estudiante)
    if id_actividad:
        sql += " AND i.id_actividad = %s"
        params.append(id_actividad)
    sql += " ORDER BY i.fecha_inscripcion DESC"
    return jsonify(db_query(sql, params))


@app.route('/api/inscripciones', methods=['POST'])
@require_auth
def create_inscripcion():
    d = request.json or {}
    id_est = d.get('id_estudiante')
    id_act = d.get('id_actividad')
    # Estudiante solo puede inscribirse a si mismo
    if g.user['role'] == 'estudiante' and str(id_est) != str(g.user['id_estudiante']):
        return jsonify({'error': 'Solo puede inscribirse a si mismo'}), 403
    actividad = db_query("SELECT * FROM ACTIVIDAD WHERE id_actividad=%s", (id_act,), fetchone=True)
    if not actividad:
        return jsonify({'error': 'Actividad no encontrada'}), 404
    if actividad['estado'] != 'abierta':
        return jsonify({'error': 'Solo se puede inscribir en actividades abiertas'}), 400
    dup = db_query("SELECT id_inscripcion FROM INSCRIPCION WHERE id_estudiante=%s AND id_actividad=%s",
                   (id_est, id_act), fetchone=True)
    if dup:
        return jsonify({'error': 'Ya esta inscripto en esta actividad'}), 400
    confirmados = db_query("""SELECT COUNT(*) AS c FROM INSCRIPCION
                               WHERE id_actividad=%s AND estado='confirmada'""",
                           (id_act,), fetchone=True)
    estado = 'confirmada' if confirmados['c'] < actividad['cupo_maximo'] else 'lista_espera'
    sql = """INSERT INTO INSCRIPCION (id_estudiante, id_actividad, fecha_inscripcion, estado)
             VALUES (%s, %s, CURDATE(), %s)"""
    id_ = db_query(sql, (id_est, id_act, estado), commit=True)
    return jsonify({'id_inscripcion': id_, 'estado': estado}), 201


@app.route('/api/inscripciones/<int:id_>', methods=['DELETE'])
@require_auth
def delete_inscripcion(id_):
    # Estudiante solo puede cancelar sus propias inscripciones
    if g.user['role'] == 'estudiante':
        insc = db_query("SELECT id_estudiante FROM INSCRIPCION WHERE id_inscripcion=%s",
                        (id_,), fetchone=True)
        if not insc or insc['id_estudiante'] != g.user['id_estudiante']:
            return jsonify({'error': 'No autorizado para cancelar esta inscripcion'}), 403
    try:
        db_query("DELETE FROM INSCRIPCION WHERE id_inscripcion=%s", (id_,), commit=True)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ─── ASISTENCIAS ──────────────────────────────────────────────────────────────

@app.route('/api/asistencias', methods=['GET'])
@require_admin
def get_asistencias():
    id_actividad = request.args.get('id_actividad')
    fecha = request.args.get('fecha')
    sql = """SELECT ast.*, e.nombre AS est_nombre, e.apellido AS est_apellido,
             e.documento, a.nombre AS actividad_nombre
             FROM ASISTENCIA ast
             JOIN INSCRIPCION i ON ast.id_inscripcion = i.id_inscripcion
             JOIN ESTUDIANTE e ON i.id_estudiante = e.id_estudiante
             JOIN ACTIVIDAD a ON i.id_actividad = a.id_actividad
             WHERE 1=1"""
    params = []
    if id_actividad:
        sql += " AND i.id_actividad = %s"
        params.append(id_actividad)
    if fecha:
        sql += " AND ast.fecha = %s"
        params.append(fecha)
    sql += " ORDER BY ast.fecha DESC, e.apellido"
    return jsonify(db_query(sql, params))


@app.route('/api/asistencias', methods=['POST'])
@require_admin
def registrar_asistencia():
    d = request.json or {}
    id_inscripcion = d.get('id_inscripcion')
    fecha = d.get('fecha')
    asistio = d.get('asistio', False)
    insc = db_query("SELECT estado FROM INSCRIPCION WHERE id_inscripcion=%s",
                    (id_inscripcion,), fetchone=True)
    if not insc:
        return jsonify({'error': 'Inscripcion no encontrada'}), 404
    if insc['estado'] != 'confirmada':
        return jsonify({'error': 'Solo se puede registrar asistencia de inscripciones confirmadas'}), 400
    sql = """INSERT INTO ASISTENCIA (id_inscripcion, fecha, asistio)
             VALUES (%s, %s, %s)
             ON DUPLICATE KEY UPDATE asistio = %s"""
    db_query(sql, (id_inscripcion, fecha, asistio, asistio), commit=True)
    return jsonify({'ok': True})


# ─── REPORTES ─────────────────────────────────────────────────────────────────

@app.route('/api/reportes/inscriptos-por-actividad', methods=['GET'])
@require_admin
def reporte_inscriptos_actividad():
    sql = """SELECT a.nombre AS actividad, COUNT(i.id_inscripcion) AS total_confirmados
             FROM ACTIVIDAD a
             LEFT JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad AND i.estado = 'confirmada'
             GROUP BY a.id_actividad, a.nombre
             ORDER BY total_confirmados DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/cupos-disponibles', methods=['GET'])
@require_admin
def reporte_cupos():
    sql = """SELECT a.nombre AS actividad, a.cupo_maximo,
             COUNT(i.id_inscripcion) AS confirmados,
             a.cupo_maximo - COUNT(i.id_inscripcion) AS lugares_disponibles
             FROM ACTIVIDAD a
             LEFT JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad AND i.estado = 'confirmada'
             WHERE a.estado = 'abierta'
             GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
             HAVING COUNT(i.id_inscripcion) < a.cupo_maximo
             ORDER BY lugares_disponibles DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/inscriptos-por-disciplina', methods=['GET'])
@require_admin
def reporte_disciplina():
    sql = """SELECT d.nombre AS disciplina, COUNT(DISTINCT i.id_estudiante) AS estudiantes
             FROM DISCIPLINA d
             JOIN ACTIVIDAD a ON d.id_disciplina = a.id_disciplina
             JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad
             WHERE i.estado = 'confirmada'
             GROUP BY d.id_disciplina, d.nombre
             ORDER BY estudiantes DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/inscriptos-por-carrera', methods=['GET'])
@require_admin
def reporte_carrera():
    sql = """SELECT f.nombre AS facultad, c.nombre AS carrera,
             COUNT(DISTINCT e.id_estudiante) AS estudiantes
             FROM FACULTAD f
             JOIN CARRERA c ON f.id_facultad = c.id_facultad
             JOIN ESTUDIANTE e ON c.id_carrera = e.id_carrera
             JOIN INSCRIPCION i ON e.id_estudiante = i.id_estudiante
             WHERE i.estado = 'confirmada'
             GROUP BY f.id_facultad, f.nombre, c.id_carrera, c.nombre
             ORDER BY f.nombre, estudiantes DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/ocupacion', methods=['GET'])
@require_admin
def reporte_ocupacion():
    sql = """SELECT a.nombre AS actividad, a.cupo_maximo,
             COUNT(i.id_inscripcion) AS confirmados,
             ROUND((COUNT(i.id_inscripcion) / a.cupo_maximo) * 100, 2) AS porcentaje_ocupacion
             FROM ACTIVIDAD a
             LEFT JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad AND i.estado = 'confirmada'
             GROUP BY a.id_actividad, a.nombre, a.cupo_maximo
             ORDER BY porcentaje_ocupacion DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/asistencia-por-actividad', methods=['GET'])
@require_admin
def reporte_asistencia_actividad():
    sql = """SELECT a.nombre AS actividad,
             COUNT(ast.id_asistencia) AS total_registros,
             SUM(ast.asistio) AS presentes,
             ROUND((SUM(ast.asistio) / COUNT(ast.id_asistencia)) * 100, 2) AS porcentaje_asistencia
             FROM ACTIVIDAD a
             JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad
             JOIN ASISTENCIA ast ON i.id_inscripcion = ast.id_inscripcion
             GROUP BY a.id_actividad, a.nombre
             ORDER BY porcentaje_asistencia DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/inasistencias', methods=['GET'])
@require_admin
def reporte_inasistencias():
    sql = """SELECT e.nombre, e.apellido, e.documento,
             COUNT(ast.id_asistencia) AS inasistencias
             FROM ESTUDIANTE e
             JOIN INSCRIPCION i ON e.id_estudiante = i.id_estudiante
             JOIN ASISTENCIA ast ON i.id_inscripcion = ast.id_inscripcion
             WHERE ast.asistio = FALSE
             GROUP BY e.id_estudiante, e.nombre, e.apellido, e.documento
             HAVING COUNT(ast.id_asistencia) >= 3
             ORDER BY inasistencias DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/lista-espera', methods=['GET'])
@require_admin
def reporte_lista_espera():
    sql = """SELECT a.nombre AS actividad, COUNT(i.id_inscripcion) AS en_espera
             FROM ACTIVIDAD a
             JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad
             WHERE i.estado = 'lista_espera'
             GROUP BY a.id_actividad, a.nombre
             HAVING COUNT(i.id_inscripcion) >= 1
             ORDER BY en_espera DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/asistencia-por-disciplina', methods=['GET'])
@require_admin
def reporte_asistencia_disciplina():
    sql = """SELECT d.nombre AS disciplina,
             COUNT(ast.id_asistencia) AS total_registros,
             SUM(ast.asistio) AS presentes,
             ROUND((SUM(ast.asistio) / COUNT(ast.id_asistencia)) * 100, 2) AS porcentaje_asistencia
             FROM DISCIPLINA d
             JOIN ACTIVIDAD a ON d.id_disciplina = a.id_disciplina
             JOIN INSCRIPCION i ON a.id_actividad = i.id_actividad
             JOIN ASISTENCIA ast ON i.id_inscripcion = ast.id_inscripcion
             GROUP BY d.id_disciplina, d.nombre
             ORDER BY porcentaje_asistencia DESC"""
    return jsonify(db_query(sql))


@app.route('/api/reportes/multiples-actividades', methods=['GET'])
@require_admin
def reporte_multiples_actividades():
    sql = """SELECT e.nombre, e.apellido, COUNT(DISTINCT i.id_actividad) AS actividades
             FROM ESTUDIANTE e
             JOIN INSCRIPCION i ON e.id_estudiante = i.id_estudiante
             WHERE i.estado = 'confirmada'
             GROUP BY e.id_estudiante, e.nombre, e.apellido
             HAVING COUNT(DISTINCT i.id_actividad) >= 2
             ORDER BY actividades DESC"""
    return jsonify(db_query(sql))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
