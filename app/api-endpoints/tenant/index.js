import { TenantControllerApi, settings } from "@/app/api-programa";

const apiTenant = new TenantControllerApi(settings);

/**
 * Provisiona un nuevo tenant (crea la base de datos, ejecuta el script SQL y crea el usuario admin)
 * @param {object} provisionData - Datos para el aprovisionamiento
 * @param {string} provisionData.empresaNombre - Nombre de la empresa
 * @param {string} provisionData.empresaCodigo - Código de la empresa (ID)
 * @param {string} provisionData.subdominio - Subdominio único
 * @param {string} provisionData.plan - Plan de suscripción (basico, profesional, enterprise)
 * @param {string} provisionData.adminNombre - Nombre del administrador
 * @param {string} provisionData.adminEmail - Email del administrador
 * @param {string} provisionData.adminPassword - Contraseña del administrador
 * @param {string} [provisionData.dbHost] - Host de la base de datos (opcional)
 * @param {string} [provisionData.dbUsuario] - Usuario de la base de datos (opcional)
 * @param {string} [provisionData.dbPassword] - Contraseña de la base de datos (opcional)
 * @param {number} [provisionData.dbPuerto] - Puerto de la base de datos (opcional)
 * @returns {Promise<object>} Resultado del aprovisionamiento
 */
export const provisionTenant = async (provisionData) => {
    try {
        // El header X-Tenant se añade automáticamente por el interceptor de axios
        // (ver app/core/auth/jwt/jwtService.js línea 37-40)
        const { data } = await apiTenant.tenantControllerProvisionTenant(provisionData);
        return data;
    } catch (error) {
        console.error('Error al provisionar tenant:', error);
        throw error;
    }
};

/**
 * Valida si un subdominio está disponible
 * @param {string} subdominio - Subdominio a validar
 * @returns {Promise<object>} Resultado de la validación
 */
export const validateTenant = async (subdominio) => {
    try {
        const { data } = await apiTenant.tenantControllerValidateTenant(subdominio);
        return data;
    } catch (error) {
        console.error('Error al validar tenant:', error);
        throw error;
    }
};

/**
 * Verifica si el usuario actual tiene permisos para crear tenants
 * @returns {Promise<object>} Objeto con hasPermission, message y userInfo
 */
export const checkProvisioningPermissions = async () => {
    try {
        // Primero verificar si hay token
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        
        if (!token) {
            // Simular un error 401
            const error = new Error('No authenticated');
            error.response = { status: 401 };
            throw error;
        }
        
        const { data } = await apiTenant.tenantControllerCheckPermissions();
        return data;
    } catch (error) {
        throw error;
    }
};
