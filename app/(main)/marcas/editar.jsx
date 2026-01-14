"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getMarca, postMarca, patchMarca } from "@/app/api-endpoints/marca";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosMarca from "./EditarDatosMarca";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarMarca = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [marca, setMarca] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        sitioWeb: "",
        paisOrigen: "",
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
                setMarca(registro);
                
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(marca, listaTipoArchivos);
    }

    const validaciones = async () => {
        const validaNombre = marca.nombre === undefined || marca.nombre === "";
        /*const validaLogo = marca.logo === undefined || marca.logo === "" || marca.logo === null;
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }*/
        
        return (!validaNombre /*&& !validaLogo*/);
    };

    const guardarMarca = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...marca };
            const usuarioActual = getUsuarioSesion()?.id;

            if (idEditar === 0) {

                objGuardar= {
                    empresaId: getUsuarioSesion()?.empresaId,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    sitioWeb: objGuardar.sitioWeb,
                    paisOrigen: objGuardar.paisOrigen,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioCreacion: usuarioActual,
                };
                const nuevoRegistro = await postMarca(objGuardar);

                if (nuevoRegistro?.id) {
                    await procesarArchivosNuevoRegistro(marca, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
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
                const marcaAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    sitioWeb: objGuardar.sitioWeb,
                    paisOrigen: objGuardar.paisOrigen,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                };
                
                await patchMarca(objGuardar.id, marcaAeditar);
                await editarArchivos(marca, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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
            <div className="grid Marca">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Marca' })).toLowerCase()}</h2>
                        <EditarDatosMarca
                            marca={marca}
                            setMarca={setMarca}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarMarca}
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

export default EditarMarca;