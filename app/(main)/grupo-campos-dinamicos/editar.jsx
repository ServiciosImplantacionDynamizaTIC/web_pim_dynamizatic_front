"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getGruposCampoDinamicos, postGrupoCampoDinamico, patchGrupoCampoDinamico } from "@/app/api-endpoints/grupo_campo_dinamico";
import { editarArchivos, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils";
import EditarDatosGrupoCampoDinamico from "./EditarDatosGrupoCampoDinamico";
import "primeicons/primeicons.css";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarGrupoCampoDinamico = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);

    const [grupoCampoDinamico, setGrupoCampoDinamico] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        orden: 0,
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== null && idEditar !== undefined && idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                if (!registro) {
                    return;
                }
                setGrupoCampoDinamico(registro);

                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            } else {
                setGrupoCampoDinamico(emptyRegistro || {
                    nombre: "",
                    descripcion: "",
                    orden: 0,
                    activoSn: "S"
                });
                setListaTipoArchivosAntiguos([]);
            }
        };
        fetchData();
    }, [emptyRegistro, idEditar, rowData, listaTipoArchivos]);

    const validacionesImagenes = () => {
        return validarImagenes(grupoCampoDinamico, listaTipoArchivos);
    };

    const validaciones = async () => {
        const validaNombre = grupoCampoDinamico.nombre === undefined || grupoCampoDinamico.nombre === "";
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Las imagenes deben de tener el formato correcto" }),
                life: 3000,
            });
            return false;
        }

        try {
            const filtro = JSON.stringify({
                where: {
                    and: {
                        nombre: grupoCampoDinamico.nombre.trim(),
                        empresaId: getUsuarioSesion()?.empresaId,
                    },
                },
            });

            const existentes = await getGruposCampoDinamicos(filtro);
            const duplicado = existentes.find((g) => g.id !== grupoCampoDinamico.id);

            if (duplicado) {
                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail: intl.formatMessage({ id: "Ya existe un Grupo de Campos dinámicos con el mismo nombre, asigna uno diferente" }),
                    life: 5000,
                });
                return false;
            }
        } catch (error) {
            console.error("Error validando duplicados:", error);
            return false;
        }

        if (validaNombre) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Todos los campos obligatorios deben ser rellenados" }),
                life: 3000,
            });
            return false;
        }

        return true;
    };

    const guardarGrupoCampoDinamico = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            let objGuardar = { ...grupoCampoDinamico };
            const usuarioActual = getUsuarioSesion()?.id;
            objGuardar["orden"] = objGuardar.orden || 0;

            if (idEditar === 0) {
                delete objGuardar.id;
                objGuardar["usuarioCreacion"] = usuarioActual;
                objGuardar["empresaId"] = getUsuarioSesion()?.empresaId;
                if (objGuardar.activoSn === "") {
                    objGuardar.activoSn = "S";
                }

                const nuevoRegistro = await postGrupoCampoDinamico(objGuardar);

                if (nuevoRegistro?.id) {
                    await procesarArchivosNuevoRegistro(grupoCampoDinamico, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
                    setRegistroResult("insertado");
                    setIdEditar(null);
                } else {
                    toast.current?.show({
                        severity: "error",
                        summary: "ERROR",
                        detail: intl.formatMessage({ id: "Ha ocurrido un error creando el registro" }),
                        life: 3000,
                    });
                }
            } else {
                const grupoCampoDinamicoAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    orden: objGuardar.orden || 0,
                    activoSn: objGuardar.activoSn || "N",
                    usuarioModificacion: usuarioActual,
                    empresaId: getUsuarioSesion()?.empresaId,
                };

                await patchGrupoCampoDinamico(objGuardar.id, grupoCampoDinamicoAeditar);
                await editarArchivos(grupoCampoDinamico, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: "Editar" }) : intl.formatMessage({ id: "Ver" })) : intl.formatMessage({ id: "Nuevo" });

    return (
        <div>
            <div className="grid GrupoCampoDinamico">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: "Grupo de Campos dinámicos" })).toLowerCase()}</h2>
                        <EditarDatosGrupoCampoDinamico
                            grupoCampoDinamico={grupoCampoDinamico}
                            setGrupoCampoDinamico={setGrupoCampoDinamico}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: "Guardando" })}...` : intl.formatMessage({ id: "Guardar" })}
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarGrupoCampoDinamico}
                                    className="mr-2"
                                    disabled={estadoGuardandoBoton}
                                />
                            )}
                            <Button label={intl.formatMessage({ id: "Cancelar" })} onClick={cancelarEdicion} className="p-button-secondary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarGrupoCampoDinamico;
