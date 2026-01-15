"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getCatalogo, postCatalogo, patchCatalogo } from "@/app/api-endpoints/catalogo";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosCatalogo from "./EditarDatosCatalogo";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarCatalogo = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [catalogo, setCatalogo] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        tipo: "digital",
        estado: "borrador",
        fechaPublicacion: null,
        fechaVencimiento: null,
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
                setCatalogo(registro);
                
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(catalogo, listaTipoArchivos);
    }

    const validaciones = async () => {
        const validaNombre = catalogo.nombre === undefined || catalogo.nombre === "";
        const validaTipo = catalogo.tipo === undefined || catalogo.tipo === "";
        const validaEstado = catalogo.estado === undefined || catalogo.estado === "";
        const validaImagenes = validacionesImagenes();
        
        // Validar que la fecha de vencimiento no sea anterior a la fecha de publicación
        let validaFechas = false;
        if (catalogo.fechaPublicacion && catalogo.fechaVencimiento) {
            const fechaPublicacion = new Date(catalogo.fechaPublicacion);
            const fechaVencimiento = new Date(catalogo.fechaVencimiento);
            
            if (fechaVencimiento < fechaPublicacion) {
                validaFechas = true;
                toast.current?.show({
                    severity: 'error',
                    summary: 'ERROR',
                    detail: intl.formatMessage({ id: 'La fecha de vencimiento no puede ser anterior a la fecha de publicación' }),
                    life: 3000,
                });
            }
        }

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }
        
        return (!validaNombre && !validaTipo && !validaEstado && !validaFechas);
    };

    const guardarCatalogo = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...catalogo };
            const usuarioActual = getUsuarioSesion()?.id;

            if (idEditar === 0) {
                delete objGuardar.id;
                objGuardar['usuarioCreacion'] = usuarioActual;
                objGuardar['empresaId'] = getUsuarioSesion()?.empresaId;
                if (objGuardar.fechaPublicacion == '') {
                    delete objGuardar['fechaPublicacion'];
                }
                if (objGuardar.fechaVencimiento == '') {
                    delete objGuardar['fechaVencimiento'];
                }
                
                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'S';
                }
                
                const nuevoRegistro = await postCatalogo(objGuardar);

                if (nuevoRegistro?.id) {
                    await procesarArchivosNuevoRegistro(catalogo, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
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
                const catalogoAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    tipo: objGuardar.tipo || "digital",
                    estado: objGuardar.estado || "borrador",
                    fechaPublicacion: objGuardar.fechaPublicacion,
                    fechaVencimiento: objGuardar.fechaVencimiento,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                    empresaId: getUsuarioSesion()?.empresaId,
                };
                
                await patchCatalogo(objGuardar.id, catalogoAeditar);
                await editarArchivos(catalogo, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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
            <div className="grid Catalogo">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Catálogo' })).toLowerCase()}</h2>
                        <EditarDatosCatalogo
                            catalogo={catalogo}
                            setCatalogo={setCatalogo}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarCatalogo}
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

export default EditarCatalogo;