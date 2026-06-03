export interface AuthenticatedUser {
  id_usuario: string;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  activo: boolean;
  roles: string[];
}