/**
 * Página Principal de Provisioning de Tenants
 * Solo para administradores. El login ya se hizo en /auth/login
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProvisioningState, PermissionCheckResponse } from './types';
import { useProvisioning } from './hooks/useProvisioning';
import TenantForm from './components/TenantForm';
import MensajeExito from './components/MensajeExito';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';
import { Panel } from 'primereact/panel';
import { checkProvisioningPermissions } from '@/app/api-endpoints/tenant';

export default function ProvisioningPage() {
  const router = useRouter();
  const {
    state,
    error,
    tenantData,
    loading,
    createNewTenant,
    resetForm,
    logout,
    clearError
  } = useProvisioning();

  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState<string>('');
  const [userInfo, setUserInfo] = useState<PermissionCheckResponse['userInfo'] | null>(null);

  // Verificar autenticación y permisos al cargar la página
  useEffect(() => {
    const verificarPermisos = async () => {
      try {
        const response = await checkProvisioningPermissions();
        
        if (response.hasPermission) {
          setIsInitializing(false);
          document.body.style.cursor = 'default';
        } else {
          setPermissionMessage(response.message || 'No tienes permisos para crear tenants.');
          setUserInfo(response.userInfo || null);
          setShowAccessDenied(true);
          setIsInitializing(false);
          document.body.style.cursor = 'default';
        }
      } catch (error: any) {
        if (error.response) {
          if (error.response.status === 401) {
            document.body.style.cursor = 'default';
            router.push('/auth/login');
            return;
          } else if (error.response.status === 403) {
            const message = error.response.data?.message || 'No tienes permisos para crear tenants.';
            const info = error.response.data?.userInfo || null;
            setPermissionMessage(message);
            setUserInfo(info);
            setShowAccessDenied(true);
            setIsInitializing(false);
            document.body.style.cursor = 'default';
            return;
          }
        }
        
        document.body.style.cursor = 'default';
        router.push('/auth/login');
      }
    };

    verificarPermisos();
  }, [router]);

  // Guardar la password ingresada para mostrarla en el mensaje de éxito
  const [submittedPassword, setSubmittedPassword] = useState('');

  const handleTenantSubmit = async (formData: any) => {
    try {
      setSubmittedPassword(formData.adminPassword);
      await createNewTenant(formData);
    } catch (error: any) {
      // Verificar si es un error 403 (Sin permisos)
      if (error.response?.status === 403) {
        setShowAccessDenied(true);
      }
      // El error ya está manejado en useProvisioning
    }
  };

  const handleLogout = () => {
    router.push('/auth/login');
  };

  // Pantalla de inicialización/validación
  if (isInitializing || authError) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
        <div className="text-center">
          {authError ? (
            <>
              <Message severity="error" text={authError} className="mb-4" />
              <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </>
          ) : (
            <>
              <ProgressSpinner style={{ width: '50px', height: '50px' }} />
              <p className="text-600 mt-3">Validando permisos...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: 'var(--surface-ground)',
      overflow: 'auto'
    }}>
      {/* Pantalla de Acceso Denegado */}
      {showAccessDenied && (
        <div className="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
          <Card className="shadow-2" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="text-center mb-4">
              <i className="pi pi-lock text-red-500 mb-3" style={{ fontSize: '4rem' }}></i>
              <h2 className="text-900 mb-3">Acceso Denegado</h2>
              <Message 
                severity="error" 
                text={permissionMessage} 
                className="mb-4 text-left"
                style={{ display: 'block' }}
              />
            </div>

            {userInfo && (
              <Panel header="Tu información actual" className="mb-4" toggleable>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <p className="text-600 mb-1">Email:</p>
                    <p className="text-900 font-semibold">{userInfo.email}</p>
                  </div>
                  <div className="col-12 md:col-6">
                    <p className="text-600 mb-1">Tenant:</p>
                    <p className="text-900 font-semibold">{userInfo.tenant}</p>
                  </div>
                  <div className="col-12 md:col-6">
                    <p className="text-600 mb-1">Rol ID:</p>
                    <p className="text-900 font-semibold">{userInfo.rolId}</p>
                  </div>
                  <div className="col-12 md:col-6">
                    <p className="text-600 mb-1">Empresa ID:</p>
                    <p className="text-900 font-semibold">{userInfo.empresaId}</p>
                  </div>
                </div>
              </Panel>
            )}

            <p className="text-600 text-center mb-4 line-height-3">
              Si crees que deberías tener acceso, contacta con el administrador de Dynamizatic.
            </p>

            <div className="flex gap-3 justify-content-center flex-wrap">
              <Button 
                label="Volver al Dashboard" 
                icon="pi pi-home"
                onClick={() => router.push('/')}
                className="p-button-outlined"
              />
              <Button 
                label="Cerrar Sesión" 
                icon="pi pi-sign-out"
                onClick={handleLogout}
                severity="secondary"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Formulario de Tenant */}
      {!showAccessDenied && state === ProvisioningState.FORM && (
        <div className="w-full min-h-screen surface-ground p-0 m-0">
          <TenantForm
            onSubmit={handleTenantSubmit}
            onCancel={handleLogout}
            loading={loading}
            error={error}
          />
        </div>
      )}

      {/* Mensaje de Éxito */}
      {state === ProvisioningState.SUCCESS && tenantData && (
        <MensajeExito
          tenantData={tenantData}
          adminPassword={submittedPassword}
          onCreateAnother={resetForm}
          onLogout={handleLogout}
        />
      )}

      {/* Loading overlay cuando está creando el tenant */}
      {state === ProvisioningState.LOADING && (
        <div className="fixed top-0 left-0 w-full h-full flex align-items-center justify-content-center bg-black-alpha-50 z-5">
          <div className="surface-card p-5 border-round shadow-2 text-center">
            <i className="pi pi-spin pi-spinner text-primary" style={{ fontSize: '3rem' }}></i>
            <h3 className="text-900 mt-3 mb-2">Creando Tenant...</h3>
            <p className="text-600 m-0">
              Esto puede tardar unos segundos mientras se crea la base de datos y el usuario administrador.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

