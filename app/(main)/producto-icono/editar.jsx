"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoIcono, postProductoIcono, patchProductoIcono } from "@/app/api-endpoints/producto_icono";
import EditarDatosProductoIcono from "./EditarDatosProductoIcono";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoIcono = ({ idEditar: idEditarIcono, setIdEditar: setIdEditarIcono, rowData, emptyRegistro, setRegistroResult, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoIcono, setProductoIcono] = useState(emptyRegistro || {
        productoId: null,
        iconoId: null,
        textoAsociado: "",
        orden: 0
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarIcono !== 0) {
                const registro = rowData.find((element) => element.id === idEditarIcono);
                setProductoIcono(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarIcono, rowData]);  

    const validaciones = async () => {
        const validaProducto = productoIcono.productoId === undefined || productoIcono.productoId === null || productoIcono.productoId === "";
        const validaIcono = productoIcono.iconoId === undefined || productoIcono.iconoId === null || productoIcono.iconoId === "";
        
        if (validaProducto) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un producto' }),
                life: 3000,
            });
        }
        
        if (validaIcono) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un icono' }),
                life: 3000,
            });
        }
        
        return (!validaProducto && !validaIcono);
    };

    const guardarProductoIcono = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            try {
                const usuarioSesion = getUsuarioSesion();
                
                const productoIconoData = {
                    productoId: productoIcono.productoId,
                    iconoId: productoIcono.iconoId,
                    textoAsociado: productoIcono.textoAsociado,
                    orden: productoIcono.orden,
                    ...(isEdit 
                        ? { usuarioModificacion: usuarioSesion.id } 
                        : { usuarioCreacion: usuarioSesion.id })
                };

                let resultado;
                if (isEdit) {
                    resultado = await patchProductoIcono(idEditarIcono, productoIconoData);
                    setRegistroResult("editado");
                } else {
                    resultado = await postProductoIcono(productoIconoData);
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

                setIdEditarIcono(null);  // null para volver al CRUD
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
        setIdEditarIcono(null);  // null para volver al CRUD
        setIsEdit(false);
        // Usar el emptyRegistro si está disponible, o crear uno nuevo manteniendo el idProducto
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            iconoId: null,
            textoAsociado: "",
            orden: 0
        };
        setProductoIcono(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoIcono">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosProductoIcono
                            productoIcono={productoIcono}
                            setProductoIcono={setProductoIcono}
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
                                    onClick={guardarProductoIcono}
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

export default EditarProductoIcono;