"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getPropiedad, postPropiedad, patchPropiedad, gePropiedades } from "@/app/api-endpoints/propiedad";
import { getGrupoPropiedades } from "@/app/api-endpoints/grupo_propiedad";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosPropiedad from "./EditarDatosPropiedad";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarPropiedad = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable, tipoDePropiedad = 'atributo' }) => {
    const intl = useIntl();
    const toast = useRef(null);

    const esAtributo = tipoDePropiedad === 'atributo';
    const nombreTipoSingular = esAtributo ? intl.formatMessage({ id: 'Atributo' }) : intl.formatMessage({ id: 'Campo Dinámico' });
    const tipoGrupoCorrespondiente = esAtributo ? 'grupo_atributos' : 'grupo_campos_dinamicos';

    const [atributo, setPropiedad] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        grupoPropiedadId: null,
        tipoDato: "texto",
        unidadMedida: "",
        obligatorioSn: "N",
        multivalorSn: "N",
        valoresPermitidos: "",
        activoSn: "S",
        tipoDePropiedad: tipoDePropiedad
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);
    const [listaGrupoPropiedades, setListaGrupoPropiedades] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Cargar grupos de propiedades disponibles (filtrados por tipo correspondiente)
            try {
                const filtro = JSON.stringify({ where: { and: { empresaId: getUsuarioSesion().empresaId, activoSn: 'S', tipoDeGrupoPropiedad: tipoGrupoCorrespondiente } } });
                const grupopropiedades = await getGrupoPropiedades(filtro);
                setListaGrupoPropiedades(grupopropiedades || []);
            } catch (error) {
                console.error('Error cargando grupos de propiedades:', error);
                setListaGrupoPropiedades([]);
            }

            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setPropiedad(registro);

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
        const validaGrupoPropiedad = !atributo.grupoPropiedadId;
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
            return false;
        }

        // Validación de duplicados
        if (!validaNombre && !validaGrupoPropiedad) {
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            grupoPropiedadId: atributo.grupoPropiedadId,
                            nombre: atributo.nombre.trim()
                        }
                    }
                });

                const existentes = await gePropiedades(filtro);
                const duplicado = existentes.find(a => a.id !== atributo.id && a.nombre.trim().toLowerCase() === atributo.nombre.trim().toLowerCase());

                if (duplicado) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Ya existe un registro con ese nombre dentro del mismo grupo.' }),
                        life: 5000,
                    });
                    return false;
                }
            } catch (error) {
                console.error('Error validando duplicados:', error);
                return false;
            }
        }

        // Validación final de campos obligatorios
        if (validaNombre || validaTipoDato || validaGrupoPropiedad) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Todos los campos obligatorios deben ser rellenados' }),
                life: 3000,
            });
            return false;
        }

        return true;
    };

    const guardarPropiedad = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            let objGuardar = { ...atributo };
            delete objGuardar.orden;
            const usuarioActual = getUsuarioSesion()?.id;
            delete objGuardar.grupoPropiedadNombre;

            if (idEditar === 0) {
                delete objGuardar.id;
                objGuardar['usuarioCreacion'] = usuarioActual;
                objGuardar['tipoDePropiedad'] = tipoDePropiedad;

                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'S';
                }

                const nuevoRegistro = await postPropiedad(objGuardar);

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
                    grupoPropiedadId: objGuardar.grupoPropiedadId,
                    tipoDato: objGuardar.tipoDato || "texto",
                    unidadMedida: objGuardar.unidadMedida,
                    obligatorioSn: objGuardar.obligatorioSn || 'N',
                    multivalorSn: objGuardar.multivalorSn || 'N',
                    valoresPermitidos: objGuardar.valoresPermitidos,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                    tipoDePropiedad: tipoDePropiedad,
                };

                await patchPropiedad(objGuardar.id, atributoAeditar);
                await editarArchivos(atributo, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
                setIdEditar(null);
                setRegistroResult("editado");
            }
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
            <div className="grid Propiedad">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {nombreTipoSingular.toLowerCase()}</h2>
                        <EditarDatosPropiedad
                            atributo={atributo}
                            setPropiedad={setPropiedad}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                            listaGrupoPropiedades={listaGrupoPropiedades}
                            tipoDePropiedad={tipoDePropiedad}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })}
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarPropiedad}
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

export default EditarPropiedad;