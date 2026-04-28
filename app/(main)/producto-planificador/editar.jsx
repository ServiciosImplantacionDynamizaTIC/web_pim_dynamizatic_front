"use client";

import React, { useEffect, useRef, useState } from "react";
import { getPlanificadores } from "@/app/api-endpoints/planificador";
import { getPlanificadorPlantillas } from "@/app/api-endpoints/planificador_plantilla";
import { getPlanificadorPlantillaResponsables } from "@/app/api-endpoints/planificador_plantilla_responsable";
import { getPlanificadorPlantillaEmails } from "@/app/api-endpoints/planificador_plantilla_email";
import { deletePlanificadorDetalle, getPlanificadorDetalles, patchPlanificadorDetalle, postPlanificadorDetalle } from "@/app/api-endpoints/planificador_detalle";
import { deleteProductoPlanificador, getProductoPlanificadores, patchProductoPlanificador, postProductoPlanificador } from "@/app/api-endpoints/producto_planificador";
import { formatearFechaLocal_a_toISOString, getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";
import EditarDatosProductoPlanificador from "./EditarDatosProductoPlanificador";

const EditarProductoPlanificador = ({ producto, editable, setRegistroResult, toastRef }) => {
    const intl = useIntl();
    const tareasPlantillaRef = useRef(null);

    const [planificadores, setPlanificadores] = useState([]);
    const [productoPlanificador, setProductoPlanificador] = useState(null);
    const [planificadorId, setPlanificadorId] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [cargandoPlanificadores, setCargandoPlanificadores] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [, setDetallesRellenados] = useState(false);
    const [dialogoCambioPlanificador, setDialogoCambioPlanificador] = useState({ visible: false, nuevoPlanificadorId: null });
    const [dialogoCambioFecha, setDialogoCambioFecha] = useState({ visible: false, nuevaFecha: null });

    useEffect(() => {
        cargarPlanificadores();
    }, []);

    useEffect(() => {
        cargarProductoPlanificador();
    }, [producto?.id]);

    // Carga el catálogo de planificadores activos.
    const cargarPlanificadores = async () => {
        setCargandoPlanificadores(true);
        try {
            const empresaId = getUsuarioSesion()?.empresaId || Number(localStorage.getItem("empresa"));
            const filtro = JSON.stringify({
                where: {
                    empresaId,
                    activoSn: "S",
                },
                order: "nombre ASC",
            });
            const filtroEmpresa = JSON.stringify({
                where: {
                    empresaId,
                },
                order: "nombre ASC",
            });
            let registrosPlanificador = await getPlanificadores(filtro);

            if (!registrosPlanificador || registrosPlanificador.length === 0) {
                registrosPlanificador = await getPlanificadores(filtroEmpresa);
            }

            setPlanificadores((registrosPlanificador || []).map((planificador) => ({
                label: planificador.nombre,
                value: planificador.id,
                fechaInicio: planificador.fechaInicio,
            })));
        } catch (error) {
            console.error("Error cargando planificadores de producto:", error);
            setPlanificadores([]);
        } finally {
            setCargandoPlanificadores(false);
        }
    };

    // Carga el planificador activo asociado al producto.
    const cargarProductoPlanificador = async () => {
        if (!producto?.id) {
            return;
        }

        try {
            const filtro = JSON.stringify({
                where: {
                    and: [
                        { productoId: producto.id },
                        { activoSn: "S" },
                    ],
                },
                order: "id DESC",
                limit: 1,
            });
            const registros = await getProductoPlanificadores(filtro);
            const registroActivo = registros?.[0] || null;

            setProductoPlanificador(registroActivo);
            setPlanificadorId(registroActivo?.planificadorId || null);
            setFechaInicio(registroActivo?.fechaInicio ? new Date(registroActivo.fechaInicio) : null);

            if (!registroActivo?.id) {
                setDetallesRellenados(false);
            }
        } catch (error) {
            console.error("Error cargando planificador del producto:", error);
            setProductoPlanificador(null);
            setPlanificadorId(null);
            setFechaInicio(null);
            setDetallesRellenados(false);
        }
    };

    // Controla el cambio de planificador y pide confirmación si ya existe uno aplicado.
    const cambiarPlanificador = (idPlanificadorSeleccionado) => {
        if (!idPlanificadorSeleccionado || idPlanificadorSeleccionado === planificadorId) {
            return;
        }

        if (productoPlanificador?.id) {
            setDialogoCambioPlanificador({ visible: true, nuevoPlanificadorId: idPlanificadorSeleccionado });
            return;
        }

        setPlanificadorId(idPlanificadorSeleccionado);

        if (!fechaInicio) {
            return;
        }

        aplicarPlanificadorProducto(idPlanificadorSeleccionado);
    };

    const confirmarCambioPlanificador = async () => {
        if (!dialogoCambioPlanificador.nuevoPlanificadorId) {
            return;
        }

        await aplicarPlanificadorProducto(dialogoCambioPlanificador.nuevoPlanificadorId);
        setDialogoCambioPlanificador({ visible: false, nuevoPlanificadorId: null });
    };

    const cancelarCambioPlanificador = () => {
        setDialogoCambioPlanificador({ visible: false, nuevoPlanificadorId: null });
    };

    const cancelarCambioFechaInicio = () => {
        setFechaInicio(productoPlanificador?.fechaInicio ? new Date(productoPlanificador.fechaInicio) : null);
        setDialogoCambioFecha({ visible: false, nuevaFecha: null });
    };

    // Aplica una plantilla al producto y crea su detalle.
    const aplicarPlanificadorProducto = async (idPlanificadorSeleccionado, fechaInicioSeleccionada = null) => {
        const fechaInicioAplicar = obtenerFechaInicioPlanificador(idPlanificadorSeleccionado, fechaInicioSeleccionada);

        if (!producto?.id || !idPlanificadorSeleccionado || !fechaInicioAplicar) {
            toastRef.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Debe seleccionar un planificador y una fecha de inicio" }),
                life: 3000,
            });
            return;
        }

        setPlanificadorId(idPlanificadorSeleccionado);
        setFechaInicio(fechaInicioAplicar);

        setGuardando(true);
        try {
            const usuarioActual = getUsuarioSesion();
            const fechaInicioTexto = formatearFechaLocal_a_toISOString(fechaInicioAplicar);

            if (productoPlanificador?.id) {
                await limpiarPlanificadorProductoActual();
            }

            const nuevoProductoPlanificador = await postProductoPlanificador({
                productoId: producto.id,
                planificadorId: idPlanificadorSeleccionado,
                fechaInicio: fechaInicioTexto,
                activoSn: "S",
                usuCreacion: usuarioActual?.id,
            });

            await crearDetallesDesdePlantilla(nuevoProductoPlanificador, fechaInicioAplicar);
            setProductoPlanificador(nuevoProductoPlanificador);
            setDetallesRellenados(true);
            setRegistroResult?.(`planificador_producto_${Date.now()}`);

            toastRef.current?.show({
                severity: "success",
                summary: intl.formatMessage({ id: "Planificador de producto" }),
                detail: intl.formatMessage({ id: "Planificador de producto aplicado correctamente" }),
                life: 3000,
            });
        } catch (error) {
            console.error("Error aplicando planificador de producto:", error);
            toastRef.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Ha ocurrido un error aplicando el planificador de producto" }),
                life: 3000,
            });
        } finally {
            setGuardando(false);
        }
    };

    const obtenerFechaInicioPlanificador = (idPlanificadorSeleccionado, fechaInicioSeleccionada = null) => {
        if (fechaInicioSeleccionada) {
            return fechaInicioSeleccionada;
        }

        if (fechaInicio) {
            return fechaInicio;
        }

        const planificadorSeleccionado = planificadores.find((planificador) => planificador.value === idPlanificadorSeleccionado);
        return planificadorSeleccionado?.fechaInicio ? new Date(planificadorSeleccionado.fechaInicio) : null;
    };

    // Mantiene la hora existente aunque en pantalla solo se edite la fecha.
    const aplicarHoraExistente = (fechaNueva, fechaActual = null) => {
        if (!fechaNueva) {
            return null;
        }

        const fechaResultado = new Date(fechaNueva);
        const fechaOrigen = fechaActual ? new Date(fechaActual) : null;

        if (fechaOrigen && !Number.isNaN(fechaOrigen.getTime())) {
            fechaResultado.setHours(
                fechaOrigen.getHours(),
                fechaOrigen.getMinutes(),
                fechaOrigen.getSeconds(),
                fechaOrigen.getMilliseconds(),
            );
        }

        return fechaResultado;
    };

    // Recalcula visualmente las fechas del detalle.
    const cambiarFechaInicioPlanificador = (fechaInicioSeleccionada) => {
        const fechaConHora = aplicarHoraExistente(fechaInicioSeleccionada, fechaInicio);

        if (planificadorId && !productoPlanificador?.id && fechaInicioSeleccionada) {
            aplicarPlanificadorProducto(planificadorId, fechaConHora);
            return;
        }

        if (!productoPlanificador?.id) {
            setFechaInicio(fechaConHora);
            return;
        }

        const fechaActualTexto = fechaInicio ? formatearFechaLocal_a_toISOString(fechaInicio) : null;
        const nuevaFechaTexto = fechaConHora ? formatearFechaLocal_a_toISOString(fechaConHora) : null;

        if (fechaActualTexto === nuevaFechaTexto) {
            return;
        }

        if (!fechaConHora) {
            setFechaInicio(null);
            return;
        }

        setDialogoCambioFecha({
            visible: true,
            nuevaFecha: fechaConHora,
        });
    };

    const confirmarCambioFechaInicio = async () => {
        if (!productoPlanificador?.id || !dialogoCambioFecha.nuevaFecha) {
            return;
        }

        try {
            const nuevaFecha = dialogoCambioFecha.nuevaFecha;
            const nuevaFechaTexto = formatearFechaLocal_a_toISOString(nuevaFecha);

            setProductoPlanificador((previo) => previo ? {
                ...previo,
                fechaInicio: nuevaFechaTexto,
            } : previo);
            setFechaInicio(nuevaFecha);
            setDialogoCambioFecha({ visible: false, nuevaFecha: null });
            tareasPlantillaRef.current?.recalcularFechasLocal?.(nuevaFecha);

            toastRef.current?.show({
                severity: "success",
                summary: intl.formatMessage({ id: "Fecha de inicio" }),
                detail: intl.formatMessage({ id: "Las fechas se han recalculado visualmente. Guarde para aplicar los cambios." }),
                life: 3500,
            });
        } catch (error) {
            console.error("Error actualizando la fecha de inicio del planificador:", error);
            toastRef.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Ha ocurrido un error actualizando la fecha de inicio del planificador" }),
                life: 3000,
            });
        }
    };

    // Crea el detalle del producto copiando la plantilla y calculando sus fechas.
    const crearDetallesDesdePlantilla = async (nuevoProductoPlanificador, fechaInicioBase) => {
        const usuarioActual = getUsuarioSesion();
        const filtro = JSON.stringify({
            where: {
                planificadorId: nuevoProductoPlanificador.planificadorId,
            },
        });
        const tareasPlantilla = await getPlanificadorPlantillas(filtro);
        const idsPlantillaADetalle = {};

        for (const tareaPlantilla of tareasPlantilla || []) {
            const responsables = await cargarResponsablesPlantilla(tareaPlantilla.id);
            const emails = await cargarEmailsPlantilla(tareaPlantilla.id);
            const fechasCalculadas = calcularFechasDetalle(fechaInicioBase, tareaPlantilla);
            const detalleCreado = await postPlanificadorDetalle({
                productoPlanificadorId: nuevoProductoPlanificador.id,
                productoId: nuevoProductoPlanificador.productoId,
                planificadorId: nuevoProductoPlanificador.planificadorId,
                planificadorTareaId: tareaPlantilla.id,
                tareaAsociadaId: null,
                nombreCategoria: tareaPlantilla.nombreCategoria,
                nombreTarea: tareaPlantilla.nombreTarea,
                empiezaEn: tareaPlantilla.empiezaEn || null,
                terminaEn: tareaPlantilla.terminaEn || null,
                diasAvisoDesdeInicio: tareaPlantilla.diasAvisoDesdeInicio || null,
                diasAvisoDesdeFin: tareaPlantilla.diasAvisoDesdeFin || null,
                diasAvisoAFin: tareaPlantilla.diasAvisoAFin || null,
                ...fechasCalculadas,
                estado: null,
                comentarios: tareaPlantilla.comentarios || null,
                responsable: responsables[0] || null,
                avisoEmails: emails.length > 0 ? emails.join(",") : null,
                activoSn: tareaPlantilla.activoSn || "S",
                usuCreacion: usuarioActual?.id,
            });

            idsPlantillaADetalle[tareaPlantilla.id] = detalleCreado.id;
        }

        for (const tareaPlantilla of tareasPlantilla || []) {
            if (!tareaPlantilla.tareaAsociadaId || !idsPlantillaADetalle[tareaPlantilla.id]) {
                continue;
            }

            const tareaAsociadaDetalleId = idsPlantillaADetalle[tareaPlantilla.tareaAsociadaId];
            if (!tareaAsociadaDetalleId) {
                continue;
            }

            await patchPlanificadorDetalle(idsPlantillaADetalle[tareaPlantilla.id], {
                tareaAsociadaId: tareaAsociadaDetalleId,
                usuModificacion: usuarioActual?.id,
            });
        }
    };

    const cargarResponsablesPlantilla = async (planificadorPlantillaId) => {
        const filtro = JSON.stringify({
            where: {
                planificadorPlantillaId,
            },
        });
        const responsables = await getPlanificadorPlantillaResponsables(filtro);
        return (responsables || []).map((responsable) => responsable.responsableId).filter(Boolean);
    };

    const cargarEmailsPlantilla = async (planificadorPlantillaId) => {
        const filtro = JSON.stringify({
            where: {
                planificadorPlantillaId,
            },
        });
        const emails = await getPlanificadorPlantillaEmails(filtro);
        return (emails || []).map((email) => email.usuarioId).filter(Boolean);
    };

    const sumarDiasAFecha = (fechaBase, dias) => {
        if (!fechaBase || dias === null || dias === undefined || dias === "") {
            return null;
        }

        const fechaCalculada = new Date(fechaBase);
        fechaCalculada.setDate(fechaCalculada.getDate() + Number(dias));
        return fechaCalculada;
    };

    const restarDiasAFecha = (fechaBase, dias) => {
        if (!fechaBase || dias === null || dias === undefined || dias === "") {
            return null;
        }

        const fechaCalculada = new Date(fechaBase);
        fechaCalculada.setDate(fechaCalculada.getDate() - Number(dias));
        return fechaCalculada;
    };

    const convertirFechaATexto = (fecha) => {
        if (!fecha) {
            return null;
        }

        return formatearFechaLocal_a_toISOString(fecha);
    };

    const calcularFechasDetalle = (fechaBase, tarea) => {
        const fechaInicioTarea = sumarDiasAFecha(fechaBase, tarea?.empiezaEn);
        const fechaFinTarea = sumarDiasAFecha(fechaInicioTarea, tarea?.terminaEn);
        const fechaAvisoDesdeInicio = sumarDiasAFecha(fechaInicioTarea, tarea?.diasAvisoDesdeInicio);
        const fechaAvisoAFin = restarDiasAFecha(fechaFinTarea, tarea?.diasAvisoAFin);
        const fechaAvisoDesdeFin = sumarDiasAFecha(fechaFinTarea, tarea?.diasAvisoDesdeFin);

        return {
            fechaInicio: convertirFechaATexto(fechaInicioTarea),
            fechaFin: convertirFechaATexto(fechaFinTarea),
            fechaAvisoDesdeInicio: convertirFechaATexto(fechaAvisoDesdeInicio),
            fechaAvisoAFin: convertirFechaATexto(fechaAvisoAFin),
            fechaAvisoDesdeFin: convertirFechaATexto(fechaAvisoDesdeFin),
        };
    };

    // Borra el detalle actual antes de reaplicar otro planificador.
    const limpiarPlanificadorProductoActual = async () => {
        if (!productoPlanificador?.id) {
            return;
        }

        const filtroDetalles = JSON.stringify({
            where: {
                productoPlanificadorId: productoPlanificador.id,
            },
        });
        const detalles = await getPlanificadorDetalles(filtroDetalles);
        for (const detalle of detalles || []) {
            await deletePlanificadorDetalle(detalle.id);
        }

        await deleteProductoPlanificador(productoPlanificador.id);
    };

    // Guarda primero la fecha base y después persiste las tareas.
    const guardarTareasProducto = async () => {
        if (!tareasPlantillaRef.current || !productoPlanificador?.id) {
            return;
        }

        setGuardando(true);

        try {
            const usuarioActual = getUsuarioSesion();
            await patchProductoPlanificador(productoPlanificador.id, {
                fechaInicio: fechaInicio ? formatearFechaLocal_a_toISOString(fechaInicio) : null,
                usuModificacion: usuarioActual?.id,
            });

            const guardadoCorrecto = await tareasPlantillaRef.current.guardarTareas(productoPlanificador.planificadorId);
            if (guardadoCorrecto) {
                setRegistroResult?.(`planificador_producto_${Date.now()}`);
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <EditarDatosProductoPlanificador
            producto={producto}
            editable={editable}
            toastRef={toastRef}
            guardando={guardando}
            cargandoPlanificadores={cargandoPlanificadores}
            planificadores={planificadores}
            planificadorId={planificadorId}
            fechaInicio={fechaInicio}
            productoPlanificador={productoPlanificador}
            tareasPlantillaRef={tareasPlantillaRef}
            dialogoCambioPlanificador={dialogoCambioPlanificador}
            dialogoCambioFecha={dialogoCambioFecha}
            cambiarPlanificador={cambiarPlanificador}
            cambiarFechaInicioPlanificador={cambiarFechaInicioPlanificador}
            cancelarCambioPlanificador={cancelarCambioPlanificador}
            confirmarCambioPlanificador={confirmarCambioPlanificador}
            cancelarCambioFechaInicio={cancelarCambioFechaInicio}
            confirmarCambioFechaInicio={confirmarCambioFechaInicio}
            guardarTareasProducto={guardarTareasProducto}
            setDetallesRellenados={setDetallesRellenados}
        />
    );
};

export default EditarProductoPlanificador;
