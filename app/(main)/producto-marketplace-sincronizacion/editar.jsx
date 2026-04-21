"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoMarketplaceSincronizacion, postProductoMarketplaceSincronizacion, patchProductoMarketplaceSincronizacion } from "@/app/api-endpoints/producto_marketplace_sincronizacion";
import EditarDatosProductoMarketplaceSincronizacion from "./EditarDatosProductoMarketplaceSincronizacion";
import { getProductosMarketplace } from "@/app/api-endpoints/producto_marketplace";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoMarketplaceSincronizacion = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productosMarketplace, setProductosMarketplace] = useState([]);
    const [cargandoProductosMarketplace, setCargandoProductosMarketplace] = useState(false);
    
    const [sincronizacion, setSincronizacion] = useState(emptyRegistro || {
        productoMarketplaceId: null,
        estado: "",
        fecha: null,
        mensaje: ""
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    // Cargar productos marketplace
    useEffect(() => {
        const cargarProductosMarketplace = async () => {
            setCargandoProductosMarketplace(true);
            try {
                const filtro = JSON.stringify({
                    include: ['producto', 'marketplace'],
                    where: {
                        activoEnMarketplace: 'S'
                    }
                });
                const data = await getProductosMarketplace(filtro);
                const productosFormateados = data.map(pm => ({
                    label: `${pm.producto?.nombre || 'Producto'} - ${pm.marketplace?.nombre || 'Marketplace'}`,
                    value: pm.id
                }));
                setProductosMarketplace(productosFormateados);
            } catch (error) {
                console.error('Error cargando productos marketplace:', error);
            } finally {
                setCargandoProductosMarketplace(false);
            }
        };

        cargarProductosMarketplace();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setSincronizacion(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validaciones = async () => {
        const validaProductoMarketplace = !sincronizacion.productoMarketplaceId;
        const validaEstado = !sincronizacion.estado || sincronizacion.estado.trim() === "";
        
        if (validaProductoMarketplace || validaEstado) {
            let errorMessage = intl.formatMessage({ id: 'Todos los campos obligatorios deben ser rellenados' });
            
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: errorMessage,
                life: 3000,
            });
            return false;
        }
        
        return true;
    };

    const guardarSincronizacion = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...sincronizacion };
            const usuarioActual = getUsuarioSesion()?.id;

            // Si la fecha no está establecida, usar la fecha actual
            if (!objGuardar.fecha) {
                objGuardar.fecha = new Date().toISOString();
            }

            if (idEditar === 0) {
                objGuardar = {
                    productoMarketplaceId: objGuardar.productoMarketplaceId,
                    estado: objGuardar.estado,
                    fecha: objGuardar.fecha,
                    mensaje: objGuardar.mensaje,
                    usuarioCreacion: usuarioActual,
                };

                const nuevoRegistro = await postProductoMarketplaceSincronizacion(objGuardar);

                if (nuevoRegistro?.id) {
                    setRegistroResult("insertado");
                    setIdEditar(null);
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                        life: 3000,
                    });
                }
            } else {
                const sincronizacionAeditar = {
                    id: objGuardar.id,
                    productoMarketplaceId: objGuardar.productoMarketplaceId,
                    estado: objGuardar.estado,
                    fecha: objGuardar.fecha,
                    mensaje: objGuardar.mensaje,
                    usuarioModificacion: usuarioActual,
                };
                
                await patchProductoMarketplaceSincronizacion(objGuardar.id, sincronizacionAeditar);
                setIdEditar(null);
                setRegistroResult("editado");
            }
        }
        setEstadoGuardandoBoton(false);
        setEstadoGuardando(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid ProductoMarketplaceSincronizacion">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'sincronización de producto marketplace' })).toLowerCase()}</h2>
                        <EditarDatosProductoMarketplaceSincronizacion
                            sincronizacion={sincronizacion}
                            setSincronizacion={setSincronizacion}
                            productosMarketplace={productosMarketplace}
                            cargandoProductosMarketplace={cargandoProductosMarketplace}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarSincronizacion}
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

export default EditarProductoMarketplaceSincronizacion;