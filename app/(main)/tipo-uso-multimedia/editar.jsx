"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getTipoUsoMultimedia, postTipoUsoMultimedia, patchTipoUsoMultimedia } from "@/app/api-endpoints/tipo_uso_multimedia";
import EditarDatosTipoUsoMultimedia from "./EditarDatosTipoUsoMultimedia";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarTipoUsoMultimedia = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [tipoUsoMultimedia, setTipoUsoMultimedia] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setTipoUsoMultimedia(registro);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validaciones = async () => {
        const validaNombre = tipoUsoMultimedia.nombre === undefined || tipoUsoMultimedia.nombre === "";
        
        return (!validaNombre);
    };

    const guardarTipoUsoMultimedia = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...tipoUsoMultimedia };
            const usuarioActual = getUsuarioSesion()?.id;

            if (idEditar === 0) {
                objGuardar = {
                    empresaId: getUsuarioSesion()?.empresaId,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioCreacion: usuarioActual,
                };
                const nuevoRegistro = await postTipoUsoMultimedia(objGuardar);

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
                const tipoUsoMultimediaAeditar = {
                    id: objGuardar.id,
                    empresaId: objGuardar.empresaId,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                };
                
                await patchTipoUsoMultimedia(objGuardar.id, tipoUsoMultimediaAeditar);
                setIdEditar(null);
                setRegistroResult("editado");
            }
        } else {
            let errorMessage = intl.formatMessage({ id: 'Todos los campos obligatorios deben ser rellenados' });
                        
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: errorMessage,
                life: 3000,
            });
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
            <div className="grid TipoUsoMultimedia">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Tipo de Uso Multimedia' })).toLowerCase()}</h2>
                        <EditarDatosTipoUsoMultimedia
                            tipoUsoMultimedia={tipoUsoMultimedia}
                            setTipoUsoMultimedia={setTipoUsoMultimedia}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarTipoUsoMultimedia}
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

export default EditarTipoUsoMultimedia;