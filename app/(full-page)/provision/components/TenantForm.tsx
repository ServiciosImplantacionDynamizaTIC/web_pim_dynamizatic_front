/**
 * Formulario Completo de Creación de Tenant
 * Estado 2: Formulario con 6 secciones para provisionar un nuevo tenant
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { Slider } from 'primereact/slider';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { TenantFormData, PLAN_CONFIGS, THEME_OPTIONS } from '../types';
import { 
  isValidEmail, 
  isValidEmpresaCodigo, 
  isValidSubdominio,
  toEmpresaCodigo,
  toSubdominio,
  generateSubdomainPreview,
  validatePassword,
  copyToClipboard
} from '../utils';
import { usePasswordGenerator } from '../hooks/usePasswordGenerator';
import IndicadorFuerzaPassword from './IndicadorFuerzaPassword';

interface TenantFormProps {
  onSubmit: (data: TenantFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export const TenantForm: React.FC<TenantFormProps> = ({ 
  onSubmit, 
  onCancel, 
  loading,
  error 
}) => {
  const toast = useRef<Toast>(null);
  const errorMessageRef = useRef<HTMLDivElement>(null);
  const { generateAndCopy } = usePasswordGenerator();
  
  // Estado del formulario
  const [formData, setFormData] = useState<TenantFormData>({
    empresaNombre: '',
    empresaCodigo: '',
    descripcion: '',
    subdominio: '',
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'profesional',
    maxProductos: PLAN_CONFIGS.profesional.maxProductos,
    maxUsuarios: PLAN_CONFIGS.profesional.maxUsuarios,
    tema: 'teal',
    escala: 14,
    tiempoInactividad: 30,
    temaRipple: false,
    estiloInput: 'outlined',
    modoMenu: 'static',
    temaMenu: 'colorScheme',
    esquemaColor: 'light'
  });

  // Estado de validación
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Actualizar límites cuando cambia el plan
  useEffect(() => {
    const planConfig = PLAN_CONFIGS[formData.plan];
    setFormData(prev => ({
      ...prev,
      maxProductos: planConfig.maxProductos,
      maxUsuarios: planConfig.maxUsuarios
    }));
  }, [formData.plan]);

  // Mostrar error en toast y hacer scroll
  useEffect(() => {
    if (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error al crear tenant',
        detail: error,
        life: 8000,
        sticky: false
      });
      
      // Scroll al mensaje de error
      errorMessageRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [error]);

  // Handlers
  const handleInputChange = (field: keyof TenantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleEmpresaCodigoChange = (value: string) => {
    const transformed = toEmpresaCodigo(value);
    handleInputChange('empresaCodigo', transformed);
    
    // Auto-generar subdominio si está vacío
    if (!formData.subdominio && transformed) {
      handleInputChange('subdominio', toSubdominio(transformed));
    }
  };

  const handleSubdominioChange = (value: string) => {
    const transformed = toSubdominio(value);
    handleInputChange('subdominio', transformed);
  };

  const handleGeneratePassword = async () => {
    const result = await generateAndCopy();
    handleInputChange('adminPassword', result.password);
    
    if (result.copied) {
      toast.current?.show({
        severity: 'success',
        summary: 'Contraseña Generada',
        detail: 'La contraseña ha sido copiada al portapapeles',
        life: 3000
      });
    }
  };

  // Validaciones
  const errors = {
    empresaNombre: touched.empresaNombre && (!formData.empresaNombre || formData.empresaNombre.length < 3),
    empresaCodigo: touched.empresaCodigo && !isValidEmpresaCodigo(formData.empresaCodigo),
    subdominio: touched.subdominio && !isValidSubdominio(formData.subdominio),
    adminNombre: touched.adminNombre && (!formData.adminNombre || formData.adminNombre.length < 3),
    adminEmail: touched.adminEmail && !isValidEmail(formData.adminEmail),
    adminPassword: touched.adminPassword && !validatePassword(formData.adminPassword).isValid
  };

  const isFormValid = 
    formData.empresaNombre.length >= 3 &&
    isValidEmpresaCodigo(formData.empresaCodigo) &&
    isValidSubdominio(formData.subdominio) &&
    formData.adminNombre.length >= 3 &&
    isValidEmail(formData.adminEmail) &&
    validatePassword(formData.adminPassword).isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    setTouched({
      empresaNombre: true,
      empresaCodigo: true,
      subdominio: true,
      adminNombre: true,
      adminEmail: true,
      adminPassword: true
    });

    if (!isFormValid) {
      toast.current?.show({
        severity: 'error',
        summary: 'Formulario Incompleto',
        detail: 'Por favor, complete todos los campos requeridos correctamente',
        life: 4000
      });
      return;
    }

    await onSubmit(formData);
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog
        visible={showCancelDialog}
        onHide={() => setShowCancelDialog(false)}
        message="¿Está seguro? Se perderán todos los datos ingresados."
        header="Confirmar Cancelación"
        icon="pi pi-exclamation-triangle"
        accept={confirmCancel}
        reject={() => setShowCancelDialog(false)}
        acceptLabel="Sí, cancelar"
        rejectLabel="No, continuar"
        acceptClassName="p-button-danger"
      />

      <div className="surface-ground px-4 py-6 min-h-screen">
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          {/* Encabezado */}
          <div className="mb-5">
            <h1 className="text-900 text-4xl font-bold mb-2">Crear Nuevo Tenant</h1>
            <p className="text-600 text-lg">
              Complete los datos para provisionar un nuevo cliente en el sistema
            </p>
          </div>

          {/* Mensaje de error general */}
          {error && (
            <div ref={errorMessageRef}>
              <Message 
                severity="error" 
                text={error}
                className="w-full mb-4"
                style={{ fontSize: '1rem' }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* SECCIÓN 1: Datos de la Empresa */}
            <Card className="mb-4">
              <h3 className="text-900 font-medium mb-3 flex align-items-center">
                <i className="pi pi-building mr-2 text-primary"></i>
                1. Datos de la Empresa
              </h3>

              <div className="grid">
                {/* Código Empresa */}
                <div className="col-12 md:col-6">
                  <label htmlFor="empresaCodigo" className="block text-900 font-medium mb-2">
                    Código Empresa <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="empresaCodigo"
                    value={formData.empresaCodigo}
                    onChange={(e) => handleEmpresaCodigoChange(e.target.value)}
                    onBlur={() => handleBlur('empresaCodigo')}
                    placeholder="ZARA"
                    className={classNames('w-full', { 'p-invalid': errors.empresaCodigo })}
                    maxLength={10}
                    disabled={loading}
                    tooltip="Solo mayúsculas, números y guiones (máx. 10 caracteres)"
                    tooltipOptions={{ position: 'top' }}
                  />
                  {errors.empresaCodigo && (
                    <small className="p-error block mt-1">
                      Código inválido (2-10 caracteres, solo mayúsculas, números y guiones)
                    </small>
                  )}
                </div>

                {/* Nombre Empresa */}
                <div className="col-12 md:col-6">
                  <label htmlFor="empresaNombre" className="block text-900 font-medium mb-2">
                    Nombre Empresa <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="empresaNombre"
                    value={formData.empresaNombre}
                    onChange={(e) => handleInputChange('empresaNombre', e.target.value)}
                    onBlur={() => handleBlur('empresaNombre')}
                    placeholder="Zara España S.A."
                    className={classNames('w-full', { 'p-invalid': errors.empresaNombre })}
                    maxLength={100}
                    disabled={loading}
                  />
                  {errors.empresaNombre && (
                    <small className="p-error block mt-1">
                      El nombre es requerido (mínimo 3 caracteres)
                    </small>
                  )}
                </div>

                {/* Descripción */}
                <div className="col-12">
                  <label htmlFor="descripcion" className="block text-900 font-medium mb-2">
                    Descripción
                  </label>
                  <InputTextarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Cliente Zara para gestión de catálogo de productos textiles"
                    rows={3}
                    className="w-full"
                    maxLength={500}
                    disabled={loading}
                  />
                  <small className="text-500">
                    {formData.descripcion?.length || 0}/500 caracteres
                  </small>
                </div>
              </div>
            </Card>

            {/* SECCIÓN 2: Subdominio */}
            <Card className="mb-4">
              <h3 className="text-900 font-medium mb-3 flex align-items-center">
                <i className="pi pi-globe mr-2 text-primary"></i>
                2. Configuración del Subdominio
              </h3>

              <div className="mb-3">
                <label htmlFor="subdominio" className="block text-900 font-medium mb-2">
                  Subdominio <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="subdominio"
                  value={formData.subdominio}
                  onChange={(e) => handleSubdominioChange(e.target.value)}
                  onBlur={() => handleBlur('subdominio')}
                  placeholder="zara"
                  className={classNames('w-full', { 'p-invalid': errors.subdominio })}
                  disabled={loading}
                  tooltip="Solo minúsculas, números y guiones (mín. 3 caracteres)"
                  tooltipOptions={{ position: 'top' }}
                />
                {errors.subdominio && (
                  <small className="p-error block mt-1">
                    Subdominio inválido (mín. 3 caracteres, solo minúsculas, números y guiones)
                  </small>
                )}
              </div>

              {/* Preview URL */}
              {formData.subdominio && isValidSubdominio(formData.subdominio) && (
                <Message
                  severity="success"
                  className="w-full"
                  content={
                    <div className="flex align-items-center">
                      <i className="pi pi-check-circle mr-2"></i>
                      <span>
                        <strong>URL de acceso:</strong>{' '}
                        <code className="font-bold">{generateSubdomainPreview(formData.subdominio)}</code>
                      </span>
                    </div>
                  }
                />
              )}
            </Card>

            {/* SECCIÓN 3: Usuario Administrador */}
            <Card className="mb-4">
              <h3 className="text-900 font-medium mb-3 flex align-items-center">
                <i className="pi pi-user mr-2 text-primary"></i>
                3. Usuario Administrador del Tenant
              </h3>

              <div className="grid">
                {/* Nombre Admin */}
                <div className="col-12 md:col-6">
                  <label htmlFor="adminNombre" className="block text-900 font-medium mb-2">
                    Nombre del Administrador <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="adminNombre"
                    value={formData.adminNombre}
                    onChange={(e) => handleInputChange('adminNombre', e.target.value)}
                    onBlur={() => handleBlur('adminNombre')}
                    placeholder="Juan García"
                    className={classNames('w-full', { 'p-invalid': errors.adminNombre })}
                    disabled={loading}
                  />
                  {errors.adminNombre && (
                    <small className="p-error block mt-1">
                      El nombre es requerido (mínimo 3 caracteres)
                    </small>
                  )}
                </div>

                {/* Email Admin */}
                <div className="col-12 md:col-6">
                  <label htmlFor="adminEmail" className="block text-900 font-medium mb-2">
                    Email del Administrador <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                    onBlur={() => handleBlur('adminEmail')}
                    placeholder="admin@zara.com"
                    className={classNames('w-full', { 'p-invalid': errors.adminEmail })}
                    disabled={loading}
                  />
                  {errors.adminEmail && (
                    <small className="p-error block mt-1">
                      Email inválido
                    </small>
                  )}
                  {!errors.adminEmail && formData.adminEmail && (
                    <small className="text-500 block mt-1">
                      A este email se enviarán las credenciales de acceso
                    </small>
                  )}
                </div>

                {/* Password Admin */}
                <div className="col-12">
                  <label htmlFor="adminPassword" className="block text-900 font-medium mb-2">
                    Contraseña Inicial <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Password
                      id="adminPassword"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      onBlur={() => handleBlur('adminPassword')}
                      placeholder="••••••••"
                      className="flex-1"
                      inputClassName={classNames('w-full', { 'p-invalid': errors.adminPassword })}
                      toggleMask
                      feedback={false}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      icon="pi pi-refresh"
                      label="Generar"
                      severity="secondary"
                      onClick={handleGeneratePassword}
                      disabled={loading}
                      tooltip="Generar contraseña segura y copiar al portapapeles"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>
                  <IndicadorFuerzaPassword password={formData.adminPassword} />
                </div>
              </div>
            </Card>

            {/* SECCIÓN 4: Plan y Límites */}
            <Card className="mb-4">
              <h3 className="text-900 font-medium mb-3 flex align-items-center">
                <i className="pi pi-chart-line mr-2 text-primary"></i>
                4. Plan y Límites
              </h3>

              <div className="grid">
                {/* Plan */}
                <div className="col-12">
                  <label htmlFor="plan" className="block text-900 font-medium mb-2">
                    Plan de Suscripción <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="plan"
                    value={formData.plan}
                    onChange={(e) => handleInputChange('plan', e.value)}
                    options={[
                      { label: 'Básico - Hasta 1,000 productos, 5 usuarios', value: 'basico' },
                      { label: 'Profesional - Hasta 10,000 productos, 50 usuarios', value: 'profesional' },
                      { label: 'Empresarial - Ilimitado', value: 'enterprise' }
                    ]}
                    placeholder="Seleccione un plan"
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                {/* Máximo Productos */}
                <div className="col-12 md:col-6">
                  <label htmlFor="maxProductos" className="block text-900 font-medium mb-2">
                    Máximo de Productos
                  </label>
                  <InputNumber
                    id="maxProductos"
                    value={formData.maxProductos}
                    onValueChange={(e) => handleInputChange('maxProductos', e.value)}
                    min={1}
                    max={999999}
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                {/* Máximo Usuarios */}
                <div className="col-12 md:col-6">
                  <label htmlFor="maxUsuarios" className="block text-900 font-medium mb-2">
                    Máximo de Usuarios
                  </label>
                  <InputNumber
                    id="maxUsuarios"
                    value={formData.maxUsuarios}
                    onValueChange={(e) => handleInputChange('maxUsuarios', e.value)}
                    min={1}
                    max={999}
                    className="w-full"
                    disabled={loading}
                  />
                </div>
              </div>
            </Card>

            {/* SECCIÓN 5 y 6: Accordions Colapsables */}
            <Accordion multiple className="mb-4">
              {/* Personalización de Interfaz */}
              <AccordionTab header="🎨 Personalización de Interfaz">
                <div className="grid">
                  {/* Tema */}
                  <div className="col-12 md:col-6">
                    <label htmlFor="tema" className="block text-900 font-medium mb-2">
                      Tema de Color
                    </label>
                    <Dropdown
                      id="tema"
                      value={formData.tema}
                      onChange={(e) => handleInputChange('tema', e.value)}
                      options={THEME_OPTIONS}
                      optionLabel="name"
                      optionValue="value"
                      placeholder="Seleccione un tema"
                      className="w-full"
                      disabled={loading}
                      itemTemplate={(option) => (
                        <div className="flex align-items-center">
                          <div 
                            className="w-2rem h-2rem border-circle mr-2"
                            style={{ backgroundColor: option.color }}
                          ></div>
                          <span>{option.name}</span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Escala UI */}
                  <div className="col-12 md:col-6">
                    <label htmlFor="escala" className="block text-900 font-medium mb-2">
                      Escala de Interfaz: {formData.escala}px
                    </label>
                    <Slider
                      id="escala"
                      value={formData.escala}
                      onChange={(e) => handleInputChange('escala', e.value)}
                      min={12}
                      max={16}
                      step={1}
                      className="w-full"
                      disabled={loading}
                    />
                  </div>

                  {/* Tiempo Inactividad */}
                  <div className="col-12 md:col-6">
                    <label htmlFor="tiempoInactividad" className="block text-900 font-medium mb-2">
                      Tiempo de Inactividad (minutos)
                    </label>
                    <InputNumber
                      id="tiempoInactividad"
                      value={formData.tiempoInactividad}
                      onValueChange={(e) => handleInputChange('tiempoInactividad', e.value)}
                      min={5}
                      max={120}
                      className="w-full"
                      disabled={loading}
                    />
                  </div>
                </div>
              </AccordionTab>
            </Accordion>

            {/* Botones de Acción */}
            <div className="flex flex-column md:flex-row gap-3">
              <Button
                type="submit"
                label={loading ? 'Creando Tenant...' : 'Crear Tenant'}
                icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                className="flex-1"
                size="large"
                disabled={loading || !isFormValid}
              />
              <Button
                type="button"
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                className="flex-1"
                size="large"
                onClick={handleCancelClick}
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TenantForm;
