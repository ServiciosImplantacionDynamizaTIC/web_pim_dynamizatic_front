"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { patchCampoDinamico, postCampoDinamico } from "@/app/api-endpoints/campo_dinamico";
import EditarDatosCampoDinamico from "./EditarDatosCampoDinamico";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarCampoDinamico = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const tipoConOpciones = "select";

    // Estado principal del formulario
    const [campoDinamico, setCampoDinamico] = useState(
        emptyRegistro || {
            nombre: "",
            etiqueta: "",
            tipoCampo: "texto",
            opciones: null,
            activoSn: "S",
            obligatorioSn: "N",
        }
    );
    // Estado auxiliar para opciones de lista
    const [opcionesCampo, setOpcionesCampo] = useState({ multiselectSn: "N", valores: [] });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);

    // Convierte el string de opciones en un objeto usable
    const parsearOpciones = (opciones) => {
        if (!opciones) {
            return { multiselectSn: "N", valores: [] };
        }
        try {
            const json = JSON.parse(opciones);
            const valores = Array.isArray(json?.valores) ? json.valores : [];
            return {
                multiselectSn: json?.multiselectSn === "S" ? "S" : "N",
                valores: valores.filter((valor) => typeof valor === "string" && valor.trim() !== ""),
            };
        } catch (error) {
            const valores = opciones
                .split(",")
                .map((valor) => valor.trim())
                .filter((valor) => valor !== "");
            return { multiselectSn: "N", valores };
        }
    };

    // Genera el JSON a persistir en la columna opciones
    const construirOpciones = () => {
        const valores = opcionesCampo.valores
            .map((valor) => valor.trim())
            .filter((valor) => valor !== "");
        if (valores.length === 0) {
            return null;
        }
        return JSON.stringify({
            multiselectSn: opcionesCampo.multiselectSn === "S" ? "S" : "N",
            valores,
        });
    };

    // Carga datos del registro o reinicia el formulario
    useEffect(() => {
        if (idEditar !== 0) {
            const registro = rowData.find((element) => element.id === idEditar);
            if (registro) {
                setCampoDinamico(registro);
                setOpcionesCampo(parsearOpciones(registro.opciones));
            }
        } else {
            setCampoDinamico({
                ...emptyRegistro,
                nombre: "",
                etiqueta: "",
                tipoCampo: "texto",
                opciones: null,
                activoSn: "S",
                obligatorioSn: "N",
            });
            setOpcionesCampo({ multiselectSn: "N", valores: [] });
        }
    }, [idEditar, rowData, emptyRegistro]);

    // Validaciones minimas antes de guardar
    const validaciones = async () => {
        const validaNombre = !campoDinamico.nombre || campoDinamico.nombre.trim() === "";
        const validaTipoCampo = !campoDinamico.tipoCampo;
        const requiereOpciones = campoDinamico.tipoCampo === tipoConOpciones;
        const validaOpciones = requiereOpciones && opcionesCampo.valores.length === 0;

        const nombreNormalizado = (campoDinamico.nombre || "").trim().toLowerCase();
        const tipoNormalizado = (campoDinamico.tipoCampo || "").trim().toLowerCase();
        const duplicado = (rowData || []).some((registro) => {
            if (idEditar && registro.id === idEditar) {
                return false;
            }
            const nombreRegistro = (registro.nombre || "").trim().toLowerCase();
            const tipoRegistro = (registro.tipoCampo || "").trim().toLowerCase();
            return nombreRegistro === nombreNormalizado && tipoRegistro === tipoNormalizado;
        });

        if (duplicado) {
            toast.current?.show({
                severity: "warn",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Ya existe un campo dinamico con ese nombre y tipo" }),
                life: 4000,
            });
            return "duplicado";
        }

        return !(validaNombre || validaTipoCampo || validaOpciones);
    };

    // Guarda en alta o edicion segun idEditar
    const guardarCampoDinamico = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        const resultadoValidacion = await validaciones();
        if (resultadoValidacion !== true) {
            if (resultadoValidacion !== "duplicado") {
                toast.current?.show({
                    severity: "warn",
                    summary: intl.formatMessage({ id: "Campos obligatorios" }),
                    detail: intl.formatMessage({ id: "Hay campos obligatorios sin rellenar" }),
                    life: 4000,
                });
            }
            setEstadoGuardando(false);
            setEstadoGuardandoBoton(false);
            return;
        }
        const usuarioActual = getUsuarioSesion()?.id;
        const empresaActual = getUsuarioSesion()?.empresaId ?? Number(localStorage.getItem("empresa"));
        if (!usuarioActual || !empresaActual) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "No se pudo obtener la empresa o el usuario actual" }),
                life: 4000,
            });
            setEstadoGuardando(false);
            setEstadoGuardandoBoton(false);
            return;
        }
        const requiereOpciones = campoDinamico.tipoCampo === tipoConOpciones;
        const opcionesFinal = requiereOpciones ? construirOpciones() : null;

        if (idEditar === 0) {
            const nuevoRegistro = {
                ...campoDinamico,
                id: undefined,
                empresaId: empresaActual,
                nombre: campoDinamico.nombre.trim(),
                etiqueta: campoDinamico.nombre.trim(),
                tipoCampo: campoDinamico.tipoCampo || "texto",
                opciones: opcionesFinal,
                obligatorioSn: campoDinamico.obligatorioSn || "N",
                activoSn: campoDinamico.activoSn || "S",
                usuarioCreacion: usuarioActual,
            };
            try {
                await postCampoDinamico(nuevoRegistro);
                setRegistroResult("insertado");
                setIdEditar(null);
            } catch (error) {
                console.error("Error creando campo dinamico:", error);
                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail: error.response?.data?.error?.message || intl.formatMessage({ id: "Ha ocurrido un error creando el registro" }),
                    life: 5000,
                });
            }
        } else {
            const campoAeditar = {
                id: campoDinamico.id,
                empresaId: campoDinamico.empresaId || empresaActual,
                nombre: campoDinamico.nombre.trim(),
                etiqueta: campoDinamico.nombre.trim(),
                tipoCampo: campoDinamico.tipoCampo || "texto",
                opciones: opcionesFinal,
                obligatorioSn: campoDinamico.obligatorioSn || "N",
                activoSn: campoDinamico.activoSn || "S",
                usuarioCreacion: campoDinamico.usuarioCreacion,
                usuarioModificacion: usuarioActual,
            };
            try {
                await patchCampoDinamico(campoDinamico.id, campoAeditar);
                setRegistroResult("editado");
                setIdEditar(null);
            } catch (error) {
                console.error("Error editando campo dinamico:", error);
                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail: error.response?.data?.error?.message || intl.formatMessage({ id: "Ha ocurrido un error editando el registro" }),
                    life: 5000,
                });
            }
        }
        setEstadoGuardando(false);
        setEstadoGuardandoBoton(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: "Editar" }) : intl.formatMessage({ id: "Ver" })) : intl.formatMessage({ id: "Nuevo" });

    return (
        <div>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {intl.formatMessage({ id: "Campo dinamico" }).toLowerCase()}</h2>
                        <EditarDatosCampoDinamico
                            campoDinamico={campoDinamico}
                            setCampoDinamico={setCampoDinamico}
                            estadoGuardando={estadoGuardando}
                            opcionesCampo={opcionesCampo}
                            setOpcionesCampo={setOpcionesCampo}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: "Guardando" })}...` : intl.formatMessage({ id: "Guardar" })}
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarCampoDinamico}
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

export default EditarCampoDinamico;
