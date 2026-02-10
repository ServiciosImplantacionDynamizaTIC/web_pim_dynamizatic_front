"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoAtributo, postProductoAtributo, patchProductoAtributo } from "@/app/api-endpoints/producto_atributo";
import EditarDatosProductoAtributo from "./EditarDatosProductoAtributo";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoAtributo = ({ idEditar: idEditarAtributo, setIdEditar: setIdEditarAtributo, rowData, emptyRegistro, setRegistroResult, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoAtributo, setProductoAtributo] = useState(emptyRegistro || {
        productoId: null,
        atributoId: null,
        valor: "",
        unidad: "",
        ordenEnGrupo: 0
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarAtributo !== 0) {
                const registro = rowData.find((element) => element.id === idEditarAtributo);
                setProductoAtributo(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarAtributo, rowData]);  

    const validaciones = async () => {
        const validaProducto = productoAtributo.productoId === undefined || productoAtributo.productoId === null || productoAtributo.productoId === "";
        const validaAtributo = productoAtributo.atributoId === undefined || productoAtributo.atributoId === null || productoAtributo.atributoId === "";
        const validaValor = productoAtributo.valor === undefined || productoAtributo.valor === null || productoAtributo.valor.trim() === "";
        
        if (validaProducto) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un producto' }),
                life: 3000,
            });
        }
        
        if (validaAtributo) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un atributo' }),
                life: 3000,
            });
        }
        
        if (validaValor) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe especificar un valor para el atributo' }),
                life: 3000,
            });
        }
        
        return (!validaProducto && !validaAtributo && !validaValor);
    };

    const guardarProductoAtributo = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            try {
                const usuarioSesion = getUsuarioSesion();
                
                const productoAtributoData = {
                    productoId: productoAtributo.productoId,
                    atributoId: productoAtributo.atributoId,
                    valor: productoAtributo.valor,
                    unidad: productoAtributo.unidad || null,
                    ordenEnGrupo: productoAtributo.ordenEnGrupo || 0,
                    ...(isEdit 
                        ? { usuarioModificacion: usuarioSesion.id } 
                        : { usuarioCreacion: usuarioSesion.id })
                };

                let resultado;
                if (isEdit) {
                    resultado = await patchProductoAtributo(idEditarAtributo, productoAtributoData);
                    setRegistroResult("editado");
                } else {
                    resultado = await postProductoAtributo(productoAtributoData);
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

                setIdEditarAtributo(null);  // null para volver al CRUD
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
        setIdEditarAtributo(null);  // null para volver al CRUD
        setIsEdit(false);
        // Usar el emptyRegistro si está disponible, o crear uno nuevo manteniendo el idProducto
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            atributoId: null,
            valor: "",
            unidad: "",
            ordenEnGrupo: 0
        };
        setProductoAtributo(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoAtributo">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosProductoAtributo
                            productoAtributo={productoAtributo}
                            setProductoAtributo={setProductoAtributo}
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
                                    onClick={guardarProductoAtributo}
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

export default EditarProductoAtributo;