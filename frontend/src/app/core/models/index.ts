// ===== AUTH MODELS =====
export interface LoginRequest {
  documento: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthProfile {
  id_usuario: string;
  nombre: string;
  numero_documento: string;
  roles: string[];
  permissions: string[];
}

// ===== USER MODEL =====
export interface User {
  id_usuario: string;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  activo: boolean;
  fecha_creacion?: string;
  ultimo_acceso?: string;
  usuarioRoles?: UserRole[];
  // Alias for frontend compatibility
  numero_documento?: string;
  estado?: boolean;
  roles?: Role[];
}

export interface UserRole {
  id_usuario_rol: number;
  id_usuario: string;
  id_rol: number;
  rol?: Role;
}

// ===== ROLE MODEL =====
export interface Role {
  id_rol: number;
  nombre: string;
  descripcion?: string;
  rolPermisos?: RolePermission[];
}

// ===== PERMISSION MODEL =====
export interface Permission {
  id?: number;
  id_permiso: number;
  nombre: string;
  descripcion?: string;
  recurso?: string;
  accion?: string;
}

export interface RolePermission {
  id_rol_permiso: number;
  id_rol: number;
  id_permiso: number;
  permiso?: Permission;
}

// ===== BREED MODEL =====
export interface Breed {
  id_raza: string;
  nombre: string;
  descripcion: string;
}

// ===== BARN MODEL =====
export interface Barn {
  id_galpon: string;
  codigo: string;
  nombre: string;
  capacidad_max_aves: number;
  longitud: number;
  area?: number;
  unidadMedida?: MeasurementUnit;
  createdAt?: string;
  updatedAt?: string;
}

// ===== FLOCK MODEL =====
export interface Flock {
  id_lote: string;
  nombre: string;
  total_aves: number;
  observacion: string;
  racion_alimento: string;
  estado: string;
  raza?: Breed;
  ubicacion?: FlockLocation[];
}

export interface FlockLocation {
  id_ubicacion_lote: string;
  galpon?: Barn;
  lote?: Flock;
}

// ===== EGG TYPE MODEL =====
export interface EggType {
  id_tipo: string;
  tipo: string;
  peso_min: number;
  peso_max: number;
}

// ===== EGG INVENTORY MODEL =====
export interface EggInventory {
  id_inventario_huevo: string;
  cantidad: number;
  tipo_huevo?: EggType;
  lote?: Flock;
  produccion?: unknown;
}

// ===== SUPPLY CATEGORY MODEL =====
export interface SupplyCategory {
  id_categoria_insumo: string;
  nombre_categoria: string;
}

// ===== MEASUREMENT UNIT MODEL =====
export interface MeasurementUnit {
  id_unidad_medida: string;
  nombre: string;
  abreviatura: string;
}

// ===== SUPPLY MODEL =====
export interface Supply {
  id_insumo: string;
  nombre: string;
  cantidad: number;
  fecha: string;
  id_categoria: number;
  id_unidad_medida: number;
  id_llamar_usuario: number;
  categoria?: SupplyCategory;
  unidadMedida?: MeasurementUnit;
}

// ===== SUPPLY HISTORY MODEL =====
export interface SupplyHistory {
  id_historial_insumo: string;
  id_insumos: string;
  id_historial_accion: number;
  cantidad: number;
  descripcion: string;
  fecha: string;
  insumo?: Supply;
  accion?: SupplyAction;
}

// ===== SUPPLY ACTION MODEL =====
export interface SupplyAction {
  id_accion_historial_movimiento: string;
  nombre: string;
}

// ===== FEEDING MODEL =====
export interface Feeding {
  id: number;
  fecha?: string;
  cantidad?: number;
  observacion?: string;
  lote?: Flock;
  insumo?: Supply;
}

// ===== REPORT MODEL =====
export interface Report {
  id_reporte: string;
  tipo_reporte: string;
  usuario?: User;
}

// ===== API RESPONSE =====
export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
}

// ===== PAGINATION =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
