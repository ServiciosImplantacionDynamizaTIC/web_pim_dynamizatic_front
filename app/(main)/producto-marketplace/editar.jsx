"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoMarketplace, postProductoMarketplace, patchProductoMarketplace } from "@/app/api-endpoints/producto_marketplace";
import EditarDatosProductoMarketplace from "./EditarDatosProductoMarketplace";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoMarketplace = ({ idEditar: idEditarMarketplace, setIdEditar: setIdEditarMarketplace, rowData, emptyRegistro, setRegistroResult, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoMarketplace, setProductoMarketplace] = useState(emptyRegistro || {
        productoId: null,
        marketplaceId: null,
        tituloPersonalizado: "",
        descripcionPersonalizada: "",
        palabrasClavePersonalizadas: "",
        activoEnMarketplace: "S",
        estadoSincronizacion: "pendiente"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarMarketplace && idEditarMarketplace !== 0) {
                const registro = rowData.find((element) => element.id === idEditarMarketplace);
                setProductoMarketplace(registro);
                setIsEdit(true);
            } else {
                setIsEdit(false);
                setProductoMarketplace(emptyRegistro);
            }
        };
        fetchData();
    }, [idEditarMarketplace, rowData, emptyRegistro]);

    const validaciones = async () => {
        const validaProducto = productoMarketplace.productoId === undefined || productoMarketplace.productoId === null || productoMarketplace.productoId === "";
        const validaMarketplace = productoMarketplace.marketplaceId === undefined || productoMarketplace.marketplaceId === null || productoMarketplace.marketplaceId === "";
        
        if (validaProducto) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un producto' }),
                life: 3000,
            });
        }
        
        if (validaMarketplace) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un marketplace' }),
                life: 3000,
            });
        }
        
        return (!validaProducto && !validaMarketplace);
    };

    const guardarProductoMarketplace = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            const usuarioActual = getUsuarioSesion()?.id;
            let objGuardar = { ...productoMarketplace };

            if (!idEditarMarketplace || idEditarMarketplace === 0) {
                objGuardar = {
                    ...objGuardar,
                    usuarioCreacion: usuarioActual,
                };
                
                try {
                    const nuevoRegistro = await postProductoMarketplace(objGuardar);
                    
                    if (nuevoRegistro?.id) {
                        setRegistroResult("insertado");
                        setIdEditarMarketplace(nuevoRegistro.id);
                        toast.current?.show({
                            severity: 'success',
                            summary: intl.formatMessage({ id: 'Éxito' }),
                            detail: intl.formatMessage({ id: 'Registro guardado correctamente' }),
                            life: 3000,
                        });
                    }
                } catch (error) {
                    console.error('Error creando producto-marketplace:', error);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Error al guardar el registro' }),
                        life: 3000,
                    });
                }
            } else {
                objGuardar = {
                    ...objGuardar,
                    usuarioModificacion: usuarioActual,
                };
                
                try {
                    const registroEditado = await patchProductoMarketplace(idEditarMarketplace, objGuardar);
                    
                    if (registroEditado) {
                        setRegistroResult("editado");
                        toast.current?.show({
                            severity: 'success',
                            summary: intl.formatMessage({ id: 'Éxito' }),
                            detail: intl.formatMessage({ id: 'Registro actualizado correctamente' }),
                            life: 3000,
                        });
                    }
                } catch (error) {
                    console.error('Error editando producto-marketplace:', error);
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
        setIdEditarMarketplace(0);
    };

    const header = (idEditarMarketplace && idEditarMarketplace > 0) ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid ProductoMarketplace">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Marketplace de Producto' })).toLowerCase()}</h2>
                        <EditarDatosProductoMarketplace
                            productoMarketplace={productoMarketplace}
                            setProductoMarketplace={setProductoMarketplace}
                            estadoGuardando={estadoGuardando}
                            editable={editable}
                            idProducto={idProducto}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarProductoMarketplace}
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

export default EditarProductoMarketplace;