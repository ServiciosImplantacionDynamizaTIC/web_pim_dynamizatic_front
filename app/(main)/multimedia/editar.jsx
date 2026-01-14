"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getMultimedia, postMultimedia, patchMultimedia } from "@/app/api-endpoints/multimedia";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosMultimedia from "./EditarDatosMultimedia";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarMultimedia = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [multimedia, setMultimedia] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        tipo: "imagen",
        formato: "",
        archivoOriginal: "",
        archivoThumbnail: "",
        archivoMedio: "",
        archivoGrande: "",
        tamañoBytes: null,
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setMultimedia(registro);
                
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(multimedia, listaTipoArchivos);
    }

    const validaciones = async () => {
        const validaNombre = multimedia.nombre === undefined || multimedia.nombre === "";
        const validaArchivoOriginal = multimedia.archivoOriginal === undefined || multimedia.archivoOriginal === "";
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }
        
        return (!validaNombre && !validaArchivoOriginal);
    };

    const guardarMultimedia = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...multimedia };
            const usuarioActual = getUsuarioSesion()?.id;
            objGuardar['empresaId'] = getUsuarioSesion()?.empresaId;
            if (idEditar === 0) {
                delete objGuardar.id;
                objGuardar['usuarioCreacion'] = usuarioActual;
                
                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'S';
                }
                
                const nuevoRegistro = await postMultimedia(objGuardar);

                if (nuevoRegistro?.id) {
                    await procesarArchivosNuevoRegistro(multimedia, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
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
                const multimediaAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    tipo: objGuardar.tipo || "imagen",
                    formato: objGuardar.formato,
                    archivoOriginal: objGuardar.archivoOriginal,
                    archivoThumbnail: objGuardar.archivoThumbnail,
                    archivoMedio: objGuardar.archivoMedio,
                    archivoGrande: objGuardar.archivoGrande,
                    tamañoBytes: objGuardar.tamañoBytes,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                };
                
                await patchMultimedia(objGuardar.id, multimediaAeditar);
                await editarArchivos(multimedia, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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
            <div className="grid Multimedia">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Multimedia' })).toLowerCase()}</h2>
                        <EditarDatosMultimedia
                            multimedia={multimedia}
                            setMultimedia={setMultimedia}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarMultimedia}
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

export default EditarMultimedia;