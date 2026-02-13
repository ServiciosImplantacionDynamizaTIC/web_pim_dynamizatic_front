/**
 * Componente para mostrar la fortaleza de una contraseña
 * Muestra barra de progreso con colores y lista de requisitos
 */

import React from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { validatePassword } from '../utils';
import { classNames } from 'primereact/utils';

interface IndicadorFuerzaPasswordProps {
  password: string;
  showRequirements?: boolean;
}

export const IndicadorFuerzaPassword: React.FC<IndicadorFuerzaPasswordProps> = ({ 
  password,
  showRequirements = true 
}) => {
  const validation = validatePassword(password);
  
  // No mostrar nada si no hay password
  if (!password || password.length === 0) {
    return null;
  }

  // Calcular porcentaje para la barra
  const getStrengthPercentage = () => {
    switch (validation.strength) {
      case 'weak':
        return 33;
      case 'medium':
        return 66;
      case 'strong':
        return 100;
      default:
        return 0;
    }
  };

  // Color según fortaleza
  const getStrengthColor = () => {
    switch (validation.strength) {
      case 'weak':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'strong':
        return 'success';
      default:
        return 'info';
    }
  };

  // Texto según fortaleza
  const getStrengthText = () => {
    switch (validation.strength) {
      case 'weak':
        return 'Débil';
      case 'medium':
        return 'Media';
      case 'strong':
        return 'Fuerte';
      default:
        return '';
    }
  };

  return (
    <div className="mt-2">
      {/* Barra de fortaleza */}
      <div className="mb-2">
        <div className="flex align-items-center justify-content-between mb-1">
          <small className="text-600">Fortaleza de la contraseña:</small>
          <small 
            className={classNames('font-bold', {
              'text-red-500': validation.strength === 'weak',
              'text-orange-500': validation.strength === 'medium',
              'text-green-500': validation.strength === 'strong'
            })}
          >
            {getStrengthText()}
          </small>
        </div>
        <ProgressBar 
          value={getStrengthPercentage()} 
          showValue={false}
          style={{ height: '6px' }}
          color={
            validation.strength === 'weak' ? '#ef4444' :
            validation.strength === 'medium' ? '#f97316' :
            '#10b981'
          }
        />
      </div>

      {/* Lista de requisitos */}
      {showRequirements && (
        <div className="mt-2">
          <small className="text-600">Requisitos:</small>
          <ul className="mt-1 mb-0 pl-3" style={{ fontSize: '0.875rem' }}>
            <li className={validation.errors.includes('Mínimo 8 caracteres') ? 'text-red-500' : 'text-green-500'}>
              <i className={classNames('pi mr-1', {
                'pi-times': validation.errors.includes('Mínimo 8 caracteres'),
                'pi-check': !validation.errors.includes('Mínimo 8 caracteres')
              })} />
              Mínimo 8 caracteres
            </li>
            <li className={validation.errors.includes('Al menos 1 mayúscula') ? 'text-red-500' : 'text-green-500'}>
              <i className={classNames('pi mr-1', {
                'pi-times': validation.errors.includes('Al menos 1 mayúscula'),
                'pi-check': !validation.errors.includes('Al menos 1 mayúscula')
              })} />
              Al menos 1 mayúscula
            </li>
            <li className={validation.errors.includes('Al menos 1 minúscula') ? 'text-red-500' : 'text-green-500'}>
              <i className={classNames('pi mr-1', {
                'pi-times': validation.errors.includes('Al menos 1 minúscula'),
                'pi-check': !validation.errors.includes('Al menos 1 minúscula')
              })} />
              Al menos 1 minúscula
            </li>
            <li className={validation.errors.includes('Al menos 1 número') ? 'text-red-500' : 'text-green-500'}>
              <i className={classNames('pi mr-1', {
                'pi-times': validation.errors.includes('Al menos 1 número'),
                'pi-check': !validation.errors.includes('Al menos 1 número')
              })} />
              Al menos 1 número
            </li>
            <li className={password.match(/[!@#$%^&*(),.?":{}|<>]/) ? 'text-green-500' : 'text-600'}>
              <i className={classNames('pi mr-1', {
                'pi-check': password.match(/[!@#$%^&*(),.?":{}|<>]/),
                'pi-minus': !password.match(/[!@#$%^&*(),.?":{}|<>]/)
              })} />
              Al menos 1 carácter especial (recomendado)
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default IndicadorFuerzaPassword;
