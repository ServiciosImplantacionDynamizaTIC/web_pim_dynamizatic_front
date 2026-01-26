"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getEstado, postEstado, patchEstado } from "@/app/api-endpoints/estado";
import EditarDatosEstado from "./EditarDatosEstado";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarEstado = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [estado, setEstado] = useState(emptyRegistro || {
        nombre: "",
        descripcion: ""
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setEstado(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validaciones = async () => {
        const validaNombre = estado.nombre === undefined || estado.nombre === "";
        
        return (!validaNombre);
    };

    const guardarEstado = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...estado };

            if (idEditar === 0) {
                objGuardar = {
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion
                };
                
                const nuevoRegistro = await postEstado(objGuardar);

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
                const estadoAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion
                };
                
                await patchEstado(objGuardar.id, estadoAeditar);
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
            <div className="grid Estado">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Estado' })).toLowerCase()}</h2>
                        <EditarDatosEstado
                            estado={estado}
                            setEstado={setEstado}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarEstado}
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

export default EditarEstado;