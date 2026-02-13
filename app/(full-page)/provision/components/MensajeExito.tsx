/**
 * Mensaje de Éxito después de crear un tenant
 * Estado 3: Muestra detalles del tenant creado y opciones de continuar
 */

'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { TenantResponse } from '../types';
import { copyToClipboard } from '../utils';

interface MensajeExitoProps {
  tenantData: TenantResponse;
  adminPassword: string; // Password que se ingresó en el formulario
  onCreateAnother: () => void;
  onLogout: () => void;
}

export const MensajeExito: React.FC<MensajeExitoProps> = ({
  tenantData,
  adminPassword,
  onCreateAnother,
  onLogout
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'pim-dynamizatic.com';
  const tenantUrl = `https://pim_${tenantData.subdominio}.${baseDomain}`;

  const handleCopy = async (text: string, item: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen surface-ground px-4 py-6">
      <div className="w-full" style={{ maxWidth: '700px' }}>
        {/* Encabezado de éxito */}
        <div className="text-center mb-5">
          <div className="inline-flex align-items-center justify-content-center bg-green-100 border-circle mb-3"
               style={{ width: '80px', height: '80px' }}>
            <i className="pi pi-check text-green-500" style={{ fontSize: '3rem' }}></i>
          </div>
          <h1 className="text-900 text-4xl font-bold mb-2">
            ¡Tenant Creado Exitosamente!
          </h1>
          <p className="text-600 text-lg">
            El tenant se ha provisionado correctamente con su base de datos y usuario administrador
          </p>
        </div>

        {/* Tarjeta de detalles del tenant */}
        <Card className="mb-4">
          <h3 className="text-900 font-medium mb-3 flex align-items-center">
            <i className="pi pi-building mr-2 text-primary"></i>
            Detalles del Tenant
          </h3>
          
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="mb-3">
                <label className="text-600 text-sm font-medium">Empresa</label>
                <div className="text-900 font-bold">{tenantData.message || 'N/A'}</div>
              </div>
            </div>
            
            <div className="col-12 md:col-6">
              <div className="mb-3">
                <label className="text-600 text-sm font-medium">ID Empresa</label>
                <div className="text-900 font-bold">{tenantData.empresaId}</div>
              </div>
            </div>

            <div className="col-12 md:col-6">
              <div className="mb-3">
                <label className="text-600 text-sm font-medium">Subdominio</label>
                <div className="text-900 font-bold">{tenantData.subdominio}</div>
              </div>
            </div>

            <div className="col-12 md:col-6">
              <div className="mb-3">
                <label className="text-600 text-sm font-medium">Base de Datos</label>
                <div className="text-900 font-bold">{tenantData.dbNombre}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tarjeta de acceso */}
        <Card className="mb-4">
          <h3 className="text-900 font-medium mb-3 flex align-items-center">
            <i className="pi pi-key mr-2 text-primary"></i>
            Credenciales de Acceso del Administrador
          </h3>

          {/* URL de acceso */}
          <div className="mb-3">
            <label className="text-600 text-sm font-medium block mb-2">URL de Acceso</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 surface-100 border-round">
                <a 
                  href={tenantUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-medium no-underline hover:underline"
                >
                  {tenantUrl}
                </a>
              </div>
              <Button
                icon={copiedItem === 'url' ? 'pi pi-check' : 'pi pi-copy'}
                severity={copiedItem === 'url' ? 'success' : 'secondary'}
                onClick={() => handleCopy(tenantUrl, 'url')}
                tooltip="Copiar URL"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="text-600 text-sm font-medium block mb-2">Email del Administrador</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 surface-100 border-round">
                <span className="text-900 font-medium">{tenantData.adminEmail}</span>
              </div>
              <Button
                icon={copiedItem === 'email' ? 'pi pi-check' : 'pi pi-copy'}
                severity={copiedItem === 'email' ? 'success' : 'secondary'}
                onClick={() => handleCopy(tenantData.adminEmail, 'email')}
                tooltip="Copiar Email"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="text-600 text-sm font-medium block mb-2">Contraseña Inicial</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 surface-100 border-round">
                <span className="text-900 font-medium font-mono">
                  {showPassword ? adminPassword : '••••••••••••'}
                </span>
              </div>
              <Button
                icon={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
                severity="secondary"
                onClick={() => setShowPassword(!showPassword)}
                tooltip={showPassword ? 'Ocultar' : 'Mostrar'}
                tooltipOptions={{ position: 'top' }}
              />
              <Button
                icon={copiedItem === 'password' ? 'pi pi-check' : 'pi pi-copy'}
                severity={copiedItem === 'password' ? 'success' : 'secondary'}
                onClick={() => handleCopy(adminPassword, 'password')}
                tooltip="Copiar Contraseña"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          </div>

          <Divider />

          {/* Mensaje sobre el email */}
          <Message 
            severity="info"
            text={
              <span>
                <i className="pi pi-envelope mr-2"></i>
                Se ha enviado un email con estas credenciales a <strong>{tenantData.adminEmail}</strong>
              </span>
            }
            className="w-full"
          />

          {/* Advertencia de seguridad */}
          <Message 
            severity="warn"
            text="Recomendamos que el administrador cambie esta contraseña en su primer acceso al sistema."
            className="w-full mt-3"
          />
        </Card>

        {/* Botones de acción */}
        <div className="flex flex-column md:flex-row gap-3">
          <Button
            label="Crear Otro Tenant"
            icon="pi pi-plus"
            className="flex-1"
            size="large"
            onClick={onCreateAnother}
          />
          <Button
            label="Cerrar Sesión"
            icon="pi pi-sign-out"
            severity="secondary"
            className="flex-1"
            size="large"
            onClick={onLogout}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-5">
          <small className="text-500">
            El tenant está listo para ser utilizado. El administrador puede acceder inmediatamente con las credenciales proporcionadas.
          </small>
        </div>
      </div>
    </div>
  );
};

export default MensajeExito;
