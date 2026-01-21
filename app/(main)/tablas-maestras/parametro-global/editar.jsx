"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { postParametroGlobal, patchParametroGlobal } from "@/app/api-endpoints/parametro_global";
import EditarDatosParametroGlobal from "./EditarDatosParametroGlobal";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarParametroGlobal = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const [parametroGlobal, setParametroGlobal] = useState(emptyRegistro);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);

    // Opciones para los dropdowns según el modelo del backend
    const opcionesTipoDato = [
        { label: intl.formatMessage({ id: 'Texto' }), value: 'texto' },
        { label: intl.formatMessage({ id: 'Número' }), value: 'numero' },
        { label: intl.formatMessage({ id: 'Fecha' }), value: 'fecha' },
        { label: intl.formatMessage({ id: 'Booleano' }), value: 'booleano' },
        { label: 'JSON', value: 'json' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setParametroGlobal(registro);
            } else {
                // Inicializar con valores por defecto para nuevo registro
                setParametroGlobal({
                    ...emptyRegistro,
                    tipoDato: 'texto'
                });
            }
        };
        fetchData();
    }, [idEditar, rowData, emptyRegistro]);

    const validaciones = async () => {
        const validaClave = parametroGlobal.clave === undefined || parametroGlobal.clave === "" || parametroGlobal.clave.trim() === "";
        const validaTipoDato = parametroGlobal.tipoDato === undefined || parametroGlobal.tipoDato === "";
        
        if (validaClave || validaTipoDato) {
            return false;
        }
        
        return true;
    }

    const guardar = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        if (await validaciones()) {
            let objGuardar = { ...parametroGlobal };
            const usuarioActual = getUsuarioSesion()?.id;
            const empresaActual = Number(localStorage.getItem('empresa'));

            if (idEditar === 0) {
                try {
                    // Eliminar campos que no se necesitan para crear
                    delete objGuardar.id;
                    delete objGuardar.fechaCreacion;
                    delete objGuardar.fechaModificacion;
                    delete objGuardar.usuarioModificacion;
                    
                    objGuardar.empresaId = empresaActual;
                    objGuardar.clave = objGuardar.clave.trim();
                    objGuardar.usuarioCreacion = usuarioActual;
                    
                    if (objGuardar.valor) {
                        objGuardar.valor = objGuardar.valor.trim();
                    }
                    if (objGuardar.descripcion) {
                        objGuardar.descripcion = objGuardar.descripcion.trim();
                    }                    
                    
                    await postParametroGlobal(objGuardar);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'OK',
                        detail: intl.formatMessage({ id: 'Parámetro global creado correctamente' }),
                        life: 3000,
                    });
                    setRegistroResult("insertado");
                    setIdEditar(null);
                } catch (error) {
                    console.error('Error completo:', error);
                    console.error('Respuesta del servidor:', error.response?.data);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: error.response?.data?.error?.message || intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                        life: 5000,
                    });
                }
            } else {
                try {
                    const parametroAeditar = {
                        id: objGuardar.id,
                        empresaId: objGuardar.empresaId || empresaActual,
                        clave: objGuardar.clave.trim(),
                        valor: objGuardar.valor ? objGuardar.valor.trim() : objGuardar.valor,
                        descripcion: objGuardar.descripcion ? objGuardar.descripcion.trim() : objGuardar.descripcion,
                        tipoDato: objGuardar.tipoDato,
                        usuarioCreacion: objGuardar.usuarioCreacion,
                        usuarioModificacion: usuarioActual,
                    };
                    
                    await patchParametroGlobal(objGuardar.id, parametroAeditar);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'OK',
                        detail: intl.formatMessage({ id: 'Parámetro global actualizado correctamente' }),
                        life: 3000,
                    });
                    setIdEditar(null)
                    setRegistroResult("editado");
                } catch (error) {
                    console.error('Error completo:', error);
                    console.error('Respuesta del servidor:', error.response?.data);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: error.response?.data?.error?.message || intl.formatMessage({ id: 'Ha ocurrido un error editando el registro' }),
                        life: 5000,
                    });
                }
            }
        } else {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Todos los campos deben de ser rellenados' }),
                life: 3000,
            });
        }
        setEstadoGuardando(false);
        setEstadoGuardandoBoton(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null)
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });
    
    const puedeEditar = idEditar === 0 || (editable);

    return (
        <div>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Parámetro Global' })).toLowerCase()}</h2>
                        <EditarDatosParametroGlobal
                            parametroGlobal={parametroGlobal}
                            setParametroGlobal={setParametroGlobal}
                            estadoGuardando={estadoGuardando}
                            opcionesTipoDato={opcionesTipoDato}
                            editable={puedeEditar}
                        />

                        <div className="flex justify-content-end mt-2">
                            {puedeEditar && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })}
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardar}
                                    className="mr-2"
                                    disabled={estadoGuardandoBoton}
                                />
                            )}
                            <Button label={intl.formatMessage({ id: 'Cancelar' })} onClick={cancelarEdicion} className="p-button-secondary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarParametroGlobal;