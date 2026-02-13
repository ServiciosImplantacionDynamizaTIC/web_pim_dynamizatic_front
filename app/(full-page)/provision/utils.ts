/**
 * Utilidades y Validadores para el Sistema de Provisioning
 */

import { VALIDATORS, PasswordValidation } from './types';

// ============================================================================
// VALIDACIÓN DE PASSWORD
// ============================================================================

/**
 * Valida una contraseña según los criterios de seguridad
 * @param password - Password a validar
 * @returns Objeto con validación, fortaleza y errores
 */
export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  
  if (password.length < VALIDATORS.password.minLength) {
    errors.push(`Mínimo ${VALIDATORS.password.minLength} caracteres`);
  }
  if (!VALIDATORS.password.hasUpperCase.test(password)) {
    errors.push('Al menos 1 mayúscula');
  }
  if (!VALIDATORS.password.hasLowerCase.test(password)) {
    errors.push('Al menos 1 minúscula');
  }
  if (!VALIDATORS.password.hasNumber.test(password)) {
    errors.push('Al menos 1 número');
  }
  
  // Calcular fortaleza
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const score = 4 - errors.length;
  
  if (score >= 4 && VALIDATORS.password.hasSpecial.test(password)) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
};

// ============================================================================
// GENERADOR DE PASSWORDS SEGURAS
// ============================================================================

/**
 * Genera una contraseña aleatoria segura
 * @param length - Longitud de la contraseña (por defecto 12)
 * @returns Password generada
 */
export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Asegurar al menos un carácter de cada tipo
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Completar el resto de caracteres
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// ============================================================================
// COPIAR AL PORTAPAPELES
// ============================================================================

/**
 * Copia texto al portapapeles
 * @param text - Texto a copiar
 * @returns Promise<boolean> - True si se copió exitosamente
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        console.error('Alternativa: No se pudo copiar', err);
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
};

// ============================================================================
// VALIDADORES DE FORMATO
// ============================================================================

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATORS.email.test(email);
};

/**
 * Valida formato de código de empresa
 */
export const isValidEmpresaCodigo = (codigo: string): boolean => {
  return VALIDATORS.empresaCodigo.test(codigo);
};

/**
 * Valida formato de subdominio
 */
export const isValidSubdominio = (subdominio: string): boolean => {
  if (subdominio.length < 3) return false;
  return VALIDATORS.subdominio.test(subdominio);
};

// ============================================================================
// TRANSFORMADORES
// ============================================================================

/**
 * Convierte texto a mayúsculas y elimina espacios
 */
export const toEmpresaCodigo = (value: string): string => {
  return value.toUpperCase().replace(/\s+/g, '').slice(0, 10);
};

/**
 * Convierte texto a minúsculas y elimina espacios
 */
export const toSubdominio = (value: string): string => {
  return value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
};

// ============================================================================
// GENERADOR DE URL DE PREVIEW
// ============================================================================

/**
 * Genera la URL de preview del subdominio
 * @param subdominio - Subdominio ingresado
 * @param baseDomain - Dominio base (por defecto desde env)
 * @returns URL completa
 */
export const generateSubdomainPreview = (subdominio: string, baseDomain?: string): string => {
  const domain = baseDomain || process.env.NEXT_PUBLIC_BASE_DOMAIN || 'pim-dynamizatic.com';
  
  if (!subdominio || subdominio.trim() === '') {
    return `https://pim_[tu-subdominio].${domain}`;
  }
  
  return `https://pim_${subdominio}.${domain}`;
};

// ============================================================================
// SANITIZACIÓN DE INPUTS
// ============================================================================

/**
 * Sanitiza un string eliminando caracteres peligrosos
 */
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>'"]/g, '');
};

/**
 * Sanitiza todo el objeto de formulario
 */
export const sanitizeFormData = (data: any): any => {
  const sanitized: any = {};
  
  for (const key in data) {
    if (typeof data[key] === 'string') {
      sanitized[key] = sanitizeInput(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }
  
  return sanitized;
};

// ============================================================================
// FORMATEO DE ERRORES
// ============================================================================

/**
 * Extrae mensaje de error legible desde respuesta del backend
 */
export const extractErrorMessage = (error: any): string => {
  // Error de Axios con respuesta del servidor
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  // Error de Axios sin respuesta (problema de red)
  if (error.request && !error.response) {
    return 'No se pudo conectar con el servidor. Verifique su conexión.';
  }
  
  // Error genérico de JavaScript
  if (error.message) {
    return error.message;
  }
  
  return 'Ha ocurrido un error desconocido';
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Guarda el token de provisioning en sessionStorage
 */
export const saveProvisionToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('provision_token', token);
  }
};

/**
 * Obtiene el token de provisioning desde sessionStorage
 */
export const getProvisionToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('provision_token');
  }
  return null;
};

/**
 * Elimina el token de provisioning
 */
export const clearProvisionToken = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('provision_token');
    sessionStorage.removeItem('provision_user');
  }
};

/**
 * Guarda datos del usuario en sessionStorage
 */
export const saveProvisionUser = (user: any): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('provision_user', JSON.stringify(user));
  }
};

/**
 * Obtiene datos del usuario desde sessionStorage
 */
export const getProvisionUser = (): any | null => {
  if (typeof window !== 'undefined') {
    const user = sessionStorage.getItem('provision_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};
