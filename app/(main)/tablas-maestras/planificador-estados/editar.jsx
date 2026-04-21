"use client";

import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { patchPlanificadorEstado, postPlanificadorEstado } from "@/app/api-endpoints/planificador_estado";
import { getUsuarioSesion } from "@/app/utility/Utils";
import EditarDatosPlanificadorEstado from "./EditarDatosPlanificadorEstado";
import { useIntl } from "react-intl";

const EditarPlanificadorEstado = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const [planificadorEstado, setPlanificadorEstado] = useState(crearEstadoVacio(emptyRegistro));
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);

    useEffect(() => {
        if (idEditar !== 0) {
            const registro = (rowData || []).find((element) => element.id === idEditar);
            if (registro) {
                setPlanificadorEstado(registro);
            }
        } else {
            setPlanificadorEstado(crearEstadoVacio(emptyRegistro));
        }
    }, [idEditar, rowData]);

    const existeNombreDuplicado = () => {
        const nombreNormalizado = planificadorEstado.nombre?.trim().toLowerCase();

        return (rowData || []).some((estado) => (
            estado.id !== planificadorEstado.id &&
            estado.nombre?.trim().toLowerCase() === nombreNormalizado
        ));
    };

    const guardar = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (!planificadorEstado.nombre?.trim()) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Todos los campos deben de ser rellenados" }),
                life: 3000,
            });
            setEstadoGuardandoBoton(false);
            return;
        }

        if (existeNombreDuplicado()) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Ya existe un estado del planificador con ese nombre" }),
                life: 3000,
            });
            setEstadoGuardandoBoton(false);
            return;
        }

        const usuarioActual = getUsuarioSesion()?.id;
        const empresaId = getUsuarioSesion()?.empresaId;

        try {
            if (idEditar === 0) {
                const objGuardar = {
                    nombre: planificadorEstado.nombre,
                    activoSn: planificadorEstado.activoSn || planificadorEstado.activoSn || "N",
                    finalizadoSn: planificadorEstado.finalizadoSn || planificadorEstado.finalizadoSn || "N",
                    empresaId,
                    usuCreacion: usuarioActual,
                };

                const nuevoRegistro = await postPlanificadorEstado(objGuardar);
                if (nuevoRegistro?.id) {
                    setRegistroResult("insertado");
                    setIdEditar(null);
                }
            } else {
                const objGuardar = {
                    nombre: planificadorEstado.nombre,
                    activoSn: planificadorEstado.activoSn || planificadorEstado.activoSn || "N",
                    finalizadoSn: planificadorEstado.finalizadoSn || planificadorEstado.finalizadoSn || "N",
                    empresaId,
                    usuModificacion: usuarioActual,
                };

                await patchPlanificadorEstado(planificadorEstado.id, objGuardar);
                setRegistroResult("editado");
                setIdEditar(null);
            }
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: error?.response?.data?.error?.message || error?.response?.data?.message || intl.formatMessage({ id: "Error al crear el estado del planificador" }),
                life: 4000,
            });
        } finally {
            setEstadoGuardandoBoton(false);
        }
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: "Editar" }) : intl.formatMessage({ id: "Ver" })) : intl.formatMessage({ id: "Nuevo" });

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} position="top-right" />
                    <h2>{header} {intl.formatMessage({ id: "estado del planificador" })}</h2>
                    <EditarDatosPlanificadorEstado
                        planificadorEstado={planificadorEstado}
                        setPlanificadorEstado={setPlanificadorEstado}
                        estadoGuardando={estadoGuardando}
                    />
                    <div className="flex justify-content-end mt-2">
                        {editable && (
                            <Button
                                label={estadoGuardandoBoton ? `${intl.formatMessage({ id: "Guardando" })}...` : intl.formatMessage({ id: "Guardar" })}
                                icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                onClick={guardar}
                                className="mr-2"
                                disabled={estadoGuardandoBoton}
                            />
                        )}
                        <Button label={intl.formatMessage({ id: "Cancelar" })} onClick={() => setIdEditar(null)} className="p-button-secondary" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const crearEstadoVacio = (emptyRegistro) => ({
    ...emptyRegistro,
    finalizadoSn: "N",
});

export default EditarPlanificadorEstado;

