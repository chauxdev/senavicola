# Senavicola Frontend — Angular 20

Sistema de gestión avícola frontend, conectado al backend NestJS existente.

## 🚀 Requisitos

- Node.js 20+
- npm 10+
- Backend NestJS corriendo en `http://localhost:3000`

## 📦 Instalación

```bash
npm install
```

## ▶️ Ejecutar en desarrollo

```bash
npm start
# Abre http://localhost:4200
```

## 🏗️ Build producción

```bash
npm run build
```

---

## 🗂️ Estructura del Proyecto

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts          # authGuard + publicGuard
│   ├── interceptors/
│   │   └── auth.interceptor.ts    # Agrega Bearer token automáticamente
│   ├── models/
│   │   └── index.ts               # Todos los modelos TypeScript
│   └── services/
│       ├── auth.service.ts        # Login, logout, JWT
│       ├── base-api.service.ts    # CRUD genérico base
│       ├── api.services.ts        # Todos los servicios de la API
│       └── toast.service.ts       # Notificaciones
│
├── shared/
│   └── components/
│       ├── layout/                # Header + Sidebar + RouterOutlet
│       ├── toast-container/       # Notificaciones visuales
│       ├── simple-crud/           # Componente CRUD genérico reutilizable
│       └── forbidden/             # Página 403
│
└── features/
    ├── auth/login/                # Pantalla bienvenida + login
    ├── dashboard/                 # Inicio con gráficas y estadísticas
    ├── flocks/                    # Lotes y galpones
    ├── eggs/                      # Inventario de huevos
    ├── supplies/                  # Insumos
    ├── reports/                   # Reportes
    └── config/
        ├── config-home/           # Dashboard de configuración
        ├── users/                 # CRUD usuarios + asignación de roles
        ├── roles/                 # CRUD roles + asignación de permisos
        ├── permissions/           # CRUD permisos
        ├── breeds/                # Razas
        ├── barns/                 # Galpones (config)
        ├── egg-types/             # Tipos de huevo
        ├── measurement-units/     # Unidades de medida
        ├── supply-categories/     # Categorías de insumos
        └── supply-actions/        # Acciones de insumos
```

---

## 🔐 Autenticación

El flujo es:

1. Usuario hace login en `/auth/login`
2. Backend devuelve `{ access_token, user }`
3. El token se guarda en `localStorage` con key `senavicola_token`
4. El interceptor `auth.interceptor.ts` agrega automáticamente `Authorization: Bearer <token>` a todas las requests
5. Si el backend responde `401`, se hace logout y redirige a login
6. Si responde `403`, muestra "Acceso Denegado"

---

## 📡 Endpoints integrados

Todos los endpoints del backend están implementados. Ver `src/app/core/services/api.services.ts`.

### Auth
- `POST /auth/login`
- `GET /auth/profile`
- `GET /auth/check`

### CRUD completo
- `/users`, `/roles`, `/permissions`
- `/breeds`, `/barns`, `/flocks`
- `/egg-types`, `/egg-inventory`
- `/supplies`, `/supply-categories`, `/measurement-units`
- `/supply-history`, `/supply-actions`
- `/alimentacion`, `/reports`

---

## 🎨 Diseño

- Paleta principal: `#39A900` (verde SENA)
- Tipografía: Work Sans
- Íconos: Font Awesome 6
- Responsive: sidebar colapsable en móvil
- Basado en el diseño HTML del archivo ZIP original

---

## ⚙️ Variables de entorno

Edita `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'   // ← Cambia si tu backend está en otro puerto
};
```
