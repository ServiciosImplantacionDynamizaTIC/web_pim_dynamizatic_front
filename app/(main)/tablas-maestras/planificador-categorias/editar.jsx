"use client";

import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { patchPlanificadorCategoria, postPlanificadorCategoria } from "@/app/api-endpoints/planificador_categoria";
import { getUsuarioSesion } from "@/app/utility/Utils";
import EditarDatosPlanificadorCategoria from "./EditarDatosPlanificadorCategoria";
import { useIntl } from "react-intl";

const EditarPlanificadorCategoria = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const [planificadorCategoria, setPlanificadorCategoria] = useState(emptyRegistro);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);

    useEffect(() => {
        if (idEditar !== 0) {
            const registro = rowData.find((element) => element.id === idEditar);
            if (registro) {
                setPlanificadorCategoria(registro);
            }
        }
    }, [idEditar, rowData]);

    const guardar = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (!planificadorCategoria.nombre) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Todos los campos deben de ser rellenados" }),
                life: 3000,
            });
            setEstadoGuardandoBoton(false);
            return;
        }

        const usuarioActual = getUsuarioSesion()?.id;
        const objGuardar = { ...planificadorCategoria };
        delete objGuardar.nombreEmpresa;

        if (idEditar === 0) {
            delete objGuardar.id;
            objGuardar.usuCreacion = usuarioActual;
            objGuardar.empresaId = getUsuarioSesion()?.empresaId;

            const nuevoRegistro = await postPlanificadorCategoria(objGuardar);
            if (nuevoRegistro?.id) {
                setRegistroResult("insertado");
                setIdEditar(null);
            }
        } else {
            objGuardar.usuModificacion = usuarioActual;
            objGuardar.empresaId = getUsuarioSesion()?.empresaId;
            await patchPlanificadorCategoria(objGuardar.id, objGuardar);
            setRegistroResult("editado");
            setIdEditar(null);
        }

        setEstadoGuardandoBoton(false);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: "Editar" }) : intl.formatMessage({ id: "Ver" })) : intl.formatMessage({ id: "Nuevo" });

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} position="top-right" />
                    <h2>{header} {intl.formatMessage({ id: "Categoría del planificador" })}</h2>
                    <EditarDatosPlanificadorCategoria
                        planificadorCategoria={planificadorCategoria}
                        setPlanificadorCategoria={setPlanificadorCategoria}
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

export default EditarPlanificadorCategoria;
