-- ============================================================
-- BASE DE DATOS: Sistema de Gestión de Actividades Deportivas
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS deportes_uni CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE deportes_uni;

-- ─── TABLAS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS FACULTAD (
    id_facultad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS CARRERA (
    id_carrera INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_facultad INT NOT NULL,
    FOREIGN KEY (id_facultad) REFERENCES FACULTAD(id_facultad)
);

CREATE TABLE IF NOT EXISTS ESTUDIANTE (
    id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
    documento VARCHAR(8) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    id_carrera INT NOT NULL,
    FOREIGN KEY (id_carrera) REFERENCES CARRERA(id_carrera)
);

CREATE TABLE IF NOT EXISTS DISCIPLINA (
    id_disciplina INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS ESPACIO (
    id_espacio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ACTIVIDAD (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_disciplina INT NOT NULL,
    id_espacio INT NOT NULL,
    cupo_maximo INT NOT NULL,
    dia VARCHAR(20) NOT NULL,
    horario TIME NOT NULL,
    estado ENUM('abierta', 'cerrada', 'finalizada', 'cancelada') NOT NULL DEFAULT 'abierta',
    FOREIGN KEY (id_disciplina) REFERENCES DISCIPLINA(id_disciplina),
    FOREIGN KEY (id_espacio) REFERENCES ESPACIO(id_espacio)
);

CREATE TABLE IF NOT EXISTS INSCRIPCION (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_actividad INT NOT NULL,
    fecha_inscripcion DATE NOT NULL DEFAULT (CURRENT_DATE),
    estado ENUM('confirmada', 'lista_espera') NOT NULL,
    UNIQUE (id_estudiante, id_actividad),
    FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante),
    FOREIGN KEY (id_actividad) REFERENCES ACTIVIDAD(id_actividad)
);

CREATE TABLE IF NOT EXISTS ASISTENCIA (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    id_inscripcion INT NOT NULL,
    fecha DATE NOT NULL,
    asistio BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_inscripcion, fecha),
    FOREIGN KEY (id_inscripcion) REFERENCES INSCRIPCION(id_inscripcion)
);

CREATE TABLE IF NOT EXISTS USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(64) NOT NULL,
    role ENUM('admin', 'estudiante') NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    id_estudiante INT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante)
);

-- ─── DATOS MAESTROS ───────────────────────────────────────────────────────────

INSERT INTO FACULTAD (nombre) VALUES
('Facultad de Ingeniería'),
('Facultad de Medicina'),
('Facultad de Derecho'),
('Facultad de Ciencias Económicas'),
('Facultad de Arquitectura'),
('Facultad de Comunicación'),
('Facultad de Arte');

INSERT INTO CARRERA (nombre, id_facultad) VALUES
('Ingeniería en Computación', 1),
('Ingeniería Eléctrica', 1),
('Ingeniería Civil', 1),
('Medicina', 2),
('Nutrición', 2),
('Abogacía', 3),
('Notariado', 3),
('Contador Público', 4),
('Licenciatura en Administración', 4),
('Economía', 4),
('Arquitectura', 5),
('Comunicación Social', 6),
('Periodismo', 6),
('Artes Visuales', 7),
('Diseño Escénico', 7);

