"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { postLogAccion, patchLogAccion, getLogAcciones } from "@/app/api-endpoints/log_acciones";
import EditarDatosLogAcciones from "./EditarDatosLogAcciones";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarLogAcciones = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const [logAccion, setLogAccion] = useState(emptyRegistro);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);

    // Opciones para los dropdowns
    const opcionesTipo = [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' }
    ];

    useEffect(() => {
        const obtenerDatos = async () => {
            if (idEditar > 0) {
                // Si estamos editando un registro existente, obtenemos sus datos
                try {
                    const registroExistente = await getLogAcciones(JSON.stringify({ where: {and: { id: idEditar }} }));
                    setLogAccion(registroExistente[0]);
                } catch (error) {
                    console.error('Error al obtener el registro:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Error al cargar el registro' }),
                        life: 3000,
                    });
                }
            } else {
                // Si estamos creando un nuevo registro, usamos el registro vacío
                setLogAccion({
                    ...emptyRegistro,
                    resultado: '', // Campo libre, sin valor por defecto
                    tipo: 'GET', // Valor por defecto
                    fechaInicio: new Date(), // Fecha actual por defecto
                    fechaFin: new Date(),
                    empresaId: Number(localStorage.getItem('empresa'))
                });
            }
        };

        obtenerDatos();
    }, [idEditar, emptyRegistro]);

    const guardarLogAccion = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        try {
            const usuarioSesion = getUsuarioSesion();
            const ahora = new Date();
            
            const datosLogAccion = {
                ...logAccion,
                empresaId: Number(localStorage.getItem('empresa')),
                usuarioCreacion: usuarioSesion.id,
                usuarioModificacion: usuarioSesion.id,
                fechaModificacion: ahora
            };

            if (idEditar > 0) {
                // Actualizar registro existente
                await patchLogAccion(idEditar, datosLogAccion);
                toast.current?.show({
                    severity: 'success',
                    summary: intl.formatMessage({ id: 'Exito' }),
                    detail: intl.formatMessage({ id: 'Registro actualizado correctamente' }),
                    life: 3000,
                });
            } else {
                // Crear nuevo registro
                datosLogAccion.fechaCreacion = ahora;
                await postLogAccion(datosLogAccion);
                toast.current?.show({
                    severity: 'success',
                    summary: intl.formatMessage({ id: 'Exito' }),
                    detail: intl.formatMessage({ id: 'Registro creado correctamente' }),
                    life: 3000,
                });
            }

            // Actualizar la lista y cerrar el diálogo
            setRegistroResult(Math.random());
            setTimeout(() => {
                setIdEditar(null);
            }, 1000);

        } catch (error) {
            console.error('Error al guardar:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Error al guardar el registro' }),
                life: 3000,
            });
        } finally {
            setEstadoGuardando(false);
            setEstadoGuardandoBoton(false);
        }
    };

    const cancelarEdicion = () => {
        setIdEditar(null);
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} position="top-right" />
                    
                    <EditarDatosLogAcciones
                        logAccion={logAccion}
                        setLogAccion={setLogAccion}
                        estadoGuardando={estadoGuardando}
                        opcionesTipo={opcionesTipo}
                        editable={editable}
                    />

                    <Divider />

                    <div className="flex justify-content-end gap-2 mt-2">
                        <Button 
                            label={intl.formatMessage({ id: 'Cancelar' })} 
                            onClick={cancelarEdicion} 
                            severity="secondary"
                            disabled={estadoGuardandoBoton}
                        />
                        {editable && (
                            <Button 
                                label={estadoGuardandoBoton ? intl.formatMessage({ id: 'Guardando' }) + '...' : intl.formatMessage({ id: 'Guardar' })}
                                onClick={guardarLogAccion}
                                disabled={estadoGuardandoBoton}
                                icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : "pi pi-check"}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EditarLogAcciones;