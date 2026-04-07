"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getCamposDinamicos, patchCampoDinamico, postCampoDinamico } from "@/app/api-endpoints/campo_dinamico";
import { getGruposCampoDinamicos } from "@/app/api-endpoints/grupo_campo_dinamico";
import {
    getGrupoCampoDinamicoDetalles,
    deleteGrupoCampoDinamicoDetalle,
    postGrupoCampoDinamicoDetalle,
} from "@/app/api-endpoints/grupo_campo_dinamico_detalle";
import EditarDatosCampoDinamico from "./EditarDatosCampoDinamico";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarCampoDinamico = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);

    const [campoDinamico, setCampoDinamico] = useState(emptyRegistro || {
        nombre: "",
        etiqueta: "",
        descripcion: "",
        tipoCampo: "texto",
        opciones: null,
        activoSn: "S",
        obligatorioSn: "N",
        orden: 0,
    });
    const [opcionesCampo, setOpcionesCampo] = useState({
        multiselectSn: "N",
        valores: [],
        tipoExtendido: null,
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [gruposDisponibles, setGruposDisponibles] = useState([]);
    const [gruposSeleccionadosIds, setGruposSeleccionadosIds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setGruposSeleccionadosIds([]);

            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: "S",
                        },
                    },
                    order: ["orden ASC", "nombre ASC"],
                });
                const grupos = await getGruposCampoDinamicos(filtro);
                setGruposDisponibles(grupos || []);
            } catch (error) {
                console.error("Error cargando grupos de campos dinámicos:", error);
                setGruposDisponibles([]);
            }

            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);

                if (registro) {
                    let opcionesParseadas = { multiselectSn: "N", valores: [] };
                    if (registro.opciones) {
                        try {
                            const json = JSON.parse(registro.opciones);
                            opcionesParseadas = {
                                multiselectSn: json?.multiselectSn === "S" ? "S" : "N",
                                valores: Array.isArray(json?.valores) ? json.valores : [],
                                tipoExtendido: json?.tipoExtendido || null,
                            };
                        } catch (_error) {
                            opcionesParseadas = { multiselectSn: "N", valores: [], tipoExtendido: null };
                        }
                    }

                    setCampoDinamico({
                        ...registro,
                        tipoCampo:
                            registro.tipoCampo === "select"
                                ? (opcionesParseadas.multiselectSn === "S" ? "multiselect" : "lista")
                                : (opcionesParseadas.tipoExtendido || registro.tipoCampo || "texto"),
                    });
                    setOpcionesCampo(opcionesParseadas);

                    try {
                        const detalles = await getGrupoCampoDinamicoDetalles(
                            JSON.stringify({
                                where: {
                                    and: {
                                        campoDinamicoId: Number(registro.id),
                                    },
                                },
                                order: ["id ASC"],
                            })
                        );

                        const gruposIds = Array.from(
                            new Set(
                                (detalles || [])
                                    .map((detalle) =>
                                        Number(
                                            detalle?.grupoCampoDinamicoId ??
                                            detalle?.grupo_campo_dinamico_id ??
                                            0
                                        )
                                    )
                                    .filter((grupoId) => grupoId > 0)
                            )
                        );
                        setGruposSeleccionadosIds(gruposIds);
                    } catch (_error) {
                        setGruposSeleccionadosIds([]);
                    }
                }
            } else {
                setCampoDinamico({
                    ...(emptyRegistro || {}),
                    nombre: "",
                    etiqueta: "",
                    descripcion: "",
                    tipoCampo: "texto",
                    opciones: null,
                    activoSn: "S",
                    obligatorioSn: "N",
                    orden: 0,
                });
                setOpcionesCampo({ multiselectSn: "N", valores: [], tipoExtendido: null });
                setGruposSeleccionadosIds([]);
            }
        };

        fetchData();
    }, [idEditar, rowData, emptyRegistro]);

    const validaciones = async (idsGruposSeleccionadosNormalizados) => {
        const validaNombre = !campoDinamico.nombre || campoDinamico.nombre.trim() === "";
        const validaTipoCampo = !campoDinamico.tipoCampo;
        const validaGrupo = !idsGruposSeleccionadosNormalizados.length;
        const esTipoConOpciones =
            campoDinamico.tipoCampo === "lista" || campoDinamico.tipoCampo === "multiselect";
        const validaOpciones = esTipoConOpciones && !(opcionesCampo?.valores || []).length;

        if (!validaNombre) {
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            nombre: campoDinamico.nombre.trim(),
                        },
                    },
                });

                const existentes = await getCamposDinamicos(filtro);
                const duplicado = (existentes || []).find((campo) => campo.id !== campoDinamico.id);

                if (duplicado) {
                    toast.current?.show({
                        severity: "error",
                        summary: "ERROR",
                        detail: intl.formatMessage({ id: "Ya existe un campo dinámico con ese nombre" }),
                        life: 5000,
                    });
                    return false;
                }
            } catch (error) {
                console.error("Error validando duplicados:", error);
                return false;
            }
        }

        if (validaNombre || validaTipoCampo || validaGrupo || validaOpciones) {
            let detail = intl.formatMessage({ id: "Todos los campos obligatorios deben ser rellenados" });

            if (validaGrupo) {
                detail = intl.formatMessage({ id: "Debe seleccionar un grupo de campos dinámicos" });
            }

            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail,
                life: 3000,
            });
            return false;
        }

        return true;
    };

    const guardarRelacionesGrupos = async (campoId, usuarioActual, idsSeleccionados) => {
        const detallesExistentes = await getGrupoCampoDinamicoDetalles(
            JSON.stringify({
                where: {
                    and: {
                        campoDinamicoId: Number(campoId),
                    },
                },
                order: ["id ASC"],
            })
        );

        const mapaPorGrupo = new Map();
        (detallesExistentes || []).forEach((detalle) => {
            const grupoId = Number(
                detalle?.grupoCampoDinamicoId ?? detalle?.grupo_campo_dinamico_id ?? 0
            );
            if (grupoId > 0 && !mapaPorGrupo.has(grupoId)) {
                mapaPorGrupo.set(grupoId, detalle);
            }
        });

        for (const grupoId of idsSeleccionados) {
            const detalleExistente = mapaPorGrupo.get(grupoId);

            if (detalleExistente?.id) {
                continue;
            } else {
                await postGrupoCampoDinamicoDetalle({
                    campoDinamicoId: Number(campoId),
                    grupoCampoDinamicoId: grupoId,
                    usuarioCreacion: usuarioActual,
                });
            }
        }

        for (const detalle of detallesExistentes || []) {
            const grupoId = Number(
                detalle?.grupoCampoDinamicoId ?? detalle?.grupo_campo_dinamico_id ?? 0
            );
            if (!grupoId || idsSeleccionados.includes(grupoId)) {
                continue;
            }

            await deleteGrupoCampoDinamicoDetalle(detalle.id);
        }
    };

    const guardarCampoDinamico = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        const idsGruposSeleccionadosNormalizados = Array.from(
            new Set(
                (gruposSeleccionadosIds || [])
                    .map((grupoId) => Number(grupoId || 0))
                    .filter((grupoId) => grupoId > 0)
            )
        );

        if (await validaciones(idsGruposSeleccionadosNormalizados)) {
            const usuarioActual = getUsuarioSesion()?.id;
            const empresaActual = getUsuarioSesion()?.empresaId;

            const esLista = campoDinamico.tipoCampo === "lista" || campoDinamico.tipoCampo === "multiselect";
            const esBooleano = campoDinamico.tipoCampo === "booleano";
            const esTextoLargo = campoDinamico.tipoCampo === "texto largo";
            const usaTipoExtendido = esBooleano || esTextoLargo;
            const opcionesFinal = esLista
                ? JSON.stringify({
                    multiselectSn: campoDinamico.tipoCampo === "multiselect" ? "S" : "N",
                    valores: opcionesCampo.valores,
                    tipoExtendido: null,
                })
                : usaTipoExtendido
                    ? JSON.stringify({
                        multiselectSn: "N",
                        valores: [],
                        tipoExtendido: campoDinamico.tipoCampo,
                    })
                    : null;

            const objGuardar = {
                empresaId: campoDinamico.empresaId || empresaActual,
                nombre: campoDinamico.nombre.trim(),
                etiqueta: campoDinamico.nombre.trim(),
                descripcion: campoDinamico.descripcion || null,
                tipoCampo: esLista ? "select" : (usaTipoExtendido ? "texto" : (campoDinamico.tipoCampo || "texto")),
                opciones: opcionesFinal,
                obligatorioSn: campoDinamico.obligatorioSn || "N",
                activoSn: campoDinamico.activoSn || "S",
                orden: Number(campoDinamico.orden || 0),
            };

            try {
                let campoIdGuardado = campoDinamico.id;

                if (idEditar === 0) {
                    const nuevoRegistro = await postCampoDinamico({
                        ...objGuardar,
                        empresaId: empresaActual,
                        usuarioCreacion: usuarioActual,
                    });
                    campoIdGuardado = nuevoRegistro?.id;
                } else {
                    await patchCampoDinamico(campoDinamico.id, {
                        ...objGuardar,
                        usuarioModificacion: usuarioActual,
                    });
                }

                if (campoIdGuardado) {
                    await guardarRelacionesGrupos(
                        campoIdGuardado,
                        usuarioActual,
                        idsGruposSeleccionadosNormalizados
                    );
                    setRegistroResult(idEditar === 0 ? "insertado" : "editado");
                    setIdEditar(null);
                }
            } catch (error) {
                console.error("Error guardando campo dinámico:", error);
                const detallesError = error?.response?.data?.error?.details;
                const detalleValidacion =
                    Array.isArray(detallesError) && detallesError.length > 0
                        ? detallesError.map((d) => d?.message).filter(Boolean).join(" | ")
                        : null;

                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail:
                        detalleValidacion ||
                        error?.response?.data?.error?.message ||
                        intl.formatMessage({
                            id: idEditar === 0
                                ? "Ha ocurrido un error creando el registro"
                                : "Ha ocurrido un error editando el registro",
                        }),
                    life: 5000,
                });
            }
        }

        setEstadoGuardandoBoton(false);
        setEstadoGuardando(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null);
    };

    const header = idEditar > 0
        ? (editable ? intl.formatMessage({ id: "Editar" }) : intl.formatMessage({ id: "Ver" }))
        : intl.formatMessage({ id: "Nuevo" });

    return (
        <div>
            <div className="grid CampoDinamico">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {intl.formatMessage({ id: "Campo dinámico" }).toLowerCase()}</h2>

                        <EditarDatosCampoDinamico
                            campoDinamico={campoDinamico}
                            setCampoDinamico={setCampoDinamico}
                            estadoGuardando={estadoGuardando}
                            opcionesCampo={opcionesCampo}
                            setOpcionesCampo={setOpcionesCampo}
                            editable={editable}
                            gruposDisponibles={gruposDisponibles}
                            gruposSeleccionadosIds={gruposSeleccionadosIds}
                            setGruposSeleccionadosIds={setGruposSeleccionadosIds}
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
                            <Button
                                label={intl.formatMessage({ id: "Cancelar" })}
                                onClick={cancelarEdicion}
                                className="p-button-secondary"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarCampoDinamico;