INSERT INTO ESTUDIANTE (documento, nombre, apellido, correo_electronico, id_carrera) VALUES
('12345678', 'Peter',   'Parker',   'pparker@estudiante.edu.uy',   1),
('23456789', 'Bruce',   'Wayne',    'bwayne@estudiante.edu.uy',    11),
('34567890', 'Clark',   'Kent',     'ckent@estudiante.edu.uy',     13),
('45678901', 'Diana',   'Prince',   'dprince@estudiante.edu.uy',   6),
('56789012', 'Barry',   'Allen',    'ballen@estudiante.edu.uy',    1),
('67890123', 'Hal',     'Jordan',   'hjordan@estudiante.edu.uy',   2),
('78901234', 'Natasha', 'Romanoff', 'nromanoff@estudiante.edu.uy', 5),
('89012345', 'Matthew', 'Murdock',  'mmurdock@estudiante.edu.uy',  6),
('90123456', 'Wanda',   'Maximoff', 'wmaximoff@estudiante.edu.uy', 14),
('01234567', 'Logan',   'Howlett',  'lhowlett@estudiante.edu.uy',  3),
('11223344', 'Jean',    'Grey',     'jgrey@estudiante.edu.uy',     9),
('22334455', 'Scott',   'Summers',  'ssummers@estudiante.edu.uy',  10),
('33445566', 'Barbara', 'Gordon',   'bgordon@estudiante.edu.uy',   1),
('44556677', 'Richard', 'Grayson',  'rgrayson@estudiante.edu.uy',  12),
('55667788', 'Selina',  'Kyle',     'skyle@estudiante.edu.uy',     10),
('66778899', 'Victor',  'Stone',    'vstone@estudiante.edu.uy',    2),
('77889900', 'Raven',   'Roth',     'rroth@estudiante.edu.uy',     15),
('88990011', 'Miles',   'Morales',  'mmorales@estudiante.edu.uy',  1),
('99001122', 'Gwen',    'Stacy',    'gstacy@estudiante.edu.uy',    12),
('10203040', 'Frank',   'Castle',   'fcastle@estudiante.edu.uy',   6);

INSERT INTO DISCIPLINA (nombre) VALUES
('Fútbol'), ('Básquetbol'), ('Atletismo'), ('Vóleibol'), ('Yoga'), ('Funcional'), ('Gimnasio');

INSERT INTO ESPACIO (nombre, descripcion) VALUES
('Cancha de Fútbol A',   'Cancha de césped sintético, capacidad 22 jugadores'),
('Cancha de Fútbol B',   'Cancha de tierra, iluminación nocturna'),
('Gimnasio Principal',   'Gimnasio cubierto con capacidad para 200 personas'),
('Cancha de Básquetbol', 'Cancha interior con tableros reglamentarios'),
('Pista de Atletismo',   'Pista de 400 metros con 6 carriles'),
('Salón Multiuso A',     'Salón cubierto para actividades grupales'),
('Salón Multiuso B',     'Salón cubierto con espejos y piso flotante'),
('Cancha de Vóleibol',   'Cancha interior con red reglamentaria'),
('Sala de Musculación',  'Sala equipada con máquinas y pesas libres');

INSERT INTO ACTIVIDAD (nombre, id_disciplina, id_espacio, cupo_maximo, dia, horario, estado) VALUES
('Fútbol recreativo mixto',    1, 1, 20, 'Lunes',     '18:00:00', 'abierta'),
('Fútbol competitivo varones', 1, 2, 16, 'Miércoles', '19:00:00', 'abierta'),
('Fútbol damas',               1, 1, 16, 'Viernes',   '17:00:00', 'cerrada'),
('Básquetbol inicial',         2, 4, 15, 'Martes',    '17:00:00', 'abierta'),
('Básquetbol avanzado',        2, 4, 12, 'Jueves',    '19:00:00', 'abierta'),
('Atletismo inicial',          3, 5, 25, 'Lunes',     '07:00:00', 'abierta'),
('Atletismo avanzado',         3, 5, 20, 'Miércoles', '07:00:00', 'abierta'),
('Vóleibol recreativo',        4, 8, 18, 'Martes',    '18:00:00', 'abierta'),
('Vóleibol mixto',             4, 8, 18, 'Jueves',    '18:00:00', 'finalizada'),
('Yoga turno mañana',          5, 6, 20, 'Lunes',     '08:00:00', 'abierta'),
('Yoga turno tarde',           5, 7, 20, 'Miércoles', '17:00:00', 'abierta'),
('Funcional turno mañana',     6, 6, 15, 'Martes',    '07:30:00', 'abierta'),
('Funcional turno tarde',      6, 7, 15, 'Jueves',    '17:30:00', 'abierta'),
('Gimnasio turno mañana',      7, 9, 30, 'Lunes',     '07:00:00', 'abierta'),
('Gimnasio turno tarde',       7, 9, 30, 'Lunes',     '17:00:00', 'cancelada');

