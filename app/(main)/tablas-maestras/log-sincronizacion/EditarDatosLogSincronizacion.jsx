import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { getUsuarios } from "@/app/api-endpoints/usuario";
import { useIntl } from 'react-intl';

const EditarDatosLogSincronizacion = ({ 
    logSincronizacion, 
    setLogSincronizacion, 
    estadoGuardando, 
    opcionesTipoSincronizacion,
    opcionesEstado,
    editable 
}) => {
    const intl = useIntl();
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const empresaId = Number(localStorage.getItem('empresa'));
                const filtroUsuarios = JSON.stringify({
                    where: {
                        empresaId: empresaId,
                        activoSn: 'S'
                    },
                    order: ['nombre ASC']
                });
                
                const usuariosData = await getUsuarios(filtroUsuarios);
                setUsuarios(usuariosData);
            } catch (error) {
                console.error('Error al cargar datos:', error);
            }
        };

        cargarDatos();
    }, []);

    const manejarCambio = (campo, valor) => {
        setLogSincronizacion({ ...logSincronizacion, [campo]: valor });
    };

    return (
        <Fieldset legend={intl.formatMessage({ id: 'Datos del Log de Sincronización' })}>
            <div className="formgrid grid">
                
                {/* Usuario */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="usuarioId">{intl.formatMessage({ id: 'Usuario' })}</label>
                    <Dropdown
                        id="usuarioId"
                        value={logSincronizacion.usuarioId}
                        options={usuarios}
                        onChange={(e) => manejarCambio('usuarioId', e.value)}
                        optionLabel="nombre"
                        optionValue="id"
                        placeholder={intl.formatMessage({ id: 'Seleccione un usuario' })}
                        filter
                        showClear
                        disabled={!editable}
                    />
                </div>

                {/* Tipo de Sincronización */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="tipoSincronizacion">{intl.formatMessage({ id: 'Tipo de Sincronización' })}</label>
                    <Dropdown
                        id="tipoSincronizacion"
                        value={logSincronizacion.tipoSincronizacion}
                        options={opcionesTipoSincronizacion}
                        onChange={(e) => manejarCambio('tipoSincronizacion', e.value)}
                        placeholder={intl.formatMessage({ id: 'Seleccione un tipo' })}
                        className={`${(estadoGuardando && !logSincronizacion.tipoSincronizacion) ? "p-invalid" : ""}`}
                        disabled={!editable}
                    />
                </div>

                {/* Sistema Externo */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="sistemaExterno">{intl.formatMessage({ id: 'Sistema Externo' })}</label>
                    <InputText
                        id="sistemaExterno"
                        value={logSincronizacion.sistemaExterno || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: SAP, CRM, ERP' })}
                        onChange={(e) => manejarCambio('sistemaExterno', e.target.value)}
                        className={`${(estadoGuardando && !logSincronizacion.sistemaExterno) ? "p-invalid" : ""}`}
                        maxLength={100}
                        disabled={!editable}
                    />
                </div>

                {/* Estado */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="estado">{intl.formatMessage({ id: 'Estado' })}</label>
                    <Dropdown
                        id="estado"
                        value={logSincronizacion.estado}
                        options={opcionesEstado}
                        onChange={(e) => manejarCambio('estado', e.value)}
                        placeholder={intl.formatMessage({ id: 'Seleccione un estado' })}
                        className={`${(estadoGuardando && !logSincronizacion.estado) ? "p-invalid" : ""}`}
                        disabled={!editable}
                    />
                </div>

                {/* Registros Procesados */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="registrosProcesados">{intl.formatMessage({ id: 'Registros Procesados' })}</label>
                    <InputNumber
                        id="registrosProcesados"
                        value={logSincronizacion.registrosProcesados || 0}
                        onValueChange={(e) => manejarCambio('registrosProcesados', e.value)}
                        min={0}
                        className="w-full"
                        disabled={!editable}
                    />
                </div>

                {/* Registros Exitosos */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="registrosExitosos">{intl.formatMessage({ id: 'Registros Exitosos' })}</label>
                    <InputNumber
                        id="registrosExitosos"
                        value={logSincronizacion.registrosExitosos || 0}
                        onValueChange={(e) => manejarCambio('registrosExitosos', e.value)}
                        min={0}
                        className="w-full"
                        disabled={!editable}
                    />
                </div>

                {/* Registros con Error */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="registrosConError">{intl.formatMessage({ id: 'Registros con Error' })}</label>
                    <InputNumber
                        id="registrosConError"
                        value={logSincronizacion.registrosConError || 0}
                        onValueChange={(e) => manejarCambio('registrosConError', e.value)}
                        min={0}
                        className="w-full"
                        disabled={!editable}
                    />
                </div>

                {/* Fecha de Inicio */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="fechaInicio">{intl.formatMessage({ id: 'Fecha de Inicio' })}</label>
                    <Calendar
                        id="fechaInicio"
                        value={logSincronizacion.fechaInicio ? new Date(logSincronizacion.fechaInicio) : null}
                        onChange={(e) => manejarCambio('fechaInicio', e.value)}
                        showTime
                        hourFormat="24"
                        dateFormat="dd/mm/yy"
                        placeholder={intl.formatMessage({ id: 'Seleccione fecha y hora' })}
                        disabled={!editable}
                    />
                </div>

                {/* Fecha de Fin */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="fechaFin">{intl.formatMessage({ id: 'Fecha de Fin' })}</label>
                    <Calendar
                        id="fechaFin"
                        value={logSincronizacion.fechaFin ? new Date(logSincronizacion.fechaFin) : null}
                        onChange={(e) => manejarCambio('fechaFin', e.value)}
                        showTime
                        hourFormat="24"
                        dateFormat="dd/mm/yy"
                        placeholder={intl.formatMessage({ id: 'Seleccione fecha y hora' })}
                        disabled={!editable}
                        showClear
                    />
                </div>

                {/* Mensaje Resultado */}
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label htmlFor="mensajeResultado">{intl.formatMessage({ id: 'Mensaje Resultado' })}</label>
                    <InputTextarea
                        id="mensajeResultado"
                        value={logSincronizacion.mensajeResultado || ''}
                        placeholder={intl.formatMessage({ id: 'Mensaje sobre el resultado de la sincronización' })}
                        onChange={(e) => manejarCambio('mensajeResultado', e.target.value)}
                        rows={3}
                        disabled={!editable}
                        autoResize
                    />
                </div>

                {/* Archivo Log */}
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label htmlFor="archivoLog">{intl.formatMessage({ id: 'Archivo Log' })}</label>
                    <InputText
                        id="archivoLog"
                        value={logSincronizacion.archivoLog || ''}
                        placeholder={intl.formatMessage({ id: 'Ruta del archivo de log' })}
                        onChange={(e) => manejarCambio('archivoLog', e.target.value)}
                        maxLength={500}
                        disabled={!editable}
                    />
                </div>

            </div>
        </Fieldset>
    );
};

export default EditarDatosLogSincronizacion;
