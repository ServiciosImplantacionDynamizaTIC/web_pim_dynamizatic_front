"use client";

import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { getPlanificadores, patchPlanificador, postPlanificador } from "@/app/api-endpoints/planificador";
import EditarDatosPlanificador from "./EditarDatosPlanificador";
import TareasPlantilla from "./TareasPlantilla";
import { formatearFechaLocal_a_toISOString, getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarPlanificador = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const toast = useRef(null);
    const tareasPlantillaRef = useRef(null);
    const intl = useIntl();
    const [planificador, setPlanificador] = useState(emptyRegistro);
    const [planificadorIdActual, setPlanificadorIdActual] = useState(idEditar);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);

    useEffect(() => {
        setPlanificadorIdActual(idEditar);
        if (idEditar !== 0) {
            const registro = rowData.find((r) => r.id === idEditar);
            if (registro) {
                setPlanificador(registro);
            }
        } else {
            setPlanificador({
                ...emptyRegistro,
                activoSn: "S",
                plantillaSn: "N",
            });
        }
    }, [idEditar, rowData, emptyRegistro]);

    const validaciones = async () => {
        if (!planificador.nombre?.trim()) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "El nombre es obligatorio" }),
                life: 3000,
            });
            return false;
        }

        const lista = await getPlanificadores();
        const existe = lista.some((item) =>
            item.nombre?.trim().toLowerCase() === planificador.nombre.trim().toLowerCase() &&
            item.id !== planificador.id
        );

        if (existe) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Ya existe un planificador con ese nombre" }),
                life: 3000,
            });
            return false;
        }

        return true;
    };

    const guardarPlanificador = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (!(await validaciones())) {
            setEstadoGuardandoBoton(false);
            return;
        }

        const usuarioActual = getUsuarioSesion()?.id;
        const empresaId = Number(localStorage.getItem("empresa"));
        const fechaInicioValor = planificador.fechaInicio || planificador.fechaInicio;
        const fechaInicio = fechaInicioValor ? formatearFechaLocal_a_toISOString(new Date(fechaInicioValor)) : null;

        try {
            if (idEditar === 0) {
                const nuevoRegistro = await postPlanificador({
                    nombre: planificador.nombre?.trim(),
                    empresaId,
                    activoSn: planificador.activoSn || planificador.activoSn || "S",
                    plantillaSn: planificador.plantillaSn || planificador.plantillaSn || "N",
                    fechaInicio,
                    usuCreacion: Number(usuarioActual),
                });

                setPlanificadorIdActual(nuevoRegistro.id);

                if (tareasPlantillaRef.current) {
                    const ok = await tareasPlantillaRef.current.guardarTareas(nuevoRegistro.id);
                    if (!ok) {
                        setEstadoGuardandoBoton(false);
                        return;
                    }
                }

                setRegistroResult("insertado");
                setIdEditar(null);
            } else {
                await patchPlanificador(planificador.id, {
                    nombre: planificador.nombre?.trim(),
                    empresaId,
                    activoSn: planificador.activoSn || planificador.activoSn || "S",
                    plantillaSn: planificador.plantillaSn || planificador.plantillaSn || "N",
                    fechaInicio,
                    usuModificacion: Number(usuarioActual),
                });

                if (tareasPlantillaRef.current) {
                    const ok = await tareasPlantillaRef.current.guardarTareas();
                    if (!ok) {
                        setEstadoGuardandoBoton(false);
                        return;
                    }
                }

                setRegistroResult("editado");
                setIdEditar(null);
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Ha ocurrido un error guardando el registro" }),
                life: 3000,
            });
        }

        setEstadoGuardandoBoton(false);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: "Editar" }) : intl.formatMessage({ id: "Ver" })) : intl.formatMessage({ id: "Nuevo" });

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} position="top-right" />
                    <h2>{header} {intl.formatMessage({ id: "gestor de proyectos" })}</h2>
                    <EditarDatosPlanificador
                        planificador={planificador}
                        setPlanificador={setPlanificador}
                        estadoGuardando={estadoGuardando}
                    />
                    <Divider />
                    <TareasPlantilla
                        ref={tareasPlantillaRef}
                        idPlanificador={planificadorIdActual}
                        toastRef={toast}
                        editable={editable}
                    />
                    <div className="flex justify-content-end mt-3">
                        {editable && (
                            <Button
                                label={estadoGuardandoBoton ? `${intl.formatMessage({ id: "Guardando" })}...` : intl.formatMessage({ id: "Guardar" })}
                                icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                onClick={guardarPlanificador}
                                className="mr-2"
                                disabled={estadoGuardandoBoton}
                            />
                        )}
                        <Button
                            label={intl.formatMessage({ id: "Cancelar" })}
                            onClick={() => setIdEditar(null)}
                            className="p-button-secondary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarPlanificador;

