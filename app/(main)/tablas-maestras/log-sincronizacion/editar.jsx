"use client";
import React, { useEffect, useState } from "react";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import EditarDatosLogSincronizacion from "./EditarDatosLogSincronizacion";
import { useIntl } from 'react-intl';

const EditarLogSincronizacion = ({ idEditar, setIdEditar, rowData }) => {
    const intl = useIntl();
    const [logSincronizacion, setLogSincronizacion] = useState({
        empresaId: Number(localStorage.getItem('empresa')),
        usuarioId: null,
        tipoSincronizacion: "",
        sistemaExterno: "",
        registrosProcesados: 0,
        registrosExitosos: 0,
        registrosConError: 0,
        mensajeResultado: "",
        estado: "",
        archivoLog: "",
        fechaInicio: new Date(),
        fechaFin: null
    });

    const opcionesTipoSincronizacion = [
        { label: 'Importación', value: 'importacion' },
        { label: 'Exportación', value: 'exportacion' },
        { label: 'Bidireccional', value: 'bidireccional' }
    ];

    const opcionesEstado = [
        { label: 'Iniciado', value: 'iniciado' },
        { label: 'En Progreso', value: 'en_progreso' },
        { label: 'Exitoso', value: 'exitoso' },
        { label: 'Error', value: 'error' },
        { label: 'Parcial', value: 'parcial' }
    ];

    useEffect(() => {
        if (idEditar && idEditar !== 0) {
            const registro = rowData.find((element) => element.id === idEditar);
            if (registro) {
                setLogSincronizacion({
                    ...registro,
                    fechaInicio: registro.fechaInicio ? new Date(registro.fechaInicio) : null,
                    fechaFin: registro.fechaFin ? new Date(registro.fechaFin) : null
                });
            }
        }
    }, [idEditar, rowData]);

    const cerrarDialog = () => {
        setIdEditar(null);
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h2>{intl.formatMessage({ id: 'Ver' })} {intl.formatMessage({ id: 'Log de Sincronización' }).toLowerCase()}</h2>
                    
                    <EditarDatosLogSincronizacion
                        logSincronizacion={logSincronizacion}
                        setLogSincronizacion={setLogSincronizacion}
                        opcionesTipoSincronizacion={opcionesTipoSincronizacion}
                        opcionesEstado={opcionesEstado}
                    />

                    <Divider />
                    
                    <div className="flex justify-content-end mt-2">
                        <Button 
                            label={intl.formatMessage({ id: 'Cerrar' })} 
                            onClick={cerrarDialog} 
                            className="p-button-secondary" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarLogSincronizacion;
