/**
 * Utilidades para gestión de tenants en sistema multi-tenant
 *
 * Arquitectura:
 * - Producción: pim_zara.pim_dynamizatic.com → tenant: "pim_zara"
 * - Desarrollo con subdominio: pim_zara.localhost → tenant: "pim_zara"
 * - Desarrollo sin subdominio: localhost → tenant: "localhost"
 */

const CLAVE_ALMACENAMIENTO_TENANT = 'tenant';
const DOMINIO_BASE = 'pim_dynamizatic.com';

/**
 * Extrae el tenant (subdominio) de la URL actual
 *
 * @returns {string} El nombre del tenant
 *
 * @example
 * // URL: pim_zara.pim_dynamizatic.com (producción)
 * obtenerTenantDesdeUrl() // → "pim_zara"
 *
 * @example
 * // URL: pim_zara.localhost:3000 (desarrollo con subdominio)
 * obtenerTenantDesdeUrl() // → "pim_zara"
 *
 * @example
 * // URL: localhost:3000 (desarrollo sin subdominio)
 * obtenerTenantDesdeUrl() // → "localhost"
 */
export const obtenerTenantDesdeUrl = (): string => {
  // 🧪 PRUEBA: Descomentar para forzar error y probar página de error
  // return '';

  // En entorno del navegador
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Caso 1: localhost sin subdominio (desarrollo)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Intenta leer de localStorage primero
      const tenantGuardado = cargarTenantDesdeLocalStorage();
      return tenantGuardado || 'localhost';
    }

    // Caso 2: Subdominio con localhost (desarrollo)
    // Ejemplo: pim_zara.localhost → ["pim_zara", "localhost"]
    const partes = hostname.split('.');

    if (partes.length === 2 && partes[1] === 'localhost') {
      return partes[0]; // Retorna el subdominio (pim_zara)
    }

    // Caso 3: Producción con subdominio
    // Ejemplo: pim_zara.pim_dynamizatic.com → ["pim_zara", "pim_dynamizatic", "com"]
    if (partes.length > 2) {
      return partes[0]; // Retorna el subdominio (pim_zara)
    }

    // Caso 4: Dominio sin subdominio (pim_dynamizatic.com)
    // Este caso se maneja en el componente mostrando error
    return '';
  }

  // En servidor (SSR) retornamos vacío, se resolverá en cliente
  return '';
};

/**
 * Guarda el tenant actual en localStorage
 * Útil para desarrollo local
 *
 * @param {string} tenant - Nombre del tenant a guardar
 */
export const guardarTenantEnLocalStorage = (tenant: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO_TENANT, tenant);
    } catch (error) {
      console.error('Error guardando tenant en localStorage:', error);
    }
  }
};

/**
 * Carga el tenant desde localStorage
 * Usado principalmente en desarrollo local
 *
 * @returns {string | null} El tenant guardado o null si no existe
 */
export const cargarTenantDesdeLocalStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(CLAVE_ALMACENAMIENTO_TENANT);
    } catch (error) {
      console.error('Error leyendo tenant de localStorage:', error);
      return null;
    }
  }
  return null;
};

/**
 * Valida si un tenant es válido
 * Un tenant válido no puede estar vacío
 *
 * @param {string} tenant - Tenant a validar
 * @returns {boolean} true si es válido
 */
export const esTenantValido = (tenant: string): boolean => {
  return tenant !== null && tenant !== undefined && tenant.trim() !== '';
};

/**
 * Obtiene el tenant actual con validación
 * Si no es válido, retorna null
 *
 * @returns {string | null} Tenant válido o null
 */
export const obtenerTenantActual = (): string | null => {
  const tenant = obtenerTenantDesdeUrl();
  return esTenantValido(tenant) ? tenant : null;
};

/**
 * Limpia los datos del tenant de localStorage
 * Útil al hacer logout
 */
export const limpiarTenantDeLocalStorage = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CLAVE_ALMACENAMIENTO_TENANT);
    } catch (error) {
      console.error('Error limpiando tenant de localStorage:', error);
    }
  }
};

/**
 * Obtiene la URL base del dominio sin subdominio
 * @returns {string} URL del dominio base
 */
export const obtenerUrlDominioBase = (): string => {
  if (typeof window !== 'undefined') {
    const protocolo = window.location.protocol;
    return `${protocolo}//${DOMINIO_BASE}`;
  }
  return `https://${DOMINIO_BASE}`;
};

// Exports de compatibilidad con nombres en inglés (mantener por si se usan en otros archivos)
export const getTenantFromUrl = obtenerTenantDesdeUrl;
export const saveTenantToLocalStorage = guardarTenantEnLocalStorage;
export const loadTenantFromLocalStorage = cargarTenantDesdeLocalStorage;
export const isValidTenant = esTenantValido;
export const getCurrentTenant = obtenerTenantActual;
export const clearTenantFromLocalStorage = limpiarTenantDeLocalStorage;
export const getBaseDomainUrl = obtenerUrlDominioBase;
