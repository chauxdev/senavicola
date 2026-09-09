# Senavicola

Este proyecto es una plataforma integral que cuenta con un **Frontend** en Angular, un **Backend** en NestJS, una base de datos PostgreSQL y un par de **microservicios en Python** (para análisis de visión: peso y volumen). 

A continuación, se detallan las instrucciones paso a paso para poner a funcionar el proyecto desde cero una vez descargado el repositorio.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes programas en tu sistema:
- [Node.js](https://nodejs.org/es/) (Se recomienda versión LTS, ej. 18.x o superior)
- [Docker](https://www.docker.com/products/docker-desktop/) y [Docker Compose](https://docs.docker.com/compose/install/)
- Angular CLI (Opcional pero recomendado para el frontend, instalable con `npm install -g @angular/cli`)

---

## 🚀 Guía de Instalación y Ejecución

### 1. Configurar y Ejecutar el Backend y los Microservicios (vía Docker)

El proyecto incluye un archivo `docker-compose.yml` dentro de la carpeta `backend` que orquesta la ejecución simultánea de:
- Base de Datos (PostgreSQL)
- Aplicación Backend (NestJS)
- Microservicio Vision-Peso (Python)
- Microservicio Vision-Volumen (Python)

**Pasos:**

1. Abre una terminal y navega hasta la carpeta del backend:
   ```bash
   cd backend
   ```

2. Crea el archivo de variables de entorno `.env`:
   - En la carpeta `backend`, encontrarás un archivo llamado `.env.example`.
   - Cópialo o renómbralo a `.env`:
     ```bash
     cp .env.example .env
     ```
   - Abre el archivo `.env` en tu editor de código y llena los valores, por ejemplo:
     ```env
     DB_USERNAME=postgres
     DB_PASSWORD=secret
     DB_NAME=senavicola
     DB_PORT=5432
     DB_HOST=db
     
     JWT_SECRET=tu_secreto_super_seguro
     JWT_EXPIRES_IN=1d
     ```

3. Levanta todos los contenedores con Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
   > El flag `-d` ejecuta los contenedores en segundo plano. La primera vez puede tardar unos minutos mientras descarga las imágenes y compila los proyectos de Python y Node.js.

### 2. Configurar y Ejecutar el Frontend

El frontend está construido con Angular y se debe ejecutar de manera local utilizando Node.js.

**Pasos:**

1. Abre una **nueva** terminal y navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo de Angular:
   ```bash
   npm start
   ```
   *(Alternativamente, puedes usar `ng serve` si tienes Angular CLI instalado globalmente)*

---

## 🌐 Puertos y Accesos

Una vez que ambos pasos (Docker y Frontend) estén en ejecución, podrás acceder a los diferentes servicios en las siguientes direcciones:

| Servicio | URL Local | Descripción |
|----------|-----------|-------------|
| **Frontend (Angular)** | [http://localhost:4200](http://localhost:4200) | Interfaz gráfica de usuario. |
| **Backend (NestJS)** | [http://localhost:3000](http://localhost:3000) | API principal y lógica de negocio. |
| **Base de Datos (PostgreSQL)** | `localhost:5432` | Credenciales en tu archivo `.env`. |
| **Vision Peso (Python)** | [http://localhost:8000](http://localhost:8000) | API del modelo de visión para calcular peso. |
| **Vision Volumen (Python)** | [http://localhost:8020](http://localhost:8020) | API del modelo de visión para calcular volumen. |

---

## 🛑 Detener la Aplicación

- Para **detener el frontend**, simplemente ve a la terminal donde ejecutaste `npm start` y presiona `Ctrl + C`.
- Para **detener el backend y los microservicios**, ve a la carpeta `backend` en tu terminal y ejecuta:
  ```bash
  docker-compose down
  ```
  *(Esto detendrá y eliminará los contenedores, pero la base de datos conservará sus datos gracias a los volúmenes de Docker)*.
