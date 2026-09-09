--
-- PostgreSQL database dump
--

\restrict OHJktFjlUmECoUuFuTSvmwtHr1MKKiHDmpd6yhOp7F0BhHZRZtu2Absw9XLfGvx

-- Dumped from database version 14.3 (Debian 14.3-1.pgdg110+1)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: aprendiz
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO aprendiz;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accion_historial_movimiento; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.accion_historial_movimiento (
    id_accion_historial_movimiento uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(255) NOT NULL
);


ALTER TABLE public.accion_historial_movimiento OWNER TO aprendiz;

--
-- Name: alimentacion; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.alimentacion (
    id_alimentacion uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidad numeric NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    "usuarioIdUsuario" uuid,
    "loteIdLote" uuid,
    "insumoIdInsumo" uuid
);


ALTER TABLE public.alimentacion OWNER TO aprendiz;

--
-- Name: aves_fallecidas; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.aves_fallecidas (
    id_aves_fallecidas uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidad integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    id_lote uuid
);


ALTER TABLE public.aves_fallecidas OWNER TO aprendiz;

--
-- Name: categoria_insumo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.categoria_insumo (
    id_categoria_insumo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre_categoria character varying(255) NOT NULL
);


ALTER TABLE public.categoria_insumo OWNER TO aprendiz;

--
-- Name: estado_lote; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.estado_lote (
    id_estado_lote uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    estado character varying NOT NULL,
    id_lote uuid
);


ALTER TABLE public.estado_lote OWNER TO aprendiz;

--
-- Name: finalizacion_lote; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.finalizacion_lote (
    id_finalizacion_lote uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidad integer NOT NULL,
    razon character varying NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    id_lote uuid
);


ALTER TABLE public.finalizacion_lote OWNER TO aprendiz;

--
-- Name: galpon; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.galpon (
    id_galpon uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    codigo character varying NOT NULL,
    nombre character varying NOT NULL,
    capacidad_max_aves integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    area numeric NOT NULL,
    id_unidad_medida uuid
);


ALTER TABLE public.galpon OWNER TO aprendiz;

--
-- Name: historial_asignacion_lote; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.historial_asignacion_lote (
    id_historial_asignacion_lote uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidad_asignada integer NOT NULL,
    id_lote uuid,
    id_galpon uuid,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    descripcion character varying(255) DEFAULT ''::character varying NOT NULL,
    usuario character varying(255) DEFAULT 'Sistema'::character varying NOT NULL,
    nombre_elemento character varying(255) DEFAULT ''::character varying NOT NULL,
    raza_nombre character varying(255)
);


ALTER TABLE public.historial_asignacion_lote OWNER TO aprendiz;

--
-- Name: historial_huevo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.historial_huevo (
    id_historial_huevo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "usuarioId" character varying,
    cantidad integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    "inventarioIdInventarioHuevo" uuid,
    "produccionIdProduccionHuevo" uuid,
    tipo_movimiento character varying DEFAULT 'Nuevo Registro'::character varying,
    cantidad_anterior integer
);


ALTER TABLE public.historial_huevo OWNER TO aprendiz;

--
-- Name: historial_insumo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.historial_insumo (
    id_historial_insumo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    id_insumos uuid NOT NULL,
    id_historial_accion uuid NOT NULL,
    cantidad double precision NOT NULL,
    descripcion character varying(255) NOT NULL,
    fecha timestamp without time zone NOT NULL,
    usuario character varying(255) DEFAULT 'Sistema'::character varying NOT NULL
);


ALTER TABLE public.historial_insumo OWNER TO aprendiz;

--
-- Name: huevo_dañado; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public."huevo_dañado" (
    "id_huevo_dañado" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidad integer NOT NULL,
    razon character varying NOT NULL,
    "registeredAt" timestamp without time zone DEFAULT now() NOT NULL,
    "inventarioIdInventarioHuevo" uuid
);


ALTER TABLE public."huevo_dañado" OWNER TO aprendiz;

--
-- Name: insumo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.insumo (
    id_insumo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    id_categoria uuid NOT NULL,
    id_unidad_medida uuid NOT NULL,
    id_llamar_usuario integer NOT NULL,
    nombre character varying(255) NOT NULL,
    cantidad integer NOT NULL,
    fecha timestamp without time zone NOT NULL,
    stock_minimo integer DEFAULT 0 NOT NULL,
    proveedor character varying(255),
    precio_unitario numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    fecha_eliminacion timestamp without time zone
);


ALTER TABLE public.insumo OWNER TO aprendiz;

--
-- Name: inventario_huevo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.inventario_huevo (
    id_inventario_huevo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidad integer NOT NULL,
    tipo_huevo_id uuid,
    "loteIdLote" uuid,
    "produccionIdProduccionHuevo" uuid,
    fecha_eliminacion timestamp without time zone
);


ALTER TABLE public.inventario_huevo OWNER TO aprendiz;

--
-- Name: llamar_usuario; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.llamar_usuario (
    id_llamar_usuario integer NOT NULL,
    id_usuario uuid NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL,
    fecha_modificacion timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.llamar_usuario OWNER TO aprendiz;

--
-- Name: llamar_usuario_id_llamar_usuario_seq; Type: SEQUENCE; Schema: public; Owner: aprendiz
--

CREATE SEQUENCE public.llamar_usuario_id_llamar_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llamar_usuario_id_llamar_usuario_seq OWNER TO aprendiz;

--
-- Name: llamar_usuario_id_llamar_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aprendiz
--

ALTER SEQUENCE public.llamar_usuario_id_llamar_usuario_seq OWNED BY public.llamar_usuario.id_llamar_usuario;


--
-- Name: lote; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.lote (
    id_lote uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying NOT NULL,
    total_aves integer NOT NULL,
    observacion character varying NOT NULL,
    racion_alimento character varying NOT NULL,
    estado character varying NOT NULL,
    id_raza uuid,
    fecha_eliminacion timestamp without time zone
);


ALTER TABLE public.lote OWNER TO aprendiz;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO aprendiz;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: aprendiz
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO aprendiz;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aprendiz
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: permiso; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.permiso (
    id_permiso integer NOT NULL,
    codigo integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion character varying(255) NOT NULL
);


ALTER TABLE public.permiso OWNER TO aprendiz;

--
-- Name: permiso_id_permiso_seq; Type: SEQUENCE; Schema: public; Owner: aprendiz
--

CREATE SEQUENCE public.permiso_id_permiso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permiso_id_permiso_seq OWNER TO aprendiz;

--
-- Name: permiso_id_permiso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aprendiz
--

ALTER SEQUENCE public.permiso_id_permiso_seq OWNED BY public.permiso.id_permiso;


--
-- Name: produccion_huevo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.produccion_huevo (
    id_produccion_huevo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cantidady integer NOT NULL,
    "produccionFecha" timestamp without time zone DEFAULT now() NOT NULL,
    "loteIdLote" uuid,
    "tipo_huevoId" uuid NOT NULL
);


ALTER TABLE public.produccion_huevo OWNER TO aprendiz;

--
-- Name: raza; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.raza (
    id_raza uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion character varying(255) NOT NULL
);


ALTER TABLE public.raza OWNER TO aprendiz;

--
-- Name: reporte; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.reporte (
    id_reporte uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo_reporte character varying NOT NULL,
    id_usuario uuid
);


ALTER TABLE public.reporte OWNER TO aprendiz;

--
-- Name: rol; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.rol (
    id_rol integer NOT NULL,
    nombre character varying(255) NOT NULL
);


ALTER TABLE public.rol OWNER TO aprendiz;

--
-- Name: rol_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: aprendiz
--

CREATE SEQUENCE public.rol_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rol_id_rol_seq OWNER TO aprendiz;

--
-- Name: rol_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aprendiz
--

ALTER SEQUENCE public.rol_id_rol_seq OWNED BY public.rol.id_rol;


--
-- Name: rol_permiso; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.rol_permiso (
    id_rol_permiso integer NOT NULL,
    id_permiso integer NOT NULL,
    id_rol integer NOT NULL
);


ALTER TABLE public.rol_permiso OWNER TO aprendiz;

--
-- Name: rol_permiso_id_rol_permiso_seq; Type: SEQUENCE; Schema: public; Owner: aprendiz
--

CREATE SEQUENCE public.rol_permiso_id_rol_permiso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rol_permiso_id_rol_permiso_seq OWNER TO aprendiz;

--
-- Name: rol_permiso_id_rol_permiso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aprendiz
--

ALTER SEQUENCE public.rol_permiso_id_rol_permiso_seq OWNED BY public.rol_permiso.id_rol_permiso;


--
-- Name: tipo_huevo; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.tipo_huevo (
    id_tipo uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo character varying(255) NOT NULL,
    peso_min numeric(10,2),
    peso_max numeric(10,2)
);


ALTER TABLE public.tipo_huevo OWNER TO aprendiz;

--
-- Name: ubicacion_lote; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.ubicacion_lote (
    id_ubicacion_lote uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "Fecha" timestamp without time zone DEFAULT now() NOT NULL,
    id_lote uuid,
    id_galpon uuid
);


ALTER TABLE public.ubicacion_lote OWNER TO aprendiz;

--
-- Name: unidad_medida; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.unidad_medida (
    id_unidad_medida uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(255) NOT NULL,
    abreviatura character varying(255) NOT NULL
);


ALTER TABLE public.unidad_medida OWNER TO aprendiz;

--
-- Name: usuario; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.usuario (
    id_usuario uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(255) NOT NULL,
    apellido character varying(255) NOT NULL,
    documento character varying(255) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL,
    ultimo_acceso timestamp without time zone DEFAULT now() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(300) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    fecha_eliminacion timestamp without time zone
);


ALTER TABLE public.usuario OWNER TO aprendiz;

--
-- Name: usuario_rol; Type: TABLE; Schema: public; Owner: aprendiz
--

CREATE TABLE public.usuario_rol (
    id_usuario_rol integer NOT NULL,
    id_usuario uuid NOT NULL,
    id_rol integer NOT NULL
);


ALTER TABLE public.usuario_rol OWNER TO aprendiz;

--
-- Name: usuario_rol_id_usuario_rol_seq; Type: SEQUENCE; Schema: public; Owner: aprendiz
--

CREATE SEQUENCE public.usuario_rol_id_usuario_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_rol_id_usuario_rol_seq OWNER TO aprendiz;

--
-- Name: usuario_rol_id_usuario_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aprendiz
--

ALTER SEQUENCE public.usuario_rol_id_usuario_rol_seq OWNED BY public.usuario_rol.id_usuario_rol;


--
-- Name: llamar_usuario id_llamar_usuario; Type: DEFAULT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.llamar_usuario ALTER COLUMN id_llamar_usuario SET DEFAULT nextval('public.llamar_usuario_id_llamar_usuario_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: permiso id_permiso; Type: DEFAULT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.permiso ALTER COLUMN id_permiso SET DEFAULT nextval('public.permiso_id_permiso_seq'::regclass);


--
-- Name: rol id_rol; Type: DEFAULT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.rol ALTER COLUMN id_rol SET DEFAULT nextval('public.rol_id_rol_seq'::regclass);


--
-- Name: rol_permiso id_rol_permiso; Type: DEFAULT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.rol_permiso ALTER COLUMN id_rol_permiso SET DEFAULT nextval('public.rol_permiso_id_rol_permiso_seq'::regclass);


--
-- Name: usuario_rol id_usuario_rol; Type: DEFAULT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.usuario_rol ALTER COLUMN id_usuario_rol SET DEFAULT nextval('public.usuario_rol_id_usuario_rol_seq'::regclass);


--
-- Data for Name: accion_historial_movimiento; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.accion_historial_movimiento (id_accion_historial_movimiento, nombre) FROM stdin;
d487a20c-68f0-4eca-8bfe-8e2bf2572e90	AJUSTE
e8ad5740-4787-4885-9890-d57f1ded1a86	ENTRADA
070fff7c-3ed7-45bc-9179-5e6ae6204e73	SALIDA
\.


--
-- Data for Name: alimentacion; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.alimentacion (id_alimentacion, cantidad, fecha, "usuarioIdUsuario", "loteIdLote", "insumoIdInsumo") FROM stdin;
\.


--
-- Data for Name: aves_fallecidas; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.aves_fallecidas (id_aves_fallecidas, cantidad, "createdAt", "updatedAt", id_lote) FROM stdin;
\.


--
-- Data for Name: categoria_insumo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.categoria_insumo (id_categoria_insumo, nombre_categoria) FROM stdin;
3c25088e-d05e-47f4-80fb-b02b99da4f11	Alimentos
fb3b0220-d180-46e9-b0f9-3ecc48d6ea5b	Herramientas
f1f1c2d9-22b9-4b07-b1d6-8bd8dd4d5ec2	Medicamentos
\.


--
-- Data for Name: estado_lote; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.estado_lote (id_estado_lote, estado, id_lote) FROM stdin;
\.


--
-- Data for Name: finalizacion_lote; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.finalizacion_lote (id_finalizacion_lote, cantidad, razon, fecha, id_lote) FROM stdin;
\.


--
-- Data for Name: galpon; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.galpon (id_galpon, codigo, nombre, capacidad_max_aves, "createdAt", "updatedAt", area, id_unidad_medida) FROM stdin;
d83c96db-94e3-495f-b1d0-f4e467ba3849	G-001	Galpon 1	100	2026-07-13 19:36:21.740876	2026-07-13 19:36:21.740876	10	\N
dbda5997-2b90-41bb-b40f-ebf6f5d95127	003	galponr3	56	2026-07-22 13:16:39.146052	2026-07-22 13:16:39.146052	50	\N
6c25d5e1-b5fd-44ff-a4cb-bbb0ccdf3d9a	011	galpon de alla arriba	500	2026-08-10 16:34:06.6248	2026-08-10 16:34:06.6248	120	\N
e91085ee-0e11-49e1-97af-37058abcd345	022	galpon de alla al lado 	120	2026-08-10 16:35:18.300216	2026-08-10 16:35:18.300216	20	\N
e646a5cf-2909-409c-ac75-9cd041450d5a	002	Galpon 2	10	2026-07-22 13:08:51.085859	2026-08-10 16:36:04.822385	120	\N
b4866201-e4f8-4d37-b1f6-91f09a73ea43	12	el de alla abajo	400	2026-08-10 16:34:47.071592	2026-08-10 16:37:57.181548	120	\N
06aec14d-c8d7-44bc-b528-093ed8448ef9	00233	ojjj,	10	2026-08-10 16:46:22.451577	2026-08-10 16:46:22.451577	55	\N
575ae87e-e4b0-43fb-baa2-8c24d2d10f5c	0000	quejuee	25	2026-08-19 12:29:36.563049	2026-08-19 12:58:52.739473	30	\N
\.


--
-- Data for Name: historial_asignacion_lote; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.historial_asignacion_lote (id_historial_asignacion_lote, cantidad_asignada, id_lote, id_galpon, fecha, descripcion, usuario, nombre_elemento, raza_nombre) FROM stdin;
699df0d4-d1b5-40f0-9fff-8cdad944a5fe	100	227b7cdd-b003-4ac6-9995-d5ddcf869425	d83c96db-94e3-495f-b1d0-f4e467ba3849	2026-07-13 20:39:19.461604		Sistema		\N
b8330e6d-ad09-4e01-84fe-0bdc725adc9c	100	227b7cdd-b003-4ac6-9995-d5ddcf869425	d83c96db-94e3-495f-b1d0-f4e467ba3849	2026-07-20 01:24:04.576075	Editar lote: Observación modificada	Admin Admin	Lote 1	Isa Browns
641c95bd-49a5-4890-9c05-4205780bd13b	26	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	e646a5cf-2909-409c-ac75-9cd041450d5a	2026-07-22 13:09:45.660879	Crear lote	Admin Admin	lote R	Estrella Negra
290ff802-d129-4068-b085-2e808eef80b9	100	bb76e7f2-93bc-4255-9436-23ad7ee4cbce	e646a5cf-2909-409c-ac75-9cd041450d5a	2026-07-22 13:10:42.890461	Crear lote	Admin Admin	loter2	Isa Browns
07376d4b-64a6-41b5-b830-4fb458c41593	25	eb1573ec-b839-4b09-a51e-e2c13e5183f5	dbda5997-2b90-41bb-b40f-ebf6f5d95127	2026-07-22 13:17:41.406584	Crear lote	Admin Admin	lote R2	Rhode Island Rojo
c7e1aeed-ea26-444b-a6f1-3b5e110f35c2	500	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43	2026-08-10 16:37:32.855516	Crear lote	Admin Admin	Lote feo	Isa Browns
dfaa31a8-18b0-4ef7-bc7f-fdb61add58a8	200	bb76e7f2-93bc-4255-9436-23ad7ee4cbce	e646a5cf-2909-409c-ac75-9cd041450d5a	2026-08-10 16:42:09.348808	Editar lote: Aves de 100 a 200	Admin Admin	loter2	Isa Browns
68ce0401-dabe-4d17-8ee3-8828f8506c50	500	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43	2026-08-10 16:42:37.82587	Editar lote: Estado de "ACTIVO" a "FINALIZADO"	Admin Admin	Lote feo	Isa Browns
0ee52855-6858-468e-8e4f-c6bcd97b8a07	25	f6e65a12-73b2-4eba-bb43-5498c779d03d	575ae87e-e4b0-43fb-baa2-8c24d2d10f5c	2026-08-19 12:35:04.114767	Crear lote	Admin Avicola	lote reinel	Isa Browns
ba2e56e7-4ec0-4c4b-9ed9-57bdd7b32bcf	27	f6e65a12-73b2-4eba-bb43-5498c779d03d	575ae87e-e4b0-43fb-baa2-8c24d2d10f5c	2026-08-19 12:58:01.80369	Editar lote: Aves de 25 a 27	Admin Avicola	lote reinel	Isa Browns
31e36b28-023f-445a-a760-c2fc7c1fd5af	500	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43	2026-08-19 13:03:44.399592	Editar lote: Estado de "FINALIZADO" a "ACTIVO"	Admin Avicola	Lote feo	Isa Browns
2748ec79-632c-4670-a6cf-3b65322f7ad4	500	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43	2026-08-19 13:03:50.824182	Editar lote: Estado de "ACTIVO" a "FINALIZADO"	Admin Avicola	Lote feo	Isa Browns
58e1a462-e148-400b-9113-d92791444d0b	500	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43	2026-08-19 13:03:57.928004	Editar lote: Estado de "FINALIZADO" a "ACTIVO"	Admin Avicola	Lote feo	Isa Browns
780a62a9-d8f3-4025-a3b5-c23710aa2856	500	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43	2026-08-19 13:04:02.390077	Editar lote: Estado de "ACTIVO" a "FINALIZADO"	Admin Avicola	Lote feo	Isa Browns
\.


--
-- Data for Name: historial_huevo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.historial_huevo (id_historial_huevo, "usuarioId", cantidad, fecha, "inventarioIdInventarioHuevo", "produccionIdProduccionHuevo", tipo_movimiento, cantidad_anterior) FROM stdin;
5079c914-e50c-468c-8a93-abc5168bdbf4	\N	5	2026-08-19 13:20:11.70331	66da82fb-616c-48e3-b29f-7eddd386339e	\N	Huevos Dañados	35
42e9cde8-c69e-4d1f-bd77-23140c9b8fc7	\N	2	2026-08-19 13:22:58.881287	374d3303-8ddd-4f82-a7e0-bb7d6eb55e4b	\N	Huevos Dañados	2
\.


--
-- Data for Name: historial_insumo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.historial_insumo (id_historial_insumo, id_insumos, id_historial_accion, cantidad, descripcion, fecha, usuario) FROM stdin;
22f4499f-95c2-4082-a377-66c5a4437c25	7eb394d4-5ea7-40ad-be12-9703e78e6888	e8ad5740-4787-4885-9890-d57f1ded1a86	2	Registro inicial de insumo	2026-07-22 13:22:49.833	Admin Admin
95488cc7-338a-4b43-a0ad-aab9359479f4	7eb394d4-5ea7-40ad-be12-9703e78e6888	e8ad5740-4787-4885-9890-d57f1ded1a86	5	stock bajo\n	2026-07-22 13:23:24.302	Admin Admin
65eb4322-1904-48d8-a1ae-6f8641d94dac	317772ac-5944-48a1-91b8-208aa6b1243f	e8ad5740-4787-4885-9890-d57f1ded1a86	3	Registro inicial de insumo	2026-07-22 13:37:38.59	Admin Admin
ad2b3acd-0c04-4469-afe5-de1529cc3a42	daba6ded-223c-4df8-b861-275324b083d4	e8ad5740-4787-4885-9890-d57f1ded1a86	20	Registro inicial de insumo	2026-07-22 13:39:54.938	Admin Admin
3afcd1c5-9ed4-47a6-8c1e-35def5e3378d	731fb904-783d-4f13-9d6b-17f1ce594a38	e8ad5740-4787-4885-9890-d57f1ded1a86	20	Registro inicial de insumo	2026-07-22 13:41:21.888	Admin Admin
c1562789-3854-4716-b1ee-9a6a10eadafc	7eb394d4-5ea7-40ad-be12-9703e78e6888	e8ad5740-4787-4885-9890-d57f1ded1a86	1234	compra de insumos	2026-08-05 13:33:58.497	Admin Admin
4cd62d85-776e-41f3-8bd7-03ddf04fbf2d	475ca875-7d34-409c-afbc-a720cb3e0542	e8ad5740-4787-4885-9890-d57f1ded1a86	10	Registro inicial de insumo	2026-08-12 02:26:10.398	Admin Admin
7a00a9b4-f09d-4132-a9b0-8732b457483a	7eb394d4-5ea7-40ad-be12-9703e78e6888	e8ad5740-4787-4885-9890-d57f1ded1a86	10	nuevos	2026-08-14 15:55:25.065	Admin Admin
9578b3c0-a52a-4118-b86b-c3fadbb49582	daba6ded-223c-4df8-b861-275324b083d4	e8ad5740-4787-4885-9890-d57f1ded1a86	240	restaurar	2026-08-14 16:08:00.227	Admin Avicola
86f78590-92ba-439c-9132-2ed227c8ff1a	475ca875-7d34-409c-afbc-a720cb3e0542	e8ad5740-4787-4885-9890-d57f1ded1a86	90	Actualización de stock de insumo (anterior: 10, nuevo: 100)	2026-08-15 01:47:37.15	Admin Avicola
2a1533a9-3dba-4d38-bee4-e05931a5083d	daba6ded-223c-4df8-b861-275324b083d4	e8ad5740-4787-4885-9890-d57f1ded1a86	30	TOCO	2026-08-19 13:34:06.037	Admin Avicola
50ee440f-d7da-4c05-9353-fa2aca377820	475ca875-7d34-409c-afbc-a720cb3e0542	070fff7c-3ed7-45bc-9179-5e6ae6204e73	90	Actualización de stock de insumo (anterior: 100, nuevo: 10)	2026-08-19 13:35:03.534	Admin Avicola
\.


--
-- Data for Name: huevo_dañado; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public."huevo_dañado" ("id_huevo_dañado", cantidad, razon, "registeredAt", "inventarioIdInventarioHuevo") FROM stdin;
0f451a56-a584-4b2f-87b6-83bdeb75de54	4	dañado	2026-07-22 13:18:24.514016	66da82fb-616c-48e3-b29f-7eddd386339e
c4f23145-4ba2-4f8a-aba7-ba88e26461aa	7	hgh	2026-07-22 13:22:08.549976	66da82fb-616c-48e3-b29f-7eddd386339e
e45406fb-e6f7-4664-9543-4b8ae4635019	5	SE DAÑO	2026-08-19 13:20:11.697172	66da82fb-616c-48e3-b29f-7eddd386339e
11aecf12-d933-4e66-9dd6-406df3ba9879	2	GVHGFJHY	2026-08-19 13:22:58.874737	374d3303-8ddd-4f82-a7e0-bb7d6eb55e4b
\.


--
-- Data for Name: insumo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.insumo (id_insumo, id_categoria, id_unidad_medida, id_llamar_usuario, nombre, cantidad, fecha, stock_minimo, proveedor, precio_unitario, fecha_eliminacion) FROM stdin;
7637bab8-76fa-4f30-870b-c79d33277d9c	3c25088e-d05e-47f4-80fb-b02b99da4f11	18409102-4c30-4cbf-9758-ae66f79ab650	1	Alimento Concentrado	151	2026-07-13 19:29:59.412	0	\N	0.00	2026-08-12 03:14:14.374483
731fb904-783d-4f13-9d6b-17f1ce594a38	3c25088e-d05e-47f4-80fb-b02b99da4f11	18409102-4c30-4cbf-9758-ae66f79ab650	1	dfsf	20	2026-07-22 00:00:00	20	\N	20.00	2026-08-14 15:54:44.156575
317772ac-5944-48a1-91b8-208aa6b1243f	fb3b0220-d180-46e9-b0f9-3ecc48d6ea5b	7ad20066-277e-42d4-97b1-8be67b6d8744	1	martillo	3	2026-07-22 00:00:00	1	copetrol	10000.00	2026-08-14 15:54:59.431258
7eb394d4-5ea7-40ad-be12-9703e78e6888	3c25088e-d05e-47f4-80fb-b02b99da4f11	7ad20066-277e-42d4-97b1-8be67b6d8744	1	levadura	1251	2026-07-22 00:00:00	2	sena	2500.00	2026-08-14 15:55:32.402171
daba6ded-223c-4df8-b861-275324b083d4	3c25088e-d05e-47f4-80fb-b02b99da4f11	18409102-4c30-4cbf-9758-ae66f79ab650	1	asdfasa	290	2026-07-22 00:00:00	20	\N	20.00	\N
475ca875-7d34-409c-afbc-a720cb3e0542	3c25088e-d05e-47f4-80fb-b02b99da4f11	18409102-4c30-4cbf-9758-ae66f79ab650	1	pasto	10	2026-08-12 00:00:00	0	\N	0.00	\N
\.


--
-- Data for Name: inventario_huevo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.inventario_huevo (id_inventario_huevo, cantidad, tipo_huevo_id, "loteIdLote", "produccionIdProduccionHuevo", fecha_eliminacion) FROM stdin;
a4d5a137-3f11-471e-a2e5-eec3af94213e	1	ed54eac8-fe58-40ee-9234-2ae72f9835a3	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	f7705977-ac44-43c3-8149-fc64606d8fff	\N
568d15f9-c5c1-4d92-a9bd-062acb33793e	1	20deaf7d-2c1e-46b0-af5f-8b398ddd23af	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	7853cb7e-b764-4a02-ace5-d57c273e793d	\N
f02a175b-4bd5-4a8e-b35c-72de7d121b13	1	6b57150b-0d7e-4317-91ae-f184ecc1a521	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	b6e14ab2-2829-4a27-8f9a-cdd1a9eb4a9c	\N
7d9253d5-84d6-4c14-81dd-44f468c5ce39	20	20deaf7d-2c1e-46b0-af5f-8b398ddd23af	f6e65a12-73b2-4eba-bb43-5498c779d03d	13c65970-c6e2-4e58-b7b9-1da22e91e5db	\N
6c018dbd-674d-4602-ae8f-befa012fe4be	50	211c65d2-f007-4a66-a74a-dbd5345d6b8d	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	7bb277aa-f8f6-499e-a7d1-f29dc2b09cbd	\N
66da82fb-616c-48e3-b29f-7eddd386339e	30	3d1849fd-7956-40d2-9d18-1b574a21b956	227b7cdd-b003-4ac6-9995-d5ddcf869425	41472e6b-4d51-45ba-9e33-b21bef6ece53	\N
374d3303-8ddd-4f82-a7e0-bb7d6eb55e4b	0	5236224f-edff-4de2-8dcd-e32e5a325e42	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	69224aa8-b3de-4a03-a0f1-51657b7af17a	\N
036a5184-2381-4956-b7aa-20b8d986ba52	20	20deaf7d-2c1e-46b0-af5f-8b398ddd23af	bb76e7f2-93bc-4255-9436-23ad7ee4cbce	643df10e-afac-4619-a99f-b294cca5a19c	2026-08-19 13:26:54.85735
a9927d9e-ee22-4903-a8b2-a34e410687e2	54	5236224f-edff-4de2-8dcd-e32e5a325e42	eb1573ec-b839-4b09-a51e-e2c13e5183f5	d3e8f395-581a-4495-b4e1-3c49e21e1b97	2026-08-19 13:27:30.861851
\.


--
-- Data for Name: llamar_usuario; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.llamar_usuario (id_llamar_usuario, id_usuario, fecha_creacion, fecha_modificacion) FROM stdin;
2	04105fcb-ba9b-4bf2-9096-4c66e71c2d9c	2026-08-10 13:57:31.529372	2026-08-10 13:57:31.529372
1	cea71326-0258-4d00-a789-4ea0703bc5f4	2026-07-13 19:27:34.403389	2026-08-14 16:04:34.521
3	367fcf4c-2c26-4085-af65-160314b95e77	2026-08-14 16:23:13.409806	2026-08-14 16:23:13.409806
\.


--
-- Data for Name: lote; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.lote (id_lote, nombre, total_aves, observacion, racion_alimento, estado, id_raza, fecha_eliminacion) FROM stdin;
227b7cdd-b003-4ac6-9995-d5ddcf869425	Lote 1	100	Prueba de guardado exitosa	120	ACTIVO	f1c5a4ca-0340-4b4e-914e-5415212f3a85	\N
69f7eca0-1ab5-46ec-9351-78fa4f8011a8	lote R	26	nada	120	ACTIVO	b0fd7746-98f1-4485-bbe0-2a2cc7f414ed	\N
eb1573ec-b839-4b09-a51e-e2c13e5183f5	lote R2	25	mada	120	ACTIVO	6fc1a276-aaed-481f-beb0-30f3c8fb5625	\N
bb76e7f2-93bc-4255-9436-23ad7ee4cbce	loter2	200	nada	20	ACTIVO	f1c5a4ca-0340-4b4e-914e-5415212f3a85	\N
f6e65a12-73b2-4eba-bb43-5498c779d03d	lote reinel	27	.	120	ACTIVO	f1c5a4ca-0340-4b4e-914e-5415212f3a85	\N
97b3f093-3a40-45be-863a-b16d13312bba	Lote feo	500	muy feas esas gallinas	120	FINALIZADO	f1c5a4ca-0340-4b4e-914e-5415212f3a85	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1774534313767	CreateNewTables1774534313767
2	1774534320000	AddSoftDeletes1774534320000
3	1780328252290	AjusteFase31780328252290
4	1780332423593	IncreasePasswordLength1780332423593
5	1783607204709	MakeEggWeightsNullable1783607204709
6	1783975126820	UpdateBarnAndHistory1783975126820
7	1784687500000	AddSupplyFields1784687500000
8	1784687600000	AddUserToSupplyHistory1784687600000
9	1784687700000	ChangeSupplyStockToInteger1784687700000
10	1786504383138	UpdateEggHistoryAndSupplySoftDelete1786504383138
\.


--
-- Data for Name: permiso; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.permiso (id_permiso, codigo, nombre, descripcion) FROM stdin;
1	1	CONFIGURACION_VER	Ver configuración general
2	10	GALPONES_CREAR	Crear galpones
3	11	GALPONES_VER	Ver galpones
4	12	GALPONES_EDITAR	Editar galpones
5	13	GALPONES_ELIMINAR	Eliminar galpones
6	20	RAZAS_CREAR	Crear razas
7	21	RAZAS_VER	Ver razas
8	22	RAZAS_EDITAR	Editar razas
9	23	RAZAS_ELIMINAR	Eliminar razas
10	30	USUARIOS_CREAR	Crear usuarios
11	31	USUARIOS_VER	Ver usuarios
12	32	USUARIOS_EDITAR	Editar usuarios
13	33	USUARIOS_DESACTIVAR	Desactivar usuarios
14	34	USUARIOS_ELIMINAR	Eliminar usuarios
15	40	HUEVOS_CREAR	Crear registros de huevos
16	41	HUEVOS_VER	Ver inventario de huevos
17	42	HUEVOS_EDITAR	Editar registros de huevos
18	50	UNIDADES_MEDIDA_CREAR	Crear unidades de medida
19	51	UNIDADES_MEDIDA_VER	Ver unidades de medida
20	52	UNIDADES_MEDIDA_EDITAR	Editar unidades de medida
21	53	UNIDADES_MEDIDA_ELIMINAR	Eliminar unidades de medida
22	60	INSUMOS_CREAR	Crear insumos
23	61	INSUMOS_VER	Ver insumos
24	62	INSUMOS_EDITAR	Editar insumos
25	63	INSUMOS_ELIMINAR	Eliminar insumos
26	70	LOTES_CREAR	Crear lotes
27	71	LOTES_VER	Ver lotes
28	72	LOTES_EDITAR	Editar lotes
29	73	LOTES_ELIMINAR	Eliminar lotes
30	80	PERMISOS_CREAR	Crear permisos
31	81	PERMISOS_VER	Ver permisos
32	82	PERMISOS_EDITAR	Editar permisos
33	83	PERMISOS_ELIMINAR	Eliminar permisos
34	90	CATEGORIAS_CREAR	Crear categorías
35	91	CATEGORIAS_VER	Ver categorías
36	92	CATEGORIAS_EDITAR	Editar categorías
37	93	CATEGORIAS_ELIMINAR	Eliminar categorías
38	100	ROLES_CREAR	Crear roles
39	101	ROLES_VER	Ver roles
40	102	ROLES_EDITAR	Editar roles
41	103	ROLES_ELIMINAR	Eliminar roles
42	110	REPORTES_VER	Ver reportes
43	111	REPORTES_CREAR	Crear reportes
44	120	BACKUP_GESTIONAR	Gestionar backups
\.


--
-- Data for Name: produccion_huevo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.produccion_huevo (id_produccion_huevo, cantidady, "produccionFecha", "loteIdLote", "tipo_huevoId") FROM stdin;
41472e6b-4d51-45ba-9e33-b21bef6ece53	30	2026-07-13 19:38:28.300098	227b7cdd-b003-4ac6-9995-d5ddcf869425	20deaf7d-2c1e-46b0-af5f-8b398ddd23af
643df10e-afac-4619-a99f-b294cca5a19c	20	2026-07-22 13:17:56.100256	bb76e7f2-93bc-4255-9436-23ad7ee4cbce	20deaf7d-2c1e-46b0-af5f-8b398ddd23af
f7705977-ac44-43c3-8149-fc64606d8fff	1	2026-07-22 13:21:08.141608	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	ed54eac8-fe58-40ee-9234-2ae72f9835a3
7853cb7e-b764-4a02-ace5-d57c273e793d	1	2026-07-22 13:21:49.075921	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	20deaf7d-2c1e-46b0-af5f-8b398ddd23af
d3e8f395-581a-4495-b4e1-3c49e21e1b97	54	2026-08-12 02:19:57.601146	eb1573ec-b839-4b09-a51e-e2c13e5183f5	5236224f-edff-4de2-8dcd-e32e5a325e42
69224aa8-b3de-4a03-a0f1-51657b7af17a	1	2026-08-12 02:23:33.404905	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	5236224f-edff-4de2-8dcd-e32e5a325e42
b6e14ab2-2829-4a27-8f9a-cdd1a9eb4a9c	1	2026-08-12 02:23:47.99938	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	6b57150b-0d7e-4317-91ae-f184ecc1a521
695f3d90-71bd-4750-93a6-0b99663559b1	1	2026-08-14 16:02:25.78667	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	5236224f-edff-4de2-8dcd-e32e5a325e42
13c65970-c6e2-4e58-b7b9-1da22e91e5db	20	2026-08-19 13:08:07.838305	f6e65a12-73b2-4eba-bb43-5498c779d03d	20deaf7d-2c1e-46b0-af5f-8b398ddd23af
7bb277aa-f8f6-499e-a7d1-f29dc2b09cbd	50	2026-08-19 13:18:04.242897	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	211c65d2-f007-4a66-a74a-dbd5345d6b8d
\.


--
-- Data for Name: raza; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.raza (id_raza, nombre, descripcion) FROM stdin;
f1c5a4ca-0340-4b4e-914e-5415212f3a85	Isa Browns	Raza Isa Browns
5f60527c-e9da-449f-bae4-b5f7f6773951	Austra Blanco	Raza Austra Blanco
444a66bb-d924-47b6-87af-9e984cabbe01	Lohmann Marrón	Raza Lohmann Marrón
b0fd7746-98f1-4485-bbe0-2a2cc7f414ed	Estrella Negra	Raza Estrella Negra
cabd6e80-817e-4b19-99be-a4da2433e5a8	Plymouth Rocks	Raza Plymouth Rocks
6fc1a276-aaed-481f-beb0-30f3c8fb5625	Rhode Island Rojo	Raza Rhode Island Rojo
\.


--
-- Data for Name: reporte; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.reporte (id_reporte, tipo_reporte, id_usuario) FROM stdin;
4ffde25f-e095-4a87-97aa-8e982f526b59	insumos	cea71326-0258-4d00-a789-4ea0703bc5f4
d9eb9e9a-439e-40f5-aefb-d985d10b04bd	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
4fc1d4f1-84ad-4198-9b0e-91f86ad666d0	historial	cea71326-0258-4d00-a789-4ea0703bc5f4
7ce2f878-f100-4567-a291-7a38f6e0d199	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
130521ae-4f5b-4eda-b450-e20d90a9e27d	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
8f64599b-b614-4351-8ad9-7169579dc148	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
77a747de-41cf-4a45-b312-f1267590c9fc	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
468a3a7d-725f-433d-a7d5-d2cadb574523	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
59b9132c-4fec-4330-b560-5b08c20c8566	huevos	cea71326-0258-4d00-a789-4ea0703bc5f4
88c82c70-2c2f-4240-9927-3ae66ac42abc	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
ed6e1161-2bbb-433f-8d87-fe72e1853eb1	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
e65ab355-3848-4838-8f9f-aac90fa05d1b	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
60abfe74-4b7b-4c3f-99b5-84badfa13114	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
879d9afc-10dd-477f-9e8f-c0fa29ea7670	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
db7e0b87-5bdf-42ae-b731-58068088bd98	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
001e0ea1-ac82-44de-8137-e4ad8065b16f	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
bb5ccbcd-f163-445c-82c5-edbe6313514d	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
443ebe37-4737-4591-9d77-1429b230712b	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
edeeff11-a882-40e8-855a-72aaa2357709	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
c0081cc9-8bd5-462a-9831-768eeb0c421e	gallinas	cea71326-0258-4d00-a789-4ea0703bc5f4
\.


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.rol (id_rol, nombre) FROM stdin;
1	admin
2	aprendiz
3	visitante
\.


--
-- Data for Name: rol_permiso; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.rol_permiso (id_rol_permiso, id_permiso, id_rol) FROM stdin;
1	1	1
2	2	1
3	3	1
4	4	1
5	5	1
6	6	1
7	7	1
8	8	1
9	9	1
10	10	1
11	11	1
12	12	1
13	13	1
14	14	1
15	15	1
16	16	1
17	17	1
18	18	1
19	19	1
20	20	1
21	21	1
22	22	1
23	23	1
24	24	1
25	25	1
26	26	1
27	27	1
28	28	1
29	29	1
30	30	1
31	31	1
32	32	1
33	33	1
34	34	1
35	35	1
36	36	1
37	37	1
38	38	1
39	39	1
40	40	1
41	41	1
42	42	1
43	43	1
44	44	1
45	1	3
46	3	3
47	7	3
48	11	3
49	16	3
50	19	3
51	23	3
52	27	3
53	31	3
54	35	3
55	39	3
56	42	3
57	1	2
58	3	2
59	7	2
60	11	2
61	16	2
62	19	2
63	23	2
64	27	2
65	31	2
66	35	2
67	39	2
68	42	2
\.


--
-- Data for Name: tipo_huevo; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.tipo_huevo (id_tipo, tipo, peso_min, peso_max) FROM stdin;
6b57150b-0d7e-4317-91ae-f184ecc1a521	Jumbo	73.00	\N
20deaf7d-2c1e-46b0-af5f-8b398ddd23af	AAA	63.00	73.00
5236224f-edff-4de2-8dcd-e32e5a325e42	AA	53.00	63.00
ed54eac8-fe58-40ee-9234-2ae72f9835a3	A	43.00	53.00
211c65d2-f007-4a66-a74a-dbd5345d6b8d	B	33.00	43.00
3d1849fd-7956-40d2-9d18-1b574a21b956	C	\N	33.00
\.


--
-- Data for Name: ubicacion_lote; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.ubicacion_lote (id_ubicacion_lote, "Fecha", id_lote, id_galpon) FROM stdin;
415f2cdb-f847-46ac-ae7e-9d96f68382d6	2026-07-13 19:37:24.237668	227b7cdd-b003-4ac6-9995-d5ddcf869425	d83c96db-94e3-495f-b1d0-f4e467ba3849
75189265-3351-4119-bfbf-85fd0e6f74cc	2026-07-22 13:09:45.656262	69f7eca0-1ab5-46ec-9351-78fa4f8011a8	e646a5cf-2909-409c-ac75-9cd041450d5a
31610dbf-3d8d-4b59-b92a-cbf072a978ae	2026-07-22 13:10:42.885423	bb76e7f2-93bc-4255-9436-23ad7ee4cbce	e646a5cf-2909-409c-ac75-9cd041450d5a
532db14d-6f98-42ed-9ca3-65daaed135ce	2026-07-22 13:17:41.401759	eb1573ec-b839-4b09-a51e-e2c13e5183f5	dbda5997-2b90-41bb-b40f-ebf6f5d95127
2407a7ec-5bea-48a2-917e-dbd5bc42fcd3	2026-08-10 16:37:32.849352	97b3f093-3a40-45be-863a-b16d13312bba	b4866201-e4f8-4d37-b1f6-91f09a73ea43
b4b12c18-6157-43d7-ae1c-98d9500cac64	2026-08-19 12:35:04.10976	f6e65a12-73b2-4eba-bb43-5498c779d03d	575ae87e-e4b0-43fb-baa2-8c24d2d10f5c
\.


--
-- Data for Name: unidad_medida; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.unidad_medida (id_unidad_medida, nombre, abreviatura) FROM stdin;
18409102-4c30-4cbf-9758-ae66f79ab650	Kilos	kg
7ad20066-277e-42d4-97b1-8be67b6d8744	Unidades	und
1f5931ba-5f2b-4556-9f8d-c2788ffcc549	Litros	L
f90a335e-5061-4e6c-8ab7-a75ff8261fb9	Gramos	g
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.usuario (id_usuario, nombre, apellido, documento, fecha_creacion, ultimo_acceso, email, password, activo, fecha_eliminacion) FROM stdin;
367fcf4c-2c26-4085-af65-160314b95e77	Operario	Aprendiz	111111	2026-08-14 16:23:13.388809	2026-08-14 16:23:13.388809	operario@test.com	$2b$10$r29ELzM.iKsu4JGWVGQAQ.QaXIA.7dFXQjVersumpIFTw0B13btgu	t	\N
cea71326-0258-4d00-a789-4ea0703bc5f4	Admin	Avicola	000000	2026-07-09 14:28:27.106171	2026-08-19 12:27:22.965	admin@test.com	$2b$10$L/NQssFJ8mxLDUmK0Zlx1ePihHodc4JLUKVDFPobT00QMapFPIY3C	t	\N
04105fcb-ba9b-4bf2-9096-4c66e71c2d9c	Visitante	Test	999999	2026-08-10 13:57:31.510819	2026-08-10 13:57:31.510819	visitante@test.com	$2b$10$GH8VRdKnfladXatWrXpmceHvAxauYtCVXwsTmwWgxbfLu12aRskJO	t	\N
\.


--
-- Data for Name: usuario_rol; Type: TABLE DATA; Schema: public; Owner: aprendiz
--

COPY public.usuario_rol (id_usuario_rol, id_usuario, id_rol) FROM stdin;
1	cea71326-0258-4d00-a789-4ea0703bc5f4	1
2	04105fcb-ba9b-4bf2-9096-4c66e71c2d9c	3
3	367fcf4c-2c26-4085-af65-160314b95e77	2
\.


--
-- Name: llamar_usuario_id_llamar_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: aprendiz
--

SELECT pg_catalog.setval('public.llamar_usuario_id_llamar_usuario_seq', 3, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: aprendiz
--

SELECT pg_catalog.setval('public.migrations_id_seq', 10, true);


--
-- Name: permiso_id_permiso_seq; Type: SEQUENCE SET; Schema: public; Owner: aprendiz
--

SELECT pg_catalog.setval('public.permiso_id_permiso_seq', 44, true);


--
-- Name: rol_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: aprendiz
--

SELECT pg_catalog.setval('public.rol_id_rol_seq', 3, true);


--
-- Name: rol_permiso_id_rol_permiso_seq; Type: SEQUENCE SET; Schema: public; Owner: aprendiz
--

SELECT pg_catalog.setval('public.rol_permiso_id_rol_permiso_seq', 68, true);


--
-- Name: usuario_rol_id_usuario_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: aprendiz
--

SELECT pg_catalog.setval('public.usuario_rol_id_usuario_rol_seq', 3, true);


--
-- Name: rol PK_0b42a30072d57ccfad9949218da; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT "PK_0b42a30072d57ccfad9949218da" PRIMARY KEY (id_rol);


--
-- Name: historial_asignacion_lote PK_13c6f3f55a18d01f945125df158; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_asignacion_lote
    ADD CONSTRAINT "PK_13c6f3f55a18d01f945125df158" PRIMARY KEY (id_historial_asignacion_lote);


--
-- Name: rol_permiso PK_151312cfdb886f6d9dc19f9ccfd; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT "PK_151312cfdb886f6d9dc19f9ccfd" PRIMARY KEY (id_rol_permiso);


--
-- Name: raza PK_19cbb355eaf65fb4ca7544ff741; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.raza
    ADD CONSTRAINT "PK_19cbb355eaf65fb4ca7544ff741" PRIMARY KEY (id_raza);


--
-- Name: huevo_dañado PK_1e16c8c07593d065bf36d982581; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public."huevo_dañado"
    ADD CONSTRAINT "PK_1e16c8c07593d065bf36d982581" PRIMARY KEY ("id_huevo_dañado");


--
-- Name: galpon PK_28bbda598d98e0f194c4bceb465; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.galpon
    ADD CONSTRAINT "PK_28bbda598d98e0f194c4bceb465" PRIMARY KEY (id_galpon);


--
-- Name: reporte PK_47bdb6e5b218eb2f5e205dfbbb9; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.reporte
    ADD CONSTRAINT "PK_47bdb6e5b218eb2f5e205dfbbb9" PRIMARY KEY (id_reporte);


--
-- Name: inventario_huevo PK_4f883b2ae2dccc24ee2e275f2d0; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.inventario_huevo
    ADD CONSTRAINT "PK_4f883b2ae2dccc24ee2e275f2d0" PRIMARY KEY (id_inventario_huevo);


--
-- Name: alimentacion PK_56eaafeca596569647ba5f28334; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.alimentacion
    ADD CONSTRAINT "PK_56eaafeca596569647ba5f28334" PRIMARY KEY (id_alimentacion);


--
-- Name: llamar_usuario PK_5d1cb747df5bb70e5bfcc4236ec; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.llamar_usuario
    ADD CONSTRAINT "PK_5d1cb747df5bb70e5bfcc4236ec" PRIMARY KEY (id_llamar_usuario);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: historial_huevo PK_8eded1d7b0ec9b4437c0bdb1442; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_huevo
    ADD CONSTRAINT "PK_8eded1d7b0ec9b4437c0bdb1442" PRIMARY KEY (id_historial_huevo);


--
-- Name: ubicacion_lote PK_955c40fe36a4b4e89fd237efe6e; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.ubicacion_lote
    ADD CONSTRAINT "PK_955c40fe36a4b4e89fd237efe6e" PRIMARY KEY (id_ubicacion_lote);


--
-- Name: finalizacion_lote PK_9e88c139f7798bb0c993e174f88; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.finalizacion_lote
    ADD CONSTRAINT "PK_9e88c139f7798bb0c993e174f88" PRIMARY KEY (id_finalizacion_lote);


--
-- Name: categoria_insumo PK_a96716804a9cbfc656364d67a6e; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.categoria_insumo
    ADD CONSTRAINT "PK_a96716804a9cbfc656364d67a6e" PRIMARY KEY (id_categoria_insumo);


--
-- Name: produccion_huevo PK_aae60b7b9d35b29ba00c7e85554; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.produccion_huevo
    ADD CONSTRAINT "PK_aae60b7b9d35b29ba00c7e85554" PRIMARY KEY (id_produccion_huevo);


--
-- Name: tipo_huevo PK_b4271033b7fb583aa7fcfd3e59b; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.tipo_huevo
    ADD CONSTRAINT "PK_b4271033b7fb583aa7fcfd3e59b" PRIMARY KEY (id_tipo);


--
-- Name: accion_historial_movimiento PK_b80c01938238a33148b606f68fa; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.accion_historial_movimiento
    ADD CONSTRAINT "PK_b80c01938238a33148b606f68fa" PRIMARY KEY (id_accion_historial_movimiento);


--
-- Name: usuario_rol PK_ca713aaaeccf9816b62b41ebdcb; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT "PK_ca713aaaeccf9816b62b41ebdcb" PRIMARY KEY (id_usuario_rol);


--
-- Name: lote PK_cd03609638866c3e8cb3dc2759b; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.lote
    ADD CONSTRAINT "PK_cd03609638866c3e8cb3dc2759b" PRIMARY KEY (id_lote);


--
-- Name: aves_fallecidas PK_d5001f8bb36323d11a65b802a06; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.aves_fallecidas
    ADD CONSTRAINT "PK_d5001f8bb36323d11a65b802a06" PRIMARY KEY (id_aves_fallecidas);


--
-- Name: unidad_medida PK_dac609572f56f4807edf3dda2ad; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.unidad_medida
    ADD CONSTRAINT "PK_dac609572f56f4807edf3dda2ad" PRIMARY KEY (id_unidad_medida);


--
-- Name: usuario PK_dd52716c2652e0e23c15530c695; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT "PK_dd52716c2652e0e23c15530c695" PRIMARY KEY (id_usuario);


--
-- Name: insumo PK_fa3440eab25ef3ba3d737794920; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.insumo
    ADD CONSTRAINT "PK_fa3440eab25ef3ba3d737794920" PRIMARY KEY (id_insumo);


--
-- Name: estado_lote PK_fd47347ab9b2ffeabcc682eec9d; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.estado_lote
    ADD CONSTRAINT "PK_fd47347ab9b2ffeabcc682eec9d" PRIMARY KEY (id_estado_lote);


--
-- Name: historial_insumo PK_ff7aa2f097292c1f972208a7f96; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_insumo
    ADD CONSTRAINT "PK_ff7aa2f097292c1f972208a7f96" PRIMARY KEY (id_historial_insumo);


--
-- Name: usuario UQ_2863682842e688ca198eb25c124; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT "UQ_2863682842e688ca198eb25c124" UNIQUE (email);


--
-- Name: permiso permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.permiso
    ADD CONSTRAINT permiso_pkey PRIMARY KEY (id_permiso);


--
-- Name: historial_asignacion_lote FK_14818b91ed9cc21835604facbfc; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_asignacion_lote
    ADD CONSTRAINT "FK_14818b91ed9cc21835604facbfc" FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote) ON DELETE SET NULL;


--
-- Name: rol_permiso FK_1d9e5be3d74310f98e398912d94; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT "FK_1d9e5be3d74310f98e398912d94" FOREIGN KEY (id_rol) REFERENCES public.rol(id_rol);


--
-- Name: produccion_huevo FK_1f65551335f2fbeff52c3c570bf; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.produccion_huevo
    ADD CONSTRAINT "FK_1f65551335f2fbeff52c3c570bf" FOREIGN KEY ("tipo_huevoId") REFERENCES public.tipo_huevo(id_tipo);


--
-- Name: reporte FK_27f3ea6a906e5f0702dbe7d3fb2; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.reporte
    ADD CONSTRAINT "FK_27f3ea6a906e5f0702dbe7d3fb2" FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: inventario_huevo FK_30c41f459b2a6bde0ceabe16397; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.inventario_huevo
    ADD CONSTRAINT "FK_30c41f459b2a6bde0ceabe16397" FOREIGN KEY ("loteIdLote") REFERENCES public.lote(id_lote);


--
-- Name: inventario_huevo FK_316c23a916e379efed6e8a42b4b; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.inventario_huevo
    ADD CONSTRAINT "FK_316c23a916e379efed6e8a42b4b" FOREIGN KEY (tipo_huevo_id) REFERENCES public.tipo_huevo(id_tipo);


--
-- Name: alimentacion FK_46b560e4ac93caab22cb430cec1; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.alimentacion
    ADD CONSTRAINT "FK_46b560e4ac93caab22cb430cec1" FOREIGN KEY ("insumoIdInsumo") REFERENCES public.insumo(id_insumo);


--
-- Name: insumo FK_4fc30af7b401fb76a04d009a564; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.insumo
    ADD CONSTRAINT "FK_4fc30af7b401fb76a04d009a564" FOREIGN KEY (id_categoria) REFERENCES public.categoria_insumo(id_categoria_insumo);


--
-- Name: llamar_usuario FK_577eb160128ebafd1f8852d7eb4; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.llamar_usuario
    ADD CONSTRAINT "FK_577eb160128ebafd1f8852d7eb4" FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: huevo_dañado FK_6103af2db75ab9def3feed9d3e6; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public."huevo_dañado"
    ADD CONSTRAINT "FK_6103af2db75ab9def3feed9d3e6" FOREIGN KEY ("inventarioIdInventarioHuevo") REFERENCES public.inventario_huevo(id_inventario_huevo);


--
-- Name: produccion_huevo FK_6248afd2f6ba2993bab2e333c99; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.produccion_huevo
    ADD CONSTRAINT "FK_6248afd2f6ba2993bab2e333c99" FOREIGN KEY ("loteIdLote") REFERENCES public.lote(id_lote);


--
-- Name: insumo FK_66761f18f29da02f4f4f6311b3e; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.insumo
    ADD CONSTRAINT "FK_66761f18f29da02f4f4f6311b3e" FOREIGN KEY (id_llamar_usuario) REFERENCES public.llamar_usuario(id_llamar_usuario);


--
-- Name: usuario_rol FK_6adca3617fc69b2864e67196f2a; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT "FK_6adca3617fc69b2864e67196f2a" FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: galpon FK_6d43ffdc710f856c2554bf80dc7; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.galpon
    ADD CONSTRAINT "FK_6d43ffdc710f856c2554bf80dc7" FOREIGN KEY (id_unidad_medida) REFERENCES public.unidad_medida(id_unidad_medida);


--
-- Name: inventario_huevo FK_6db9ce9c62f5b578ceb433ab32a; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.inventario_huevo
    ADD CONSTRAINT "FK_6db9ce9c62f5b578ceb433ab32a" FOREIGN KEY ("produccionIdProduccionHuevo") REFERENCES public.produccion_huevo(id_produccion_huevo);


--
-- Name: lote FK_900ff7ce7db737ba8895fa237be; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.lote
    ADD CONSTRAINT "FK_900ff7ce7db737ba8895fa237be" FOREIGN KEY (id_raza) REFERENCES public.raza(id_raza);


--
-- Name: historial_insumo FK_91619531ac8d6a8c2b2ae7ae490; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_insumo
    ADD CONSTRAINT "FK_91619531ac8d6a8c2b2ae7ae490" FOREIGN KEY (id_insumos) REFERENCES public.insumo(id_insumo);


--
-- Name: usuario_rol FK_96d2a6ecb2ad0931416610845cf; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT "FK_96d2a6ecb2ad0931416610845cf" FOREIGN KEY (id_rol) REFERENCES public.rol(id_rol);


--
-- Name: insumo FK_983c9e0e5709a0ee91eac157a51; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.insumo
    ADD CONSTRAINT "FK_983c9e0e5709a0ee91eac157a51" FOREIGN KEY (id_unidad_medida) REFERENCES public.unidad_medida(id_unidad_medida);


--
-- Name: rol_permiso FK_9c0fd212b970f71bf0a9465c4f3; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.rol_permiso
    ADD CONSTRAINT "FK_9c0fd212b970f71bf0a9465c4f3" FOREIGN KEY (id_permiso) REFERENCES public.permiso(id_permiso);


--
-- Name: aves_fallecidas FK_9ddebf439819142049ef223e040; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.aves_fallecidas
    ADD CONSTRAINT "FK_9ddebf439819142049ef223e040" FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote);


--
-- Name: finalizacion_lote FK_ad750c54c18c0fa5fee25bd7b70; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.finalizacion_lote
    ADD CONSTRAINT "FK_ad750c54c18c0fa5fee25bd7b70" FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote);


--
-- Name: historial_insumo FK_afd9ee94165c7d0181a595d247b; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_insumo
    ADD CONSTRAINT "FK_afd9ee94165c7d0181a595d247b" FOREIGN KEY (id_historial_accion) REFERENCES public.accion_historial_movimiento(id_accion_historial_movimiento);


--
-- Name: alimentacion FK_b5be9914b153a48cf3be3853528; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.alimentacion
    ADD CONSTRAINT "FK_b5be9914b153a48cf3be3853528" FOREIGN KEY ("usuarioIdUsuario") REFERENCES public.usuario(id_usuario);


--
-- Name: historial_huevo FK_b7400b3382acadc6a80104f3167; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_huevo
    ADD CONSTRAINT "FK_b7400b3382acadc6a80104f3167" FOREIGN KEY ("produccionIdProduccionHuevo") REFERENCES public.produccion_huevo(id_produccion_huevo);


--
-- Name: ubicacion_lote FK_b922245c9ad93aa9907e21be54f; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.ubicacion_lote
    ADD CONSTRAINT "FK_b922245c9ad93aa9907e21be54f" FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote);


--
-- Name: estado_lote FK_d45a6cafbcb5a6dc2b6f5e5cfe7; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.estado_lote
    ADD CONSTRAINT "FK_d45a6cafbcb5a6dc2b6f5e5cfe7" FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote);


--
-- Name: alimentacion FK_e9a60b6be65cbe51443b838361e; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.alimentacion
    ADD CONSTRAINT "FK_e9a60b6be65cbe51443b838361e" FOREIGN KEY ("loteIdLote") REFERENCES public.lote(id_lote);


--
-- Name: historial_asignacion_lote FK_f26a1f4015dee43f03d9bb2f59a; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_asignacion_lote
    ADD CONSTRAINT "FK_f26a1f4015dee43f03d9bb2f59a" FOREIGN KEY (id_galpon) REFERENCES public.galpon(id_galpon) ON DELETE SET NULL;


--
-- Name: historial_huevo FK_fb7ed4b3d577f945a742a6c1565; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.historial_huevo
    ADD CONSTRAINT "FK_fb7ed4b3d577f945a742a6c1565" FOREIGN KEY ("inventarioIdInventarioHuevo") REFERENCES public.inventario_huevo(id_inventario_huevo);


--
-- Name: ubicacion_lote FK_fd5beacc84c40e1b6fe69796329; Type: FK CONSTRAINT; Schema: public; Owner: aprendiz
--

ALTER TABLE ONLY public.ubicacion_lote
    ADD CONSTRAINT "FK_fd5beacc84c40e1b6fe69796329" FOREIGN KEY (id_galpon) REFERENCES public.galpon(id_galpon);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: aprendiz
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict OHJktFjlUmECoUuFuTSvmwtHr1MKKiHDmpd6yhOp7F0BhHZRZtu2Absw9XLfGvx

