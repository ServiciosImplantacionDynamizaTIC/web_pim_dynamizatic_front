/**
 * Hook personalizado para gestionar el flujo de provisioning de tenants
 * Ya NO maneja login (se hace en /auth/login)
 */

import { useState, useCallback } from 'react';
import { TenantFormData, TenantResponse, ProvisioningState } from '../types';
import { createTenant } from '../services/provisioningApi';
import { 
  clearProvisionToken,
  extractErrorMessage 
} from '../utils';

interface UseProvisioningReturn {
  // Estados
  state: ProvisioningState;
  error: string | null;
  tenantData: TenantResponse | null;
  loading: boolean;
  
  // Funciones
  createNewTenant: (data: TenantFormData) => Promise<TenantResponse>;
  resetForm: () => void;
  logout: () => void;
  clearError: () => void;
}

export const useProvisioning = (): UseProvisioningReturn => {
  // Empezar directamente en FORM (ya no hay LOGIN)
  const [state, setState] = useState<ProvisioningState>(ProvisioningState.FORM);
  const [error, setError] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<TenantResponse | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Crea un nuevo tenant
   */
  const createNewTenant = useCallback(async (data: TenantFormData): Promise<TenantResponse> => {
    setLoading(true);
    setError(null);
    setState(ProvisioningState.LOADING);
    
    try {
      const response = await createTenant(data);
      
      setTenantData(response);
      setState(ProvisioningState.SUCCESS);
      
      return response;
    } catch (err: any) {
      // Manejo específico de errores HTTP
      let errorMessage: string;
      
      if (err.response) {
        const status = err.response.status;
        const backendMessage = err.response.data?.error?.message || err.response.data?.message;
        
        switch (status) {
          case 401:
            errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
            // Limpiar sesión y redirigir después de un momento
            setTimeout(() => {
              sessionStorage.clear();
              window.location.href = '/auth/login';
            }, 3000);
            break;
            
          case 403:
            errorMessage = backendMessage || 
              'No tienes permisos para crear tenants. Esta acción está restringida a usuarios autorizados de Dynamizatic.';
            break;
            
          case 409:
            errorMessage = backendMessage || 
              'El subdominio ya existe. Por favor, elige otro nombre.';
            break;
            
          case 422:
            errorMessage = backendMessage || 
              'Los datos del formulario son inválidos. Revisa los campos e intenta nuevamente.';
            break;
            
          case 500:
            errorMessage = backendMessage || 
              'Error en el servidor al crear el tenant. Por favor, contacta al administrador del sistema.';
            break;
            
          default:
            errorMessage = backendMessage || 
              `Error al crear tenant (código ${status}). Intenta nuevamente.`;
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        errorMessage = err.message || 'Error desconocido al crear tenant.';
      }
      
      setError(errorMessage);
      setState(ProvisioningState.FORM);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Resetea el formulario para crear otro tenant
   */
  const resetForm = useCallback(() => {
    setTenantData(null);
    setError(null);
    setState(ProvisioningState.FORM);
  }, []);

  /**
   * Cierra sesión y limpia datos
   */
  const logout = useCallback(() => {
    clearProvisionToken();
    setTenantData(null);
    setError(null);
    setState(ProvisioningState.FORM);
  }, []);

  /**
   * Limpia el mensaje de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    error,
    tenantData,
    loading,
    createNewTenant,
    resetForm,
    logout,
    clearError
  };
};
