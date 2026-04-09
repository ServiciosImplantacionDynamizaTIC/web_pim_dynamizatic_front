"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoPropiedad, postProductoPropiedad, patchProductoPropiedad } from "@/app/api-endpoints/producto_propiedad";
import EditarDatosProductoPropiedad from "./EditarDatosProductoPropiedad";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoPropiedad = ({ idEditar: idEditarPropiedad, setIdEditar: setIdEditarPropiedad, rowData, emptyRegistro, setRegistroResult, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoPropiedad, setProductoPropiedad] = useState(emptyRegistro || {
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
            if (idEditarPropiedad !== 0) {
                const registro = rowData.find((element) => element.id === idEditarPropiedad);
                setProductoPropiedad(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarPropiedad, rowData]);  

    const validaciones = async () => {
        const validaProducto = productoPropiedad.productoId === undefined || productoPropiedad.productoId === null || productoPropiedad.productoId === "";
        const validaPropiedad = productoPropiedad.atributoId === undefined || productoPropiedad.atributoId === null || productoPropiedad.atributoId === "";
        const validaValor = productoPropiedad.valor === undefined || productoPropiedad.valor === null || productoPropiedad.valor.trim() === "";
        
        if (validaProducto) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un producto' }),
                life: 3000,
            });
        }
        
        if (validaPropiedad) {
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
        
        return (!validaProducto && !validaPropiedad && !validaValor);
    };

    const guardarProductoPropiedad = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            try {
                const usuarioSesion = getUsuarioSesion();
                
                const productoPropiedadData = {
                    productoId: productoPropiedad.productoId,
                    atributoId: productoPropiedad.atributoId,
                    valor: productoPropiedad.valor,
                    unidad: productoPropiedad.unidad || null,
                    ordenEnGrupo: productoPropiedad.ordenEnGrupo || 0,
                    ...(isEdit 
                        ? { usuarioModificacion: usuarioSesion.id } 
                        : { usuarioCreacion: usuarioSesion.id })
                };

                let resultado;
                if (isEdit) {
                    resultado = await patchProductoPropiedad(idEditarPropiedad, productoPropiedadData);
                    setRegistroResult("editado");
                } else {
                    resultado = await postProductoPropiedad(productoPropiedadData);
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

                setIdEditarPropiedad(null);  // null para volver al CRUD
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
        setIdEditarPropiedad(null);  // null para volver al CRUD
        setIsEdit(false);
        // Usar el emptyRegistro si está disponible, o crear uno nuevo manteniendo el idProducto
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            atributoId: null,
            valor: "",
            unidad: "",
            ordenEnGrupo: 0
        };
        setProductoPropiedad(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoPropiedad">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosProductoPropiedad
                            productoPropiedad={productoPropiedad}
                            setProductoPropiedad={setProductoPropiedad}
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
                                    onClick={guardarProductoPropiedad}
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

export default EditarProductoPropiedad;