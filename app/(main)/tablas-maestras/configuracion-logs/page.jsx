"use client";
import React, { useState, useEffect, useRef } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Fieldset } from "primereact/fieldset";
import { useIntl } from 'react-intl';
import { getConfiguracionLimpiezaLogs, patchConfiguracionLimpiezaLogs, postConfiguracionLimpiezaLogs } from "@/app/api-endpoints/configuracion_limpieza_logs";
import { tieneUsuarioPermiso } from "@/app/components/shared/componentes";

// Nombres de las tablas que se configuran
const TABLAS = ['log_accion', 'log_acceso', 'log_sincronizacion'];

const ConfiguracionLogsPage = () => {
    const intl = useIntl();
    const toast = useRef(null);
    const [cargando, setCargando] = useState(true);
    const [configs, setConfigs] = useState({ log_accion: 0, log_acceso: 0, log_sincronizacion: 0 });
    const [guardando, setGuardando] = useState(false);
    const [editable, setEditable] = useState(false);

    useEffect(() => {
        cargarConfiguraciones();
        obtenerPermisos();
    }, []);

    const obtenerPermisos = async () => {
        setEditable(await tieneUsuarioPermiso('Configuración de logs', 'Actualizar'));
    }

    const cargarConfiguraciones = async () => {
        try {
            const empresaId = Number(localStorage.getItem('empresa'));
            if (!empresaId) throw new Error("No se encontró la empresa");

            const filtro = JSON.stringify({ where: { empresaId } });
            const data = await getConfiguracionLimpiezaLogs(filtro);

            const nuevas = {};
            TABLAS.forEach(tabla => {
                const config = data.find(c => c.nombreTabla === tabla);
                nuevas[tabla] = config ? config.numeroDiasRetencion : null;
            });
            setConfigs(nuevas);
        } catch (error) {
            toast.current?.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
        } finally {
            setCargando(false);
        }
    };

    const guardarOCrear = async (empresaId, tabla, dias) => {
        const filtro = JSON.stringify({ where: { empresaId, nombreTabla: tabla } });
        const existe = await getConfiguracionLimpiezaLogs(filtro);

        // Mapeo de campos de fecha para cada tabla
        const camposFecha = {
            'log_accion': 'fechaInicio',
            'log_acceso': 'fechaAcceso',
            'log_sincronizacion': 'fechaInicio'
        };

        if (existe?.length > 0) {
            // Actualizar existente
            const registro = existe[0];
            const id = registro.id;
            console.log(`Actualizando ${tabla}, ID: ${id}, datos:`, { numeroDiasRetencion: dias });
            if (!id) throw new Error(`No se encontró el ID del registro ${tabla}`);
            return await patchConfiguracionLimpiezaLogs(id, { numeroDiasRetencion: dias });
        } else {
            const data = {
                nombreTabla: tabla,
                numeroDiasRetencion: dias,
                empresaId: empresaId,
                activoSn: 'S',
                campoFechaTabla: camposFecha[tabla] || 'fecha'
            };
            console.log(`Creando ${tabla}, datos:`, data);
            return await postConfiguracionLimpiezaLogs(data);
        }
    };

    const handleGuardar = async () => {
        if (!editable) {
            toast.current?.show({ severity: "error", summary: "Error", detail: "No tiene permiso para actualizar la configuración", life: 3000 });
            return;
        }

        if (Object.values(configs).some(v => v <= 0)) {
            toast.current?.show({ severity: "error", summary: "Error", detail: "Todos los campos deben contener un numero de días válido", life: 3000 });
            return;
        }

        setGuardando(true);
        try {
            const empresaId = Number(localStorage.getItem('empresa'));
            await Promise.all(TABLAS.map(tabla => guardarOCrear(empresaId, tabla, configs[tabla])));
            toast.current?.show({ severity: "success", summary: "OK", detail: "Configuración guardada", life: 3000 });
        } catch (error) {
            toast.current?.show({ severity: "error", summary: "Error", detail: error.message, life: 3000 });
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) return (
        <div className="card">
            <div className="flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                <span className="ml-3">{intl.formatMessage({ id: 'Cargando' })}...</span>
            </div>
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} position="top-right" />
            
            <Fieldset legend={intl.formatMessage({ id: 'Configuración de Logs' })} className="mb-4">
                <p className="text-600 mb-4 mt-2">
                    Configure el tiempo que permanecerán almacenados los registros de cada tipo de log en la base de datos antes de su limpieza automática. Esta configuración ayuda a mantener el rendimiento óptimo del sistema.
                </p>
                
                <div className="p-fluid">
                    <div className="formgrid grid">
                        {TABLAS.map(tabla => {
                            const labels = {
                                'log_accion': intl.formatMessage({ id: 'Tiempo de almacenamiento máximo en base de datos de las acciones realizadas dentro del sistema' }),
                                'log_acceso': intl.formatMessage({ id: 'Tiempo de almacenamiento máximo en base de datos de los accesos realizados al sistema' }),
                                'log_sincronizacion': intl.formatMessage({ id: 'Tiempo de almacenamiento máximo en base de datos de las sincronizaciones realizadas en el sistema' })
                            };
                            
                            return (
                                <div key={tabla} className="field col-12">
                                    <label htmlFor={`config-${tabla}`} className="text-900 font-medium mb-2">
                                        {labels[tabla]}:
                                    </label>
                                    <div className="p-inputgroup" style={{ maxWidth: '400px' }}>
                                        <InputNumber
                                            id={`config-${tabla}`}
                                            value={configs[tabla]}
                                            onValueChange={(e) => setConfigs({ ...configs, [tabla]: e.value })}
                                            min={1}
                                            max={999}
                                            maxLength={3}
                                            useGrouping={false}
                                            disabled={!editable}
                                            placeholder="Introduce un número"
                                        />
                                        <span className="p-inputgroup-addon">
                                            {intl.formatMessage({ id: 'días' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="mt-4 p-3 surface-100 border-round">
                    <div className="flex align-items-center">
                        <i className="pi pi-info-circle text-blue-600 mr-2"></i>
                        <span className="text-700">
                            <strong>{intl.formatMessage({ id: 'Nota' })}:</strong> {intl.formatMessage({ id: 'Finalizado este tiempo, la información será almacenada en registros CSV' })}.
                        </span>
                    </div>
                </div>
                
                <div className="flex justify-content-end mt-4">
                    {editable ? (
                        <Button
                            label={guardando ? intl.formatMessage({ id: 'Guardando' }) + '...' : intl.formatMessage({ id: 'Guardar cambios' })}
                            icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-check"}
                            onClick={handleGuardar}
                            disabled={guardando}
                        />
                    ) : (
                        <div className="p-3 surface-200 border-round">
                            <div className="flex align-items-center text-600">
                                <i className="pi pi-lock mr-2"></i>
                                <span>{intl.formatMessage({ id: 'No tiene permisos para modificar esta configuración' })}</span>
                            </div>
                        </div>
                    )}
                </div>
            </Fieldset>
        </div>
    );
};

export default ConfiguracionLogsPage;