INSERT INTO INSCRIPCION (id_estudiante, id_actividad, fecha_inscripcion, estado) VALUES
(1,  1,  '2025-03-01', 'confirmada'),
(2,  1,  '2025-03-01', 'confirmada'),
(3,  1,  '2025-03-02', 'confirmada'),
(4,  1,  '2025-03-02', 'confirmada'),
(5,  1,  '2025-03-03', 'confirmada'),
(6,  4,  '2025-03-01', 'confirmada'),
(7,  4,  '2025-03-01', 'confirmada'),
(8,  4,  '2025-03-02', 'confirmada'),
(9,  4,  '2025-03-02', 'confirmada'),
(10, 4,  '2025-03-03', 'confirmada'),
(1,  6,  '2025-03-01', 'confirmada'),
(11, 6,  '2025-03-01', 'confirmada'),
(12, 6,  '2025-03-02', 'confirmada'),
(13, 6,  '2025-03-03', 'confirmada'),
(14, 6,  '2025-03-03', 'confirmada'),
(15, 6,  '2025-03-04', 'confirmada'),
(16, 10, '2025-03-01', 'confirmada'),
(17, 10, '2025-03-01', 'confirmada'),
(18, 10, '2025-03-02', 'confirmada'),
(19, 10, '2025-03-02', 'confirmada'),
(20, 10, '2025-03-03', 'confirmada'),
(1,  10, '2025-03-03', 'confirmada'),
(2,  12, '2025-03-01', 'confirmada'),
(3,  12, '2025-03-01', 'confirmada'),
(4,  12, '2025-03-02', 'confirmada'),
(5,  12, '2025-03-02', 'confirmada'),
(6,  12, '2025-03-03', 'confirmada'),
(7,  14, '2025-03-01', 'confirmada'),
(8,  14, '2025-03-01', 'confirmada'),
(9,  14, '2025-03-02', 'confirmada'),
(10, 14, '2025-03-02', 'confirmada'),
(11, 14, '2025-03-03', 'confirmada'),
(12, 14, '2025-03-03', 'confirmada'),
(13, 1,  '2025-03-10', 'lista_espera'),
(14, 1,  '2025-03-10', 'lista_espera');

INSERT INTO ASISTENCIA (id_inscripcion, fecha, asistio) VALUES
(1, '2025-03-03', TRUE),  (2, '2025-03-03', TRUE),  (3, '2025-03-03', FALSE),
(4, '2025-03-03', TRUE),  (5, '2025-03-03', FALSE),
(1, '2025-03-10', TRUE),  (2, '2025-03-10', FALSE), (3, '2025-03-10', FALSE),
(4, '2025-03-10', TRUE),  (5, '2025-03-10', TRUE),
(1, '2025-03-17', FALSE), (2, '2025-03-17', TRUE),  (3, '2025-03-17', FALSE),
(4, '2025-03-17', FALSE), (5, '2025-03-17', TRUE),
(11, '2025-03-03', TRUE),  (12, '2025-03-03', TRUE),  (13, '2025-03-03', FALSE),
(14, '2025-03-03', TRUE),  (15, '2025-03-03', FALSE), (16, '2025-03-03', TRUE),
(11, '2025-03-10', FALSE), (12, '2025-03-10', TRUE),  (13, '2025-03-10', FALSE),
(14, '2025-03-10', FALSE), (15, '2025-03-10', TRUE),  (16, '2025-03-10', FALSE),
(11, '2025-03-17', FALSE), (12, '2025-03-17', FALSE), (13, '2025-03-17', TRUE),
(14, '2025-03-17', FALSE), (15, '2025-03-17', TRUE),  (16, '2025-03-17', TRUE),
(17, '2025-03-03', TRUE),  (18, '2025-03-03', TRUE),  (19, '2025-03-03', TRUE),
(20, '2025-03-03', FALSE), (21, '2025-03-03', TRUE),  (22, '2025-03-03', FALSE),
(17, '2025-03-10', TRUE),  (18, '2025-03-10', FALSE), (19, '2025-03-10', TRUE),
(20, '2025-03-10', FALSE), (21, '2025-03-10', FALSE), (22, '2025-03-10', TRUE);

INSERT IGNORE INTO USUARIO (username, password_hash, role, nombre, id_estudiante) VALUES
('admin',   SHA2('admin123',  256), 'admin',      'Administrador', NULL),
('pparker', SHA2('spiderman', 256), 'estudiante', 'Peter Parker',  1);
