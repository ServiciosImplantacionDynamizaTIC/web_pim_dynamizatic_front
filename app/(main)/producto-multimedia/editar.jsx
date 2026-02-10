"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoMultimedia, postProductoMultimedia, patchProductoMultimedia } from "@/app/api-endpoints/producto_multimedia";
import EditarDatosProductoMultimedia from "./EditarDatosProductoMultimedia";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoMultimedia = ({ idEditar: idEditarMultimedia, setIdEditar: setIdEditarMultimedia, rowData, emptyRegistro, setRegistroResult, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoMultimedia, setProductoMultimedia] = useState(emptyRegistro || {
        productoId: null,
        multimediaId: null,
        tipoUso: "galeria",
        esPrincipal: "N",
        orden: 0
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarMultimedia !== 0) {
                const registro = rowData.find((element) => element.id === idEditarMultimedia);
                setProductoMultimedia(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarMultimedia, rowData]);  

    const validaciones = async () => {
        const validaProducto = productoMultimedia.productoId === undefined || productoMultimedia.productoId === null || productoMultimedia.productoId === "";
        const validaMultimedia = productoMultimedia.multimediaId === undefined || productoMultimedia.multimediaId === null || productoMultimedia.multimediaId === "";
        
        // Validar que solo haya un multimedia principal por producto
        let validaPrincipal = true;
        if (productoMultimedia.esPrincipal === 'S' || productoMultimedia.esPrincipal === true) {
            const multimediaPrincipalExistente = rowData?.find(registro => 
                registro.productoId === productoMultimedia.productoId && 
                (registro.esPrincipal === 'S' || registro.esPrincipal === true) &&
                registro.id !== productoMultimedia.id
            );
            
            if (multimediaPrincipalExistente) {
                validaPrincipal = false;
                toast.current?.show({
                    severity: 'error',
                    summary: 'ERROR',
                    detail: intl.formatMessage({ id: 'Ya existe un multimedia principal para este producto' }),
                    life: 3000,
                });
            }
        }
        
        if (validaProducto) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un producto' }),
                life: 3000,
            });
        }
        
        if (validaMultimedia) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Debe seleccionar un archivo multimedia' }),
                life: 3000,
            });
        }
        
        return (!validaProducto && !validaMultimedia && validaPrincipal);
    };

    const guardarProductoMultimedia = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            try {
                const usuarioSesion = getUsuarioSesion();
                
                const productoMultimediaData = {
                    productoId: productoMultimedia.productoId,
                    multimediaId: productoMultimedia.multimediaId,
                    tipoUso: productoMultimedia.tipoUso,
                    esPrincipal: productoMultimedia.esPrincipal,
                    orden: productoMultimedia.orden || 0,
                    ...(isEdit 
                        ? { usuarioModificacion: usuarioSesion.id } 
                        : { usuarioCreacion: usuarioSesion.id })
                };

                let resultado;
                if (isEdit) {
                    resultado = await patchProductoMultimedia(idEditarMultimedia, productoMultimediaData);
                    setRegistroResult("editado");
                } else {
                    resultado = await postProductoMultimedia(productoMultimediaData);
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

                setIdEditarMultimedia(null);  // null para volver al CRUD
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
        setIdEditarMultimedia(null);  // null para volver al CRUD
        setIsEdit(false);
        // Usar el emptyRegistro si está disponible, o crear uno nuevo manteniendo el idProducto
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            multimediaId: null,
            tipoUso: "galeria",
            esPrincipal: "N",
            orden: 0
        };
        setProductoMultimedia(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoMultimedia">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosProductoMultimedia
                            productoMultimedia={productoMultimedia}
                            setProductoMultimedia={setProductoMultimedia}
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
                                    onClick={guardarProductoMultimedia}
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

export default EditarProductoMultimedia;