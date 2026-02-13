/**
 * Hook para generar y gestionar passwords seguras
 */

import { useCallback } from 'react';
import { generateSecurePassword, copyToClipboard } from '../utils';

interface UsePasswordGeneratorReturn {
  /**
   * Genera una nueva password segura
   * @param length - Longitud de la password (por defecto 12)
   * @returns Password generada
   */
  generate: (length?: number) => string;
  
  /**
   * Genera y copia la password al portapapeles
   * @param length - Longitud de la password (por defecto 12)
   * @returns Password generada y resultado de la copia
   */
  generateAndCopy: (length?: number) => Promise<{ password: string; copied: boolean }>;
}

export const usePasswordGenerator = (): UsePasswordGeneratorReturn => {
  /**
   * Genera una password segura
   */
  const generate = useCallback((length: number = 12): string => {
    return generateSecurePassword(length);
  }, []);

  /**
   * Genera una password y la copia al portapapeles
   */
  const generateAndCopy = useCallback(async (length: number = 12) => {
    const password = generateSecurePassword(length);
    const copied = await copyToClipboard(password);
    
    return { password, copied };
  }, []);

  return {
    generate,
    generateAndCopy
  };
};
