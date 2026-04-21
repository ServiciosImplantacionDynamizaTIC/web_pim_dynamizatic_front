"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getMarketplace, postMarketplace, patchMarketplace } from "@/app/api-endpoints/marketplace";
import EditarDatosMarketplace from "./EditarDatosMarketplace";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarMarketplace = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [marketplace, setMarketplace] = useState(emptyRegistro || {
        nombre: "",
        tipo: "",
        urlApi: "",
        credencialesApi: "",
        configuracion: "",
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar && idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setMarketplace(registro);
                setIsEdit(true);
            } else {
                setIsEdit(false);
                setMarketplace(emptyRegistro || {
                    nombre: "",
                    tipo: "",
                    urlApi: "",
                    credencialesApi: "",
                    configuracion: "",
                    activoSn: "S"
                });
            }
        };
        fetchData();
    }, [idEditar, rowData, emptyRegistro]);

    const validaciones = async () => {
        const validaNombre = marketplace.nombre === undefined || marketplace.nombre === "";
        const validaTipo = marketplace.tipo === undefined || marketplace.tipo === "";
        
        if (validaNombre) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'El nombre es obligatorio' }),
                life: 3000,
            });
        }
        
        if (validaTipo) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'El tipo es obligatorio' }),
                life: 3000,
            });
        }
        
        return (!validaNombre && !validaTipo);
    };

    const guardarMarketplace = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            const usuarioActual = getUsuarioSesion()?.id;
            let objGuardar = { ...marketplace };

            if (idEditar === 0) {
                objGuardar = {
                    empresaId: getUsuarioSesion()?.empresaId,
                    nombre: objGuardar.nombre,
                    tipo: objGuardar.tipo,
                    urlApi: objGuardar.urlApi,
                    credencialesApi: objGuardar.credencialesApi,
                    configuracion: objGuardar.configuracion,
                    activoSn: objGuardar.activoSn || 'S',
                    usuarioCreacion: usuarioActual,
                };
                
                try {
                    const nuevoRegistro = await postMarketplace(objGuardar);
                    
                    if (nuevoRegistro?.id) {
                        setRegistroResult("insertado");
                        setIdEditar(null);
                        toast.current?.show({
                            severity: 'success',
                            summary: intl.formatMessage({ id: 'Éxito' }),
                            detail: intl.formatMessage({ id: 'Registro guardado correctamente' }),
                            life: 3000,
                        });
                    }
                } catch (error) {
                    console.error('Error creando marketplace:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Error al guardar el registro' }),
                        life: 3000,
                    });
                }
            } else {
                const marketplaceAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    tipo: objGuardar.tipo,
                    urlApi: objGuardar.urlApi,
                    credencialesApi: objGuardar.credencialesApi,
                    configuracion: objGuardar.configuracion,
                    activoSn: objGuardar.activoSn || 'S',
                    usuarioModificacion: usuarioActual,
                };
                
                // Solo incluir ultimaSincronizacion si tiene valor
                if (objGuardar.ultimaSincronizacion && objGuardar.ultimaSincronizacion !== '') {
                    marketplaceAeditar.ultimaSincronizacion = objGuardar.ultimaSincronizacion;
                }
                
                try {
                    const registroEditado = await patchMarketplace(idEditar, marketplaceAeditar);
                    
                    if (registroEditado) {
                        setIdEditar(null);
                        setRegistroResult("editado");
                    }
                } catch (error) {
                    console.error('Error editando marketplace:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Error al actualizar el registro' }),
                        life: 3000,
                    });
                }
            }
        }
        
        setEstadoGuardando(false);
        setEstadoGuardandoBoton(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid Marketplace">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Marketplace' })).toLowerCase()}</h2>
                        <EditarDatosMarketplace
                            marketplace={marketplace}
                            setMarketplace={setMarketplace}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                            editable={editable}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarMarketplace}
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

export default EditarMarketplace;