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
            if (idEditarMarketplace !== 0) {
                const registro = rowData.find((element) => element.id === idEditarMarketplace);
                setProductoMarketplace(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarMarketplace, rowData]);

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
            try {
                const usuarioSesion = getUsuarioSesion();
                
                const productoMarketplaceData = {
                    productoId: productoMarketplace.productoId,
                    marketplaceId: productoMarketplace.marketplaceId,
                    tituloPersonalizado: productoMarketplace.tituloPersonalizado,
                    descripcionPersonalizada: productoMarketplace.descripcionPersonalizada,
                    palabrasClavePersonalizadas: productoMarketplace.palabrasClavePersonalizadas,
                    activoEnMarketplace: productoMarketplace.activoEnMarketplace,
                    estadoSincronizacion: productoMarketplace.estadoSincronizacion,
                    ...(isEdit 
                        ? { usuarioModificacion: usuarioSesion.id } 
                        : { usuarioCreacion: usuarioSesion.id })
                };

                // Limpiamos los campos nulos, undefined y vacíos
                const productoMarketplaceDataLimpio = Object.fromEntries(
                    Object.entries(productoMarketplaceData).filter(([key, value]) => 
                        value !== null && value !== undefined && value !== ""
                    )
                );

                let resultado;
                if (isEdit) {
                    resultado = await patchProductoMarketplace(idEditarMarketplace, productoMarketplaceDataLimpio);
                    setRegistroResult("editado");
                } else {
                    resultado = await postProductoMarketplace(productoMarketplaceDataLimpio);
                    setRegistroResult("insertado");
                }
                
                toast.current.show({
                    severity: 'success',
                    summary: intl.formatMessage({ id: 'Éxito' }),
                    detail: intl.formatMessage({ 
                        id: isEdit ? 'Registro actualizado correctamente' : 'Registro creado correctamente' 
                    }),
                    life: 3000
                });

                setIdEditarMarketplace(null);  // null para volver al CRUD
                setIsEdit(false);
            } catch (error) {
                console.error('Error al guardar:', error);
                toast.current.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'Error' }),
                    detail: intl.formatMessage({ id: 'Error al guardar el registro' }),
                    life: 3000
                });
            }
        }
        
        setEstadoGuardando(false);
        setEstadoGuardandoBoton(false);
    };

    const cancelarEdicion = () => {
        setIdEditarMarketplace(null);  // null para volver al CRUD
        setIsEdit(false);
        // Usar el emptyRegistro si está disponible, o crear uno nuevo manteniendo el idProducto
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            marketplaceId: null,
            tituloPersonalizado: "",
            descripcionPersonalizada: "",
            palabrasClavePersonalizadas: "",
            activoEnMarketplace: "S",
            estadoSincronizacion: "pendiente"
        };
        setProductoMarketplace(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoMarketplace">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosProductoMarketplace
                            productoMarketplace={productoMarketplace}
                            setProductoMarketplace={setProductoMarketplace}
                            estadoGuardando={estadoGuardando}
                            editable={editable}
                            idProducto={idProducto}
                            rowData={rowData}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={intl.formatMessage({ id: 'Guardar' })}
                                    className="mr-2"
                                    onClick={guardarProductoMarketplace}
                                    loading={estadoGuardandoBoton}
                                    disabled={estadoGuardandoBoton || !editable}
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