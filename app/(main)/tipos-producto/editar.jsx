"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getTipoProducto, postTipoProducto, patchTipoProducto } from "@/app/api-endpoints/tipo_producto";
import EditarDatosTipoProducto from "./EditarDatosTipoProducto";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarTipoProducto = ({ idEditar: idEditarTipo, setIdEditar: setIdEditarTipo, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const usuarioSesion = getUsuarioSesion();
    
    const [tipoProducto, setTipoProducto] = useState(emptyRegistro || {
        empresaId: usuarioSesion?.empresaId,
        nombre: "",
        descripcion: "",
        atributosIds: [],
        multimediasIds: []
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarTipo && idEditarTipo !== 0) {
                const registro = rowData.find((element) => element.id === idEditarTipo);
                setTipoProducto(registro);
                setIsEdit(true);
            } else {
                // Resetear cuando no hay ID para editar (crear nuevo)
                setIsEdit(false);
                const registroReset = emptyRegistro || {
                    empresaId: usuarioSesion?.empresaId,
                    nombre: "",
                    descripcion: "",
                    atributosIds: [],
                    multimediasIds: []
                };
                setTipoProducto(registroReset);
            }
        };
        fetchData();
    }, [idEditarTipo, rowData]);  

    const validaciones = async () => {
        const validaNombre = tipoProducto.nombre === undefined || tipoProducto.nombre === null || tipoProducto.nombre.trim() === "";
        
        // Verificar si ya existe otro tipo de producto con el mismo nombre en la empresa (excepto el actual si estamos editando)
        let nombreDuplicado = false;
        if (!validaNombre && rowData) {
            nombreDuplicado = rowData.some(tipo => 
                tipo.nombre.toLowerCase() === tipoProducto.nombre.toLowerCase() &&
                tipo.empresaId === tipoProducto.empresaId &&
                tipo.id !== tipoProducto.id
            );
        }
        
        if (validaNombre) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'El nombre del tipo de producto es obligatorio' }),
                life: 3000,
            });
        }
        
        if (nombreDuplicado) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Ya existe un tipo de producto con ese nombre en su empresa' }),
                life: 3000,
            });
        }
        
        return (!validaNombre && !nombreDuplicado);
    };

    const guardarTipoProducto = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            try {                
                let resultado;
                if (isEdit) {
                    const tipoProductoData = {
                        empresaId: tipoProducto.empresaId || usuarioSesion?.empresaId,
                        nombre: tipoProducto.nombre.trim(),
                        activoSn: tipoProducto.activoSn || 'S',
                        descripcion: tipoProducto.descripcion?.trim() || null,
                        atributosIds: tipoProducto.atributosIds || [],
                        multimediasIds: tipoProducto.multimediasIds || []
                    };
                    resultado = await patchTipoProducto(idEditarTipo, tipoProductoData);
                    setRegistroResult("editado");
                } else {
                    const tipoProductoData = {
                        empresaId: tipoProducto.empresaId || usuarioSesion?.empresaId,
                        nombre: tipoProducto.nombre.trim(),
                        activoSn: tipoProducto.activoSn || 'S',
                        descripcion: tipoProducto.descripcion?.trim() || null
                    };
                    resultado = await postTipoProducto(tipoProductoData);
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

                setIdEditarTipo(null);  // null para volver al CRUD
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
        setIdEditarTipo(null);  // null para volver al CRUD
        setIsEdit(false);
        const registroReset = emptyRegistro || {
            empresaId: usuarioSesion?.empresaId,
            nombre: "",
            descripcion: "",
            atributosIds: [],
            multimediasIds: []
        };
        setTipoProducto(registroReset);
    };

    return (
        <div>
            <div className="grid TipoProducto">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosTipoProducto
                            tipoProducto={tipoProducto}
                            setTipoProducto={setTipoProducto}
                            estadoGuardando={estadoGuardando}
                            editable={editable}
                            isEdit={isEdit}
                            idTipo={idEditarTipo}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={intl.formatMessage({ id: 'Guardar' })}
                                    className="mr-2"
                                    onClick={guardarTipoProducto}
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

export default EditarTipoProducto;