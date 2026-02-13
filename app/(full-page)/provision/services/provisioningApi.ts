/**
 * Servicio de API para el Sistema de Provisioning
 * Reutiliza la infraestructura existente de api-endpoints
 */

import axios from 'axios';
import { provisionTenant, validateTenant } from "@/app/api-endpoints/tenant";
import { LoginRequest, LoginResponse, TenantFormData, TenantResponse } from '../types';
import { devuelveBasePath } from '@/app/utility/Utils';

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

/**
 * Login de administrador para acceder al sistema de provisioning
 * NO usa tenant (login directo a base de datos matriz)
 * @param credentials - Email y password del admin
 * @returns Respuesta con token JWT y datos del usuario
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // Crear una instancia de axios sin interceptores para evitar el tenant
    const axiosInstance = axios.create({
      baseURL: devuelveBasePath()
    });

    const response = await axiosInstance.post('/auth/login', {
      mail: credentials.email,
      password: credentials.password
    });

    // Verificar si hay mensaje de error
    if (response.data.message && response.data.message !== 'Login successful') {
      throw new Error(response.data.message);
    }

    // Verificar que userData existe
    if (!response.data.userData || !response.data.accessToken) {
      throw new Error('Respuesta de login inválida');
    }

    // Formatear respuesta al formato esperado
    const loginResponse: LoginResponse = {
      token: response.data.accessToken || '',
      user: {
        id: response.data.userData.id || 0,
        nombre: response.data.userData.nombre || '',
        email: response.data.userData.mail || '',
        rolId: response.data.userData.rolId || 0,
        empresaId: response.data.userData.empresaId || 0
      }
    };

    return loginResponse;
  } catch (error: any) {
    console.error('Error en login de provisioning:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

// ============================================================================
// PROVISIONING DE TENANTS
// ============================================================================

/**
 * Crea un nuevo tenant con su base de datos y usuario admin
 * Usa el endpoint existente de provisioning
 * @param data - Datos completos del formulario de tenant
 * @returns Respuesta con detalles del tenant creado
 */
export const createTenant = async (data: TenantFormData): Promise<TenantResponse> => {
  try {
    const response = await provisionTenant(data);
    return response as TenantResponse;
  } catch (error) {
    console.error('Error al crear tenant:', error);
    throw error;
  }
};

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Verifica si un subdominio está disponible
 * Usa el endpoint existente de validación
 * @param subdomain - Subdominio a verificar
 * @returns True si está disponible, False si ya existe
 */
export const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
  try {
    const response = await validateTenant(subdomain);
    // El backend retorna { disponible: true/false }
    return (response as any).disponible || false;
  } catch (error) {
    // Si hay error, asumir que no está disponible por seguridad
    console.warn('No se pudo verificar disponibilidad del subdominio:', error);
    return false;
  }
};
