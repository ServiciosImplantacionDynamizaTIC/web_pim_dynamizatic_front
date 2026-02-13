'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';

/**
 * Página de error cuando no se puede determinar el tenant
 * Se muestra cuando:
 * - Se accede al dominio base sin subdominio (pim_dynamizatic.com)
 * - El tenant detectado no es válido
 */
export default function TenantErrorPage() {
  const [baseDomain, setBaseDomain] = useState('pim_dynamizatic.com');
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Obtener dominio solo en el cliente para evitar error de hidratación
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setBaseDomain(hostname);
      setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1');
    }
  }, []);

  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      <div className="flex flex-column align-items-center justify-content-center">
        <div
          style={{
            borderRadius: '56px',
            padding: '0.3rem',
            background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
          }}
        >
          <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
            <div className="text-center mb-5">
              <div className="text-900 text-3xl font-medium mb-3">URL no válida</div>
              <span className="text-600 font-medium">No se pudo identificar tu empresa</span>
            </div>

            <div className="mb-5">
              <Card className="surface-100 border-round p-3">
                <div className="flex align-items-start mb-3">
                  <i className="pi pi-info-circle text-primary text-2xl mr-3"></i>
                  <div>
                    <div className="font-medium text-900 mb-2">¿Cómo acceder correctamente?</div>
                    <p className="text-600 line-height-3 mt-0 mb-3">
                      Debes acceder usando el subdominio de tu empresa. Por ejemplo:
                    </p>
                    <div className="bg-primary-reverse border-round p-3 font-medium text-primary">
                      <i className="pi pi-check-circle mr-2"></i>
                      {isLocalhost ? 'tu-empresa.localhost' : 'tu-empresa.pim_dynamizatic.com'}
                    </div>
                  </div>
                </div>

                <div className="flex align-items-start">
                  <i className="pi pi-exclamation-triangle text-orange-500 text-2xl mr-3"></i>
                  <div>
                    <div className="font-medium text-900 mb-2">URL incorrecta</div>
                    <p className="text-600 line-height-3 mt-0 mb-3">
                      No puedes acceder directamente a:
                    </p>
                    <div className="bg-red-50 border-round p-3 font-medium text-red-600">
                      <i className="pi pi-times-circle mr-2"></i>
                      {baseDomain}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-600 line-height-3 mb-4">
                Si no conoces el subdominio de tu empresa, contacta con tu administrador.
              </p>

              <Button
                label="Más información"
                icon="pi pi-question-circle"
                className="w-full"
                onClick={() => window.open('mailto:soporte@pim_dynamizatic.com', '_blank')}
              />
            </div>

            <div className="mt-5 text-center">
              <span className="text-500 text-sm">
                ¿Eres administrador?{' '}
                <a
                  href="mailto:soporte@pim_dynamizatic.com"
                  className="font-medium no-underline text-primary cursor-pointer"
                >
                  Contacta con soporte
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
