"use client";

import React from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Dropdown } from "primereact/dropdown";
import TareasPlantilla from "@/app/(main)/planificador/TareasPlantilla";
import { useIntl } from "react-intl";

const EditarDatosProductoPlanificador = ({
    producto,
    editable,
    toastRef,
    guardando,
    cargandoPlanificadores,
    planificadores,
    planificadorId,
    fechaInicio,
    productoPlanificador,
    tareasPlantillaRef,
    dialogoCambioPlanificador,
    dialogoCambioFecha,
    cambiarPlanificador,
    cambiarFechaInicioPlanificador,
    cancelarCambioPlanificador,
    confirmarCambioPlanificador,
    cancelarCambioFechaInicio,
    confirmarCambioFechaInicio,
    guardarTareasProducto,
    setDetallesRellenados,
    puedeCrearPlanificador,
    puedeBorrarPlanificador,
}) => {
    const intl = useIntl();

    const tienePlanificadorActivo = Boolean(productoPlanificador?.id);
    const desplegableBloqueado = !editable || guardando || cargandoPlanificadores;
    const fechaBloqueada = !editable || guardando || cargandoPlanificadores;

    return (
        <div className="formgrid grid">
            <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                <label htmlFor="planificadorProductoId" className="font-bold">
                    {intl.formatMessage({ id: "Planificador de producto" })}*
                </label>
                <Dropdown
                    id="planificadorProductoId"
                    value={planificadorId}
                    options={planificadores}
                    onChange={(e) => cambiarPlanificador(e.value)}
                    placeholder={cargandoPlanificadores ? intl.formatMessage({ id: "Cargando..." }) : intl.formatMessage({ id: "Seleccione un planificador" })}
                    disabled={desplegableBloqueado}
                />
            </div>

            <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-3">
                <label htmlFor="fechaInicioPlanificadorProducto" className="font-bold">
                    {intl.formatMessage({ id: "Fecha de inicio" })}*
                </label>
                <Calendar
                    id="fechaInicioPlanificadorProducto"
                    value={fechaInicio}
                    onChange={(e) => cambiarFechaInicioPlanificador(e.value)}
                    dateFormat="dd/mm/yy"
                    placeholder="dd/mm/yyyy"
                    disabled={fechaBloqueada}
                    showIcon
                />
            </div>

            {tienePlanificadorActivo && (
                <div className="col-12 mt-3">
                    <Divider />
                    <TareasPlantilla
                        ref={tareasPlantillaRef}
                        idPlanificador={productoPlanificador.planificadorId}
                        idProducto={producto.id}
                        idProductoPlanificador={productoPlanificador.id}
                        toastRef={toastRef}
                        editable={editable}
                        permitirCrear={puedeCrearPlanificador}
                        permitirBorrar={puedeBorrarPlanificador}
                        ocultarRecuadro={true}
                        origenDatos="detalle"
                        onDatosRellenadosChange={setDetallesRellenados}
                    />
                    {editable && (
                        <div className="flex justify-content-end mt-3">
                            <Button
                                label={intl.formatMessage({ id: "Guardar Planificador" })}
                                icon="pi pi-save"
                                onClick={guardarTareasProducto}
                                disabled={guardando}
                            />
                        </div>
                    )}
                </div>
            )}

            <Dialog
                visible={dialogoCambioPlanificador.visible}
                onHide={cancelarCambioPlanificador}
                header={intl.formatMessage({ id: "Cambiar planificador de producto" })}
                style={{ width: "36rem", maxWidth: "95vw" }}
                modal
                closable={!guardando}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label={intl.formatMessage({ id: "Cancelar" })}
                            className="p-button-secondary"
                            onClick={cancelarCambioPlanificador}
                            disabled={guardando}
                        />
                        <Button
                            label={guardando
                                ? intl.formatMessage({ id: "Eliminando..." })
                                : intl.formatMessage({ id: "Sí, cambiar planificador de producto" })
                            }
                            icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-exclamation-triangle"}
                            className="p-button-danger"
                            onClick={confirmarCambioPlanificador}
                            disabled={guardando}
                        />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3 mb-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-500" />
                    <span className="font-bold text-lg">
                        {intl.formatMessage({ id: "Atención: esta acción es irreversible" })}
                    </span>
                </div>
                <p style={{ margin: 0, lineHeight: "1.6" }}>
                    {intl.formatMessage({ id: "Este producto ya tiene un planificador de producto asociado. Al cambiarlo se eliminarán de forma permanente:" })}
                </p>
                <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", lineHeight: "1.8" }}>
                    <li className="mb-1">{intl.formatMessage({ id: "Planificador de producto actual" })}</li>
                    <li className="mb-1">{intl.formatMessage({ id: "Categorías y tareas del planificador del producto" })}</li>
                    <li className="mb-1">{intl.formatMessage({ id: "Datos rellenados en las tareas del planificador" })}</li>
                </ul>
                <p style={{ margin: 0, lineHeight: "1.6" }}>
                    <strong>{intl.formatMessage({ id: "¿Desea continuar?" })}</strong>
                </p>
            </Dialog>

            <Dialog
                visible={dialogoCambioFecha.visible}
                onHide={cancelarCambioFechaInicio}
                header={intl.formatMessage({ id: "Modificar fecha de inicio" })}
                style={{ width: "36rem", maxWidth: "95vw" }}
                modal
                closable={!guardando}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label={intl.formatMessage({ id: "Cancelar" })}
                            className="p-button-secondary"
                            onClick={cancelarCambioFechaInicio}
                            disabled={guardando}
                        />
                        <Button
                            label={guardando
                                ? intl.formatMessage({ id: "Modificando..." })
                                : intl.formatMessage({ id: "Sí, modificar fecha de inicio" })
                            }
                            icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-exclamation-triangle"}
                            className="p-button-danger"
                            onClick={confirmarCambioFechaInicio}
                            disabled={guardando}
                        />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3 mb-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-500" />
                    <span className="font-bold text-lg">
                        {intl.formatMessage({ id: "Atención: esta acción es irreversible" })}
                    </span>
                </div>
                <p style={{ margin: 0, lineHeight: "1.6" }}>
                    {intl.formatMessage({ id: "Este producto ya tiene fechas asociadas a tareas del planificador. Al modificar la fecha de inicio se actualizarán de forma permanente:" })}
                </p>
                <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", lineHeight: "1.8" }}>
                    <li>{intl.formatMessage({ id: "La fecha de inicio del planificador de producto" })}</li>
                    <li>{intl.formatMessage({ id: "Las fechas de inicio de las tareas asociadas" })}</li>
                    <li>{intl.formatMessage({ id: "Las fechas de fin de las tareas asociadas" })}</li>
                </ul>
                <p style={{ margin: 0, lineHeight: "1.6" }}>
                    <strong>{intl.formatMessage({ id: "¿Desea continuar?" })}</strong>
                </p>
            </Dialog>
        </div>
    );
};

export default EditarDatosProductoPlanificador;
