"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getAtributo, postAtributo, patchAtributo } from "@/app/api-endpoints/atributo";
import { getGrupoAtributos } from "@/app/api-endpoints/grupo_atributo";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosAtributo from "./EditarDatosAtributo";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarAtributo = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [atributo, setAtributo] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        grupoAtributoId: null,
        tipoDato: "texto",
        unidadMedida: "",
        obligatorioSn: "N",
        multivalorSn: "N",
        valoresPermitidos: "",
        orden: 0,
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);
    const [listaGrupoAtributos, setListaGrupoAtributos] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Cargar grupos de atributos disponibles
            try {
                const filtro = JSON.stringify({ where: { and: { empresaId: getUsuarioSesion().empresaId, activoSn: 'S' },  } });
                const grupoAtributos = await getGrupoAtributos(filtro);
                setListaGrupoAtributos(grupoAtributos || []);
            } catch (error) {
                console.error('Error cargando grupos de atributos:', error);
                setListaGrupoAtributos([]);
            }

            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setAtributo(registro);
                
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(atributo, listaTipoArchivos);
    }

    const validaciones = async () => {
        const validaNombre = atributo.nombre === undefined || atributo.nombre === "";
        const validaTipoDato = atributo.tipoDato === undefined || atributo.tipoDato === "";
        const validaGrupoAtributo = !atributo.grupoAtributoId;
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }
        
        return (!validaNombre && !validaTipoDato && !validaGrupoAtributo);
    };

    const guardarAtributo = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...atributo };
            objGuardar['orden'] = objGuardar.orden || 0;
            const usuarioActual = getUsuarioSesion()?.id;
            delete objGuardar.grupoAtributonombre;

            if (idEditar === 0) {
                delete objGuardar.id;
                objGuardar['usuarioCreacion'] = usuarioActual;
                
                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'S';
                }
                
                const nuevoRegistro = await postAtributo(objGuardar);

                if (nuevoRegistro?.id) {
                    await procesarArchivosNuevoRegistro(atributo, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
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
                const atributoAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    grupoAtributoId: objGuardar.grupoAtributoId,
                    tipoDato: objGuardar.tipoDato || "texto",
                    unidadMedida: objGuardar.unidadMedida,
                    obligatorioSn: objGuardar.obligatorioSn || 'N',
                    multivalorSn: objGuardar.multivalorSn || 'N',
                    valoresPermitidos: objGuardar.valoresPermitidos,
                    orden: objGuardar.orden || 0,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                };
                
                await patchAtributo(objGuardar.id, atributoAeditar);
                await editarArchivos(atributo, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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
            <div className="grid Atributo">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Atributo' })).toLowerCase()}</h2>
                        <EditarDatosAtributo
                            atributo={atributo}
                            setAtributo={setAtributo}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                            listaGrupoAtributos={listaGrupoAtributos}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarAtributo}
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

export default EditarAtributo;