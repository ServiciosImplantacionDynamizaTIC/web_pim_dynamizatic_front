/**
 * Tipos TypeScript para el Sistema de Provisioning de Tenants
 * Documentación completa en: FRONTEND-PROVISIONING-PROMPT.md
 */

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rolId: number;
    empresaId: number;
  };
}

// ============================================================================
// VERIFICACIÓN DE PERMISOS
// ============================================================================

export interface PermissionCheckResponse {
  hasPermission: boolean;
  message: string;
  userInfo?: {
    email: string;
    rolId: number;
    empresaId: number;
    tenant: string;
  };
}

// ============================================================================
// FORMULARIO DE TENANT
// ============================================================================

export interface TenantFormData {
  // Sección 1: Datos de la Empresa
  empresaNombre: string;
  empresaCodigo: string;
  descripcion?: string;
  
  // Sección 2: Configuración del Subdominio
  subdominio: string;
  
  // Sección 3: Usuario Administrador del Tenant
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
  
  // Sección 4: Plan y Límites
  plan: 'basico' | 'profesional' | 'enterprise';
  maxProductos?: number;
  maxUsuarios?: number;
  
  // Sección 5: Configuración de Base de Datos (Avanzado - Opcional)
  dbHost?: string;
  dbUsuario?: string;
  dbPassword?: string;
  dbPuerto?: number;
  
  // Sección 6: Configuración de Interfaz (Opcional)
  tema?: string;
  escala?: number;
  tiempoInactividad?: number;
  temaRipple?: boolean;
  estiloInput?: string;
  modoMenu?: string;
  temaMenu?: string;
  esquemaColor?: string;
}

// ============================================================================
// RESPUESTAS DEL BACKEND
// ============================================================================

export interface TenantResponse {
  success: boolean;
  empresaId: number;
  subdominio: string;
  dbNombre: string;
  adminEmail: string;
  message: string;
}

export interface ApiError {
  statusCode: number;
  name: string;
  message: string;
}

// ============================================================================
// ESTADOS DE LA APLICACIÓN
// ============================================================================

export enum ProvisioningState {
  LOGIN = 'login',
  FORM = 'form',
  SUCCESS = 'success',
  LOADING = 'loading',
  ERROR = 'error'
}

// ============================================================================
// VALIDACIÓN DE PASSWORD
// ============================================================================

export interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
}

// ============================================================================
// CONFIGURACIÓN DE PLANES
// ============================================================================

export interface PlanConfig {
  name: string;
  value: 'basico' | 'profesional' | 'enterprise';
  description: string;
  maxProductos: number;
  maxUsuarios: number;
}

export const PLAN_CONFIGS: Record<'basico' | 'profesional' | 'enterprise', PlanConfig> = {
  basico: {
    name: 'Básico',
    value: 'basico',
    description: 'Hasta 1,000 productos, 5 usuarios',
    maxProductos: 1000,
    maxUsuarios: 5
  },
  profesional: {
    name: 'Profesional',
    value: 'profesional',
    description: 'Hasta 10,000 productos, 50 usuarios',
    maxProductos: 10000,
    maxUsuarios: 50
  },
  enterprise: {
    name: 'Empresarial',
    value: 'enterprise',
    description: 'Ilimitado',
    maxProductos: 999999,
    maxUsuarios: 999
  }
};

// ============================================================================
// TEMAS DISPONIBLES
// ============================================================================

export interface ThemeOption {
  name: string;
  value: string;
  color: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { name: 'Turquesa', value: 'teal', color: '#14B8A6' },
  { name: 'Azul', value: 'blue', color: '#3B82F6' },
  { name: 'Verde', value: 'green', color: '#10B981' },
  { name: 'Naranja', value: 'orange', color: '#F97316' },
  { name: 'Púrpura', value: 'purple', color: '#A855F7' }
];

// ============================================================================
// VALIDADORES
// ============================================================================

export const VALIDATORS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  empresaCodigo: /^[A-Z0-9-]{2,10}$/,
  subdominio: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
  password: {
    minLength: 8,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
  }
};
