/**
 * Formulario de Login para Administradores
 * Estado 1: Autenticación para acceder al sistema de provisioning
 */

'use client';

import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { classNames } from 'primereact/utils';
import { LoginRequest } from '../types';
import { isValidEmail } from '../utils';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validaciones
  const emailError = emailTouched && (!email || !isValidEmail(email));
  const passwordError = passwordTouched && (!password || password.length < 6);
  const isFormValid = email && isValidEmail(email) && password && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isFormValid) {
      return;
    }

    await onLogin(email, password);
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen surface-ground px-4">
      <div className="w-full" style={{ maxWidth: '450px' }}>
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="text-900 text-4xl font-bold mb-2">
            Sistema de Provisioning
          </div>
          <p className="text-600 text-lg">Dynamizatic PIM</p>
        </div>

        {/* Card del formulario */}
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-900 font-medium mb-2 text-center">
                Acceso Administradores
              </h3>
              <p className="text-600 text-sm text-center mb-4">
                Ingrese sus credenciales para acceder al sistema de provisioning de tenants
              </p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <Message 
                severity="error" 
                text={error}
                className="w-full mb-4"
              />
            )}

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-900 font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="admin@dynamizatic.com"
                className={classNames('w-full', {
                  'p-invalid': emailError
                })}
                disabled={loading}
                autoComplete="email"
              />
              {emailError && (
                <small className="p-error block mt-1">
                  {!email ? 'El email es requerido' : 'Email inválido'}
                </small>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-900 font-medium mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                placeholder="••••••••"
                className="w-full"
                inputClassName={classNames('w-full', {
                  'p-invalid': passwordError
                })}
                toggleMask
                feedback={false}
                disabled={loading}
                autoComplete="current-password"
              />
              {passwordError && (
                <small className="p-error block mt-1">
                  {!password ? 'La contraseña es requerida' : 'Mínimo 6 caracteres'}
                </small>
              )}
            </div>

            {/* Botón de submit */}
            <Button
              type="submit"
              label={loading ? 'Verificando...' : 'Acceder al Provisioning'}
              icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
              className="w-full"
              size="large"
              disabled={loading || !isFormValid}
            />

            {/* Información adicional */}
            <div className="mt-4 text-center">
              <small className="text-600">
                Solo administradores tienen acceso a este sistema
              </small>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4">
          <small className="text-500">
            © 2026 Dynamizatic. Sistema de Provisioning Multi-Tenant
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
