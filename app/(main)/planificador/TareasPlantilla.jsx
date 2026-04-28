"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { getPlanificadorPlantillas, postPlanificadorPlantilla, patchPlanificadorPlantilla, deletePlanificadorPlantilla } from '@/app/api-endpoints/planificador_plantilla';
import { getPlanificadorDetalles, postPlanificadorDetalle, patchPlanificadorDetalle, deletePlanificadorDetalle } from '@/app/api-endpoints/planificador_detalle';
import { getUsuarioSesion } from '@/app/utility/Utils';
import { useIntl } from 'react-intl';
import { MultiSelect } from 'primereact/multiselect';
import { getVistaUsuarios } from '@/app/api-endpoints/usuario';
import { getPlanificadorPlantillaResponsables, postPlanificadorPlantillaResponsable, deletePlanificadorPlantillaResponsable } from '@/app/api-endpoints/planificador_plantilla_responsable';
import { getPlanificadorPlantillaEmails, postPlanificadorPlantillaEmail, deletePlanificadorPlantillaEmail } from '@/app/api-endpoints/planificador_plantilla_email';
import { getPlanificadorEstados } from '@/app/api-endpoints/planificador_estado';
import { formatearFechaLocal_a_toISOString } from '@/app/utility/Utils';

const TareasPlantilla = React.forwardRef(({ idPlanificador, toastRef, editable = true, ocultarRecuadro, origenDatos = 'plantilla', idProducto = null, idProductoPlanificador = null, onDatosRellenadosChange = null, mostrarEstado = true }, ref) => {
    const toast = toastRef; // Usar el toast del componente padre
    const intl = useIntl();
    const categoriaRefs = useRef({});
    const tareaRefs = useRef({});
    const [categorias, setCategorias] = useState([]);
    const [mostrarConfirmacionEliminarCategoria, setMostrarConfirmacionEliminarCategoria] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
    const [mostrarConfirmacionEliminarTarea, setMostrarConfirmacionEliminarTarea] = useState(false);
    const [tareaAEliminar, setTareaAEliminar] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [tareasExpandidas, setTareasExpandidas] = useState({});
    const [erroresValidacionCategorias, setErroresValidacionCategorias] = useState(new Set());
    const [erroresValidacionTareas, setErroresValidacionTareas] = useState(new Set());

    // Estados para seguir eliminaciones pendientes
    const [tareasAEliminar, setTareasAEliminar] = useState([]); // IDs de tareas a eliminar al guardar
    // Estado para usuarios/emails
    const [usuariosDisponibles, setUsuariosDisponibles] = useState([]); // Para responsables (con filtro de rol)
    const [usuariosEmail, setUsuariosEmail] = useState([]); // Para envío de email (sin filtro de rol)
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [estadosMaestra, setEstadosMaestra] = useState([]);
    const esDetalleProducto = origenDatos === 'detalle';

    useEffect(() => {
        cargarDatos();
        cargarUsuarios();
        cargarMaestras();
    }, [idPlanificador, origenDatos, idProducto, idProductoPlanificador]);

    useEffect(() => {
        if (!esDetalleProducto) {
            return;
        }

        onDatosRellenadosChange?.(tieneDatosRellenados());
    }, [categorias, esDetalleProducto]);

    // Exponer la función guardarTareas al componente padre
    React.useImperativeHandle(ref, () => ({
        guardarTareas,
        tieneDatosRellenados,
        recargarTareas: cargarDatos,
        recalcularFechasLocal,
    }));

    const cargarUsuarios = async () => {
        setCargandoUsuarios(true);
        try {
            const empresaId = getUsuarioSesion()?.empresaId || parseInt(localStorage.getItem('empresa')?.trim() || 0, 10);

            const filtroUsuarios = JSON.stringify({
                where: {
                    empresaId,
                    activoSn: 'S',
                },
                order: 'nombre ASC'
            });

            const filtroUsuariosFallback = JSON.stringify({
                where: {
                    empresaId: empresaId,
                },
                order: 'nombre ASC'
            });

            let usuarios = await getVistaUsuarios(filtroUsuarios);

            if (!usuarios || usuarios.length === 0) {
                usuarios = await getVistaUsuarios(filtroUsuariosFallback);
            }
            if (!usuarios || usuarios.length === 0) {
                setUsuariosEmail([]);
                setUsuariosDisponibles([]);
                return;
            }

            const usuariosUnicos = Array.from(
                new Map((usuarios || []).map((usuario) => [usuario.id, usuario])).values()
            );

            // Usamos los usuarios activos de la empresa tanto para responsables como para envío.
            const usuariosFormateados = usuariosUnicos.map(usuario => ({
                label: `${usuario.nombre} (${usuario.mail || ''})`.trim(),
                value: usuario.id
            }));


            // Actualizar estados en bloque para evitar renders múltiples
            setUsuariosEmail(usuariosFormateados);
            setUsuariosDisponibles(usuariosFormateados);

        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setUsuariosEmail([]);
            setUsuariosDisponibles([]);
        } finally {
            setCargandoUsuarios(false);
        }
    };

    const cargarMaestras = async () => {
        try {
            const empresaId = getUsuarioSesion()?.empresaId || parseInt(localStorage.getItem('empresa')?.trim() || 0, 10);

            const filtroEstados = JSON.stringify({
                where: {
                    empresaId,
                    activoSn: 'S',
                },
                order: 'nombre ASC'
            });

            const filtroEstadosFallback = JSON.stringify({
                where: {
                    empresaId: empresaId,
                    activoSn: 'S',
                },
                order: 'nombre ASC'
            });

            let estados = await getPlanificadorEstados(filtroEstados);

            if (!estados || estados.length === 0) {
                estados = await getPlanificadorEstados(filtroEstadosFallback);
            }

            setEstadosMaestra(
                (estados || []).map((estado) => ({
                    label: estado.nombre,
                    value: esDetalleProducto ? estado.id : estado.nombre,
                }))
            );
        } catch (error) {
            console.error('Error al cargar maestras del planificador:', error);
            setEstadosMaestra([]);
        }
    };

    const cargarDatos = async () => {
        if (!idPlanificador || idPlanificador === 0) {
            return;
        }

        setCargando(true);
        try {
            // Filtrar por el planificador actual en el backend.
            const whereConditions = {
                planificadorId: idPlanificador
            };

            if (esDetalleProducto && idProductoPlanificador) {
                whereConditions.productoPlanificadorId = idProductoPlanificador;
            }

            const filtro = JSON.stringify({
                where: whereConditions
            });

            const registrosPlanificador = esDetalleProducto
                ? await getPlanificadorDetalles(filtro)
                : await getPlanificadorPlantillas(filtro);

            // Así que filtramos en el frontend como medida de seguridad
            const plantillasFiltradas = registrosPlanificador.filter(plantilla => {
                const planificadorIdPlantilla = plantilla.planificadorId;
                const coincidePlanificador = planificadorIdPlantilla === idPlanificador;
                const coincideProducto = !esDetalleProducto || plantilla.productoPlanificadorId === idProductoPlanificador;
                return coincidePlanificador && coincideProducto;
            });

            // Cargar responsables y emails para todas las plantillas
            const responsablesPorPlantilla = {};
            const emailsPorPlantilla = {};

            for (const plantilla of plantillasFiltradas) {
                if (esDetalleProducto) {
                    responsablesPorPlantilla[plantilla.id] = plantilla.responsable ? [plantilla.responsable] : [];
                    emailsPorPlantilla[plantilla.id] = obtenerIdsDesdeTexto(plantilla.avisoEmails);
                    continue;
                }

                // Cargar responsables asociados a la tarea de plantilla
                const filtroResponsables = JSON.stringify({
                    where: {
                        planificadorPlantillaId: plantilla.id,
                    },
                });
                const responsables = await getPlanificadorPlantillaResponsables(filtroResponsables);
                const responsablesIds = responsables.map(responsable => responsable.responsableId);
                responsablesPorPlantilla[plantilla.id] = responsablesIds;

                // Cargar emails asociados a la tarea de plantilla
                const filtroEmails = JSON.stringify({
                    where: {
                        planificadorPlantillaId: plantilla.id,
                    },
                });
                const emails = await getPlanificadorPlantillaEmails(filtroEmails);
                const emailsIds = emails.map(email => email.usuarioId);
                emailsPorPlantilla[plantilla.id] = emailsIds;
            }

            const categoriasMap = {};
            plantillasFiltradas.forEach(plantilla => {
                const nombreCat = plantilla.nombreCategoria;

                if (!categoriasMap[nombreCat]) {
                    categoriasMap[nombreCat] = {
                        uid: crypto.randomUUID(),
                        nombre: nombreCat,
                        tareas: [],
                        placeholderId: null
                    };
                }

                const tareaResponsables = responsablesPorPlantilla[plantilla.id] || [];
                const tareaEmails = emailsPorPlantilla[plantilla.id] || [];
                const nombreTarea = plantilla.nombreTarea;
                const esPlaceholder = !nombreTarea || nombreTarea.trim() === '';

                if (esPlaceholder) {
                    if (!categoriasMap[nombreCat].placeholderId) {
                        categoriasMap[nombreCat].placeholderId = plantilla.id;
                    }
                    return;
                }

                categoriasMap[nombreCat].tareas.push({
                    uid: crypto.randomUUID(), // Agregar uid único para cada tarea cargada
                    id: plantilla.id,
                    empresaId: plantilla.empresaId,
                    planificadorId: plantilla.planificadorId,
                    productoPlanificadorId: plantilla.productoPlanificadorId,
                    productoId: plantilla.productoId,
                    planificadorTareaId: plantilla.planificadorTareaId,
                    tareaAsociadaId: plantilla.tareaAsociadaId,
                    nombreCategoria: plantilla.nombreCategoria,
                    nombreTarea: nombreTarea,
                    empiezaEn: plantilla.empiezaEn,
                    terminaEn: plantilla.terminaEn,
                    diasAvisoDesdeInicio: plantilla.diasAvisoDesdeInicio,
                    diasAvisoDesdeFin: plantilla.diasAvisoDesdeFin,
                    diasAvisoAFin: plantilla.diasAvisoAFin,
                    fechaInicio: convertirTextoAFecha(plantilla.fechaInicio),
                    fechaFin: convertirTextoAFecha(plantilla.fechaFin),
                    fechaAvisoDesdeInicio: convertirTextoAFecha(plantilla.fechaAvisoDesdeInicio),
                    fechaAvisoAFin: convertirTextoAFecha(plantilla.fechaAvisoAFin),
                    fechaAvisoDesdeFin: convertirTextoAFecha(plantilla.fechaAvisoDesdeFin),
                    estado: plantilla.estado || null,
                    comentarios: plantilla.comentarios || null,
                    activoSn: plantilla.activoSn,
                    emailResponsables: tareaResponsables,
                    emailEnvio: tareaEmails,
                    usuCreacion: plantilla.usuCreacion,
                    usuModificacion: plantilla.usuModificacion,
                    fechaCreacion: plantilla.fechaCreacion,
                    fechaModificacion: plantilla.fechaModificacion
                });
            });

            const categoriasArray = Object.values(categoriasMap);
            setCategorias(categoriasArray);
            setTareasAEliminar([]);
            setErroresValidacionCategorias(new Set());
            setErroresValidacionTareas(new Set());
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: intl.formatMessage({ id: 'Error' }),
                detail: intl.formatMessage({ id: 'Error al cargar las plantillas' }),
                life: 3000,
            });
        } finally {
            setCargando(false);
        }
    };

    const agregarCategoria = (nombreCategoria = '') => {
        const nuevaCategoria = {
            uid: crypto.randomUUID(),
            nombre: nombreCategoria,
            tareas: [],
            placeholderId: null,
        };
        setCategorias([...categorias, nuevaCategoria]);
        mostrarAvisoCreacion('Categoría creada correctamente');
        desplazarAElemento(categoriaRefs, nuevaCategoria.uid);
    };

    const confirmarEliminarCategoria = (categoriaUid) => {
        setCategoriaAEliminar(categoriaUid);
        setMostrarConfirmacionEliminarCategoria(true);
    };

    const eliminarCategoria = () => {
        // Buscar todas las tareas de la categoría a eliminar
        const categoria = categorias.find(cat => cat.uid === categoriaAEliminar);

        // Marcar las tareas con ID para eliminar al guardar
        if (categoria) {
            const idsAEliminar = categoria.tareas
                .filter(t => t.id) // Solo las que tienen ID (ya están en BD)
                .map(t => t.id);
            if (categoria.placeholderId) {
                idsAEliminar.push(categoria.placeholderId);
            }
            if (idsAEliminar.length > 0) {
                setTareasAEliminar([...tareasAEliminar, ...idsAEliminar]);
            }
        }

        // Eliminar categoría del estado (solo visual)
        setCategorias(categorias.filter(cat => cat.uid !== categoriaAEliminar));
        setMostrarConfirmacionEliminarCategoria(false);
        setCategoriaAEliminar(null);

        // No mostrar toast aquí, solo al guardar
    };

    const agregarTarea = (categoriaUid) => {
        const usuarioActual = getUsuarioSesion();
        const empresaId = parseInt(localStorage.getItem('empresa')?.trim() || 0, 10);
        const categoria = categorias.find(cat => cat.uid === categoriaUid);

        if (!categoria) {
            return;
        }

        const nuevaTarea = {
            uid: crypto.randomUUID(), // ID único temporal para identificar la tarea
            id: null,
            empresaId: empresaId,
            planificadorId: idPlanificador,
            productoPlanificadorId: idProductoPlanificador,
            productoId: idProducto,
            planificadorTareaId: null,
            tareaAsociadaId: null,
            nombreCategoria: categoria.nombre,
            nombreTarea: '',
            empiezaEn: null,
            terminaEn: null,
            diasAvisoDesdeInicio: null,
            diasAvisoDesdeFin: null,
            diasAvisoAFin: null,
            fechaInicio: null,
            fechaFin: null,
            fechaAvisoDesdeInicio: null,
            fechaAvisoAFin: null,
            fechaAvisoDesdeFin: null,
            estado: null,
            comentarios: null,
            activoSn: 'S',
            emailResponsables: [],
            emailEnvio: [],
            usuCreacion: usuarioActual.id,
        };

        setCategorias(categorias.map(cat => {
            if (cat.uid === categoriaUid) {
                return { ...cat, tareas: [...cat.tareas, nuevaTarea] };
            }
            return cat;
        }));

        mostrarAvisoCreacion('Tarea creada correctamente');
        desplazarAElemento(tareaRefs, nuevaTarea.uid);
    };

    const mostrarAvisoCreacion = (mensaje) => {
        toast.current?.show({
            severity: 'success',
            summary: intl.formatMessage({ id: 'Éxito' }),
            detail: intl.formatMessage({ id: mensaje }),
            life: 2500,
        });
    };

    const desplazarAElemento = (referencias, clave) => {
        setTimeout(() => {
            referencias.current[clave]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 100);
    };

    const validarDiasTarea = (tarea) => {
        if (esDetalleProducto) {
            return;
        }

        if (tarea.empiezaEn && tarea.terminaEn) {
            if (tarea.terminaEn < 1) {
                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'ERROR' }),
                    detail: intl.formatMessage({ id: 'La duración de la tarea debe ser mayor que 0' }),
                    life: 3000,
                });
            }
        }
    };

    const validarAvisosTarea = (tarea) => {
        if (esDetalleProducto) {
            return;
        }

        // Validaciones opcionales para los días de aviso
        if (tarea.diasAvisoDesdeInicio && tarea.empiezaEn) {
            if (tarea.diasAvisoDesdeInicio > tarea.empiezaEn) {
                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'ERROR' }),
                    detail: intl.formatMessage({ id: 'Los días de aviso desde inicio no pueden ser mayores al día de inicio' }),
                    life: 3000,
                });
            }
        }
    };

    const toggleDetallesTarea = (tareaKey) => {
        setTareasExpandidas(prev => ({
            ...prev,
            [tareaKey]: !prev[tareaKey]
        }));
    };

    const actualizarTarea = (categoriaUid, tareaIndex, campo, valor) => {
        setCategorias(categorias.map(cat => {
            if (cat.uid === categoriaUid) {
                const nuevasTareas = [...cat.tareas];
                const valorConHora = aplicarHoraExistenteEnFecha(
                    campo,
                    valor,
                    nuevasTareas[tareaIndex]?.[campo],
                );
                const tareaActualizada = {
                    ...nuevasTareas[tareaIndex],
                    [campo]: valorConHora
                };
                nuevasTareas[tareaIndex] = tareaActualizada;

                // Validar cuando cambian días
                if (campo === 'empiezaEn' || campo === 'terminaEn') {
                    validarDiasTarea(tareaActualizada);
                }

                if (campo === 'diasAvisoDesdeInicio' || campo === 'diasAvisoDesdeFin') {
                    validarAvisosTarea(tareaActualizada);
                }

                return { ...cat, tareas: nuevasTareas };
            }
            return cat;
        }));

        if (campo === 'nombreTarea') {
            setErroresValidacionTareas(prev => {
                const nuevo = new Set(prev);
                nuevo.delete(obtenerClaveTarea(categoriaUid, categorias.find(cat => cat.uid === categoriaUid)?.tareas?.[tareaIndex], tareaIndex));
                return nuevo;
            });
        }
    };

    // Si la fecha ya tenía hora, se conserva aunque el calendario solo muestre día, mes y año.
    const aplicarHoraExistenteEnFecha = (campo, valorNuevo, valorActual) => {
        const camposFecha = new Set([
            'fechaInicio',
            'fechaFin',
            'fechaAvisoDesdeInicio',
            'fechaAvisoAFin',
            'fechaAvisoDesdeFin',
        ]);

        if (!camposFecha.has(campo) || !valorNuevo) {
            return valorNuevo;
        }

        const fechaResultado = new Date(valorNuevo);
        const fechaOrigen = valorActual ? new Date(valorActual) : null;

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

    const obtenerIdsDesdeTexto = (textoIds) => {
        if (!textoIds) {
            return [];
        }

        return String(textoIds)
            .split(',')
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));
    };

    const obtenerTextoDesdeIds = (ids) => {
        if (!Array.isArray(ids)) {
            return null;
        }

        const idsLimpios = ids
            .map((id) => parseInt(id, 10))
            .filter((id) => !Number.isNaN(id));

        return idsLimpios.length > 0 ? idsLimpios.join(',') : null;
    };

    const convertirTextoAFecha = (fecha) => {
        return fecha ? new Date(fecha) : null;
    };

    const convertirFechaATexto = (fecha) => {
        return fecha ? formatearFechaLocal_a_toISOString(fecha) : null;
    };

    const sumarDiasAFecha = (fechaBase, dias) => {
        if (!fechaBase || dias === null || dias === undefined || dias === '') {
            return null;
        }

        const fechaCalculada = new Date(fechaBase);
        fechaCalculada.setDate(fechaCalculada.getDate() + Number(dias));
        return fechaCalculada;
    };

    const restarDiasAFecha = (fechaBase, dias) => {
        if (!fechaBase || dias === null || dias === undefined || dias === '') {
            return null;
        }

        const fechaCalculada = new Date(fechaBase);
        fechaCalculada.setDate(fechaCalculada.getDate() - Number(dias));
        return fechaCalculada;
    };

    const calcularFechasVisualesDetalle = (fechaBase, tarea) => {
        const fechaInicio = sumarDiasAFecha(fechaBase, tarea?.empiezaEn);
        const fechaFin = sumarDiasAFecha(fechaInicio, tarea?.terminaEn);

        return {
            fechaInicio,
            fechaFin,
            fechaAvisoDesdeInicio: sumarDiasAFecha(fechaInicio, tarea?.diasAvisoDesdeInicio),
            fechaAvisoAFin: restarDiasAFecha(fechaFin, tarea?.diasAvisoAFin),
            fechaAvisoDesdeFin: sumarDiasAFecha(fechaFin, tarea?.diasAvisoDesdeFin),
        };
    };

    const recalcularFechasLocal = (fechaBase) => {
        if (!esDetalleProducto || !fechaBase) {
            return;
        }

        setCategorias((previo) =>
            previo.map((categoria) => ({
                ...categoria,
                tareas: categoria.tareas.map((tarea) => ({
                    ...tarea,
                    ...calcularFechasVisualesDetalle(fechaBase, tarea),
                })),
            }))
        );
    };

    const obtenerResponsableDetalle = (idsResponsables) => {
        if (!Array.isArray(idsResponsables) || idsResponsables.length === 0) {
            return null;
        }

        const responsableId = parseInt(idsResponsables[0], 10);
        return Number.isNaN(responsableId) ? null : responsableId;
    };

    const tieneDatosRellenados = () => {
        return categorias.some((categoria) =>
            categoria.tareas.some((tarea) =>
                Boolean(tarea.nombreTarea?.trim())
            )
        );
    };

    const obtenerClaveTarea = (categoriaUid, tarea, tareaIndex) => {
        return `${categoriaUid}-${tarea?.uid || tarea?.id || tareaIndex}`;
    };

    const actualizarNombreCategoria = (categoriaIndex, categoriaUid, nombreCategoria) => {
        setCategorias(prev =>
            prev.map((cat, i) =>
                i === categoriaIndex
                    ? { ...cat, nombre: nombreCategoria }
                    : cat
            )
        );

        setErroresValidacionCategorias(prev => {
            const nuevo = new Set(prev);
            nuevo.delete(categoriaUid);
            return nuevo;
        });
    };



    const confirmarEliminarTarea = (categoriaUid, tareaUid) => {
        setTareaAEliminar({ categoriaUid, tareaUid });
        setMostrarConfirmacionEliminarTarea(true);
    };

    const eliminarTarea = () => {
        const { categoriaUid, tareaUid } = tareaAEliminar;

        // Buscar la tarea por uid
        const categoria = categorias.find(cat => cat.uid === categoriaUid);
        const tarea = categoria?.tareas.find(t => (t.uid || t.id) === tareaUid);

        // Si la tarea tiene ID (está en BD), marcarla para eliminar al guardar
        if (tarea && tarea.id) {
            setTareasAEliminar([...tareasAEliminar, tarea.id]);
        }

        // Eliminar tarea del estado (solo visual)
        setCategorias(categorias.map(cat => {
            if (cat.uid === categoriaUid) {
                return { ...cat, tareas: cat.tareas.filter(t => (t.uid || t.id) !== tareaUid) };
            }
            return cat;
        }));

        setMostrarConfirmacionEliminarTarea(false);
        setTareaAEliminar(null);

    };



    const guardarTareas = async (planificadorIdParam = null) => {
        // Usar el parámetro si se proporciona, sino usar el estado
        const planificadorIdAUsar = planificadorIdParam || idPlanificador;

        setEstadoGuardando(true);
        const usuarioActual = getUsuarioSesion();
        const empresaId = parseInt(localStorage.getItem('empresa')?.trim() || 0, 10);

        try {
            const erroresNombreCategorias = new Set();
            categorias.forEach((categoria) => {
                if (!categoria.nombre || categoria.nombre.trim() === '') {
                    erroresNombreCategorias.add(categoria.uid);
                }
            });

            setErroresValidacionCategorias(erroresNombreCategorias);

            if (erroresNombreCategorias.size > 0) {
                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'Campos obligatorios vacíos' }),
                    detail: intl.formatMessage({ id: 'Hay categorías sin nombre. Complete todos los campos obligatorios marcados en rojo.' }),
                    life: 5000,
                });
                setEstadoGuardando(false);
                return false;
            }

            // Validar que no haya categorías con nombres duplicados
            const nombresCategorias = categorias
                .filter(cat => cat.nombre && cat.nombre.trim() !== '')
                .map(cat => cat.nombre.trim().toLowerCase());

            const nombresCategoriasUnicos = new Set(nombresCategorias);

            if (nombresCategorias.length !== nombresCategoriasUnicos.size) {
                // Encontrar cuál es el nombre duplicado
                const nombresDuplicados = [];
                const nombresVistos = {};

                categorias.forEach(cat => {
                    if (cat.nombre && cat.nombre.trim() !== '') {
                        const nombreNormalizado = cat.nombre.trim().toLowerCase();
                        if (nombresVistos[nombreNormalizado]) {
                            if (!nombresDuplicados.includes(cat.nombre.trim())) {
                                nombresDuplicados.push(cat.nombre.trim());
                            }
                        }
                        nombresVistos[nombreNormalizado] = true;
                    }
                });

                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'Error - Nombres duplicados' }),
                    detail: intl.formatMessage({ id: 'Hay categorías con el mismo nombre: "' }) + nombresDuplicados.join('", "') + intl.formatMessage({ id: '". Cada categoría debe tener un nombre único.' }),
                    life: 6000,
                });
                setEstadoGuardando(false);
                return false;
            }

            // Validar que todas las tareas tengan nombre
            const erroresNombreTareas = new Set();
            for (const categoria of categorias) {
                for (const [tareaIndex, tarea] of categoria.tareas.entries()) {
                    if (!tarea.nombreTarea || tarea.nombreTarea.trim() === '') {
                        erroresNombreTareas.add(obtenerClaveTarea(categoria.uid, tarea, tareaIndex));
                    }
                }
            }

            setErroresValidacionTareas(erroresNombreTareas);

            if (erroresNombreTareas.size > 0) {
                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'Campos obligatorios vacíos' }),
                    detail: intl.formatMessage({ id: 'Hay tareas sin nombre. Complete todos los campos obligatorios marcados en rojo.' }),
                    life: 5000,
                });
                setEstadoGuardando(false);
                return false;
            }

            // Validar que no haya tareas con nombres duplicados en cada categoría
            for (const categoria of categorias) {
                const nombresTareas = categoria.tareas
                    .filter(t => t.nombreTarea && t.nombreTarea.trim() !== '')
                    .map(t => t.nombreTarea.trim().toLowerCase());

                const nombresUnicos = new Set(nombresTareas);

                if (nombresTareas.length !== nombresUnicos.size) {
                    // Encontrar cuál es el nombre duplicado para mostrarlo en el error
                    const nombresDuplicados = [];
                    const nombresVistos = {};

                    categoria.tareas.forEach(t => {
                        if (t.nombreTarea && t.nombreTarea.trim() !== '') {
                            const nombreNormalizado = t.nombreTarea.trim().toLowerCase();
                            if (nombresVistos[nombreNormalizado]) {
                                if (!nombresDuplicados.includes(t.nombreTarea.trim())) {
                                    nombresDuplicados.push(t.nombreTarea.trim());
                                }
                            }
                            nombresVistos[nombreNormalizado] = true;
                        }
                    });

                    toast.current?.show({
                        severity: 'error',
                        summary: intl.formatMessage({ id: 'Error - Nombres duplicados' }),
                        detail: intl.formatMessage({ id: 'La categoría "' }) + categoria.nombre + intl.formatMessage({ id: '" tiene tareas con el mismo nombre: "' }) + nombresDuplicados.join('", "') + intl.formatMessage({ id: '". Cada tarea debe tener un nombre único dentro de su categoría.' }),
                        life: 6000,
                    });
                    setEstadoGuardando(false);
                    return false;
                }
            }
            for (const categoria of categorias) {
                for (const tarea of categoria.tareas) {
                    if (esDetalleProducto) {
                        continue;
                    }

                    if (tarea.empiezaEn !== null && tarea.empiezaEn < 1) {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'ERROR' }),
                            detail: intl.formatMessage({ id: 'La tarea "' }) + tarea.nombreTarea + intl.formatMessage({ id: '" en la categoría "' }) + categoria.nombre + intl.formatMessage({ id: '" tiene un día de inicio menor a 1.' }),
                            life: 5000,
                        });
                        setEstadoGuardando(false);
                        return false;
                    }

                    if (tarea.terminaEn !== null && tarea.terminaEn < 1) {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'ERROR' }),
                            detail: intl.formatMessage({ id: 'La tarea "' }) + tarea.nombreTarea + intl.formatMessage({ id: '" en la categoría "' }) + categoria.nombre + intl.formatMessage({ id: '" tiene un día de fin menor a 1.' }),
                            life: 5000,
                        });
                        setEstadoGuardando(false);
                        return false;
                    }

                }
            }



            // Eliminar las tareas marcadas para eliminar (incluye placeholders)
            const placeholdersAEliminar = categorias
                .filter(cat => cat.placeholderId && cat.tareas.length > 0)
                .map(cat => cat.placeholderId);
            const tareasAEliminarFinal = Array.from(new Set([...tareasAEliminar, ...placeholdersAEliminar]));

            for (const tareaId of tareasAEliminarFinal) {
                try {
                    if (esDetalleProducto) {
                        await deletePlanificadorDetalle(tareaId);
                        continue;
                    }

                    // Primero eliminar responsables asociados
                    const filtroResponsables = JSON.stringify({
                        where: {
                            planificadorPlantillaId: tareaId,
                        },
                    });
                    const responsablesExistentes = await getPlanificadorPlantillaResponsables(filtroResponsables);

                    for (const responsable of responsablesExistentes) {
                        await deletePlanificadorPlantillaResponsable(responsable.id);
                    }

                    // Luego eliminar emails asociados
                    const filtroEmails = JSON.stringify({
                        where: {
                            planificadorPlantillaId: tareaId,
                        },
                    });
                    const emailsExistentes = await getPlanificadorPlantillaEmails(filtroEmails);

                    for (const email of emailsExistentes) {
                        await deletePlanificadorPlantillaEmail(email.id);
                    }

                    // Finalmente eliminar la plantilla
                    await deletePlanificadorPlantilla(tareaId);
                } catch (error) {
                    if (error?.response?.status === 404) {
                        continue;
                    }

                    console.error(`Error al eliminar tarea ${tareaId}:`, error);
                    throw error; // Relanzar el error para que se maneje en el catch principal
                }
            }

            // Limpiar la lista de tareas a eliminar
            setTareasAEliminar([]);
            setErroresValidacionCategorias(new Set());
            setErroresValidacionTareas(new Set());
            // Mapa para convertir UIDs temporales a IDs reales
            const uidToIdMap = {};

            // Guardar categorías sin tareas (crear placeholder o actualizar nombre)
            for (const categoria of categorias) {
                if (!categoria.nombre || categoria.nombre.trim() === '' || categoria.tareas.length > 0) {
                    continue;
                }

                if (categoria.placeholderId) {
                    const categoriaPatch = {
                        nombreCategoria: categoria.nombre,
                        usuModificacion: usuarioActual.id
                    };
                    if (esDetalleProducto) {
                        await patchPlanificadorDetalle(categoria.placeholderId, categoriaPatch);
                    } else {
                        await patchPlanificadorPlantilla(categoria.placeholderId, categoriaPatch);
                    }
                } else {
                    const categoriaPost = esDetalleProducto
                        ? {
                            planificadorId: planificadorIdAUsar,
                            productoPlanificadorId: idProductoPlanificador,
                            productoId: idProducto,
                            planificadorTareaId: null,
                            tareaAsociadaId: null,
                            nombreCategoria: categoria.nombre,
                            nombreTarea: null,
                            empiezaEn: null,
                            terminaEn: null,
                            diasAvisoDesdeInicio: null,
                            diasAvisoDesdeFin: null,
                            diasAvisoAFin: null,
                            fechaInicio: null,
                            fechaFin: null,
                            fechaAvisoDesdeInicio: null,
                            fechaAvisoAFin: null,
                            fechaAvisoDesdeFin: null,
                            activoSn: 'S',
                            usuCreacion: usuarioActual.id
                        }
                        : {
                            empresaId,
                            planificadorId: planificadorIdAUsar,
                            tareaAsociadaId: null,
                            nombreCategoria: categoria.nombre,
                            nombreTarea: null,
                            empiezaEn: null,
                            terminaEn: null,
                            diasAvisoDesdeInicio: null,
                            diasAvisoDesdeFin: null,
                            diasAvisoAFin: null,
                            activoSn: 'S',
                            usuCreacion: usuarioActual.id
                        };
                    if (esDetalleProducto) {
                        await postPlanificadorDetalle(categoriaPost);
                    } else {
                        await postPlanificadorPlantilla(categoriaPost);
                    }
                }
            }

            for (const categoria of categorias) {
                // Si tiene tareas, procesarlas normalmente
                for (const tarea of categoria.tareas) {
                    let tareaId = tarea.id;

                    if (!tarea.id) {
                        // POST - Nueva tarea sin ID, guardar primero sin tareaAsociadaId
                        const tareaDataPost = esDetalleProducto
                            ? {
                                planificadorId: planificadorIdAUsar,
                                productoPlanificadorId: idProductoPlanificador,
                                productoId: idProducto,
                                planificadorTareaId: tarea.planificadorTareaId || null,
                                tareaAsociadaId: null,
                                nombreCategoria: categoria.nombre,
                                nombreTarea: tarea.nombreTarea,
                                empiezaEn: tarea.empiezaEn || null,
                                terminaEn: tarea.terminaEn || null,
                                diasAvisoDesdeInicio: tarea.diasAvisoDesdeInicio || null,
                                diasAvisoDesdeFin: tarea.diasAvisoDesdeFin || null,
                                diasAvisoAFin: tarea.diasAvisoAFin || null,
                                fechaInicio: convertirFechaATexto(tarea.fechaInicio),
                                fechaFin: convertirFechaATexto(tarea.fechaFin),
                                fechaAvisoDesdeInicio: convertirFechaATexto(tarea.fechaAvisoDesdeInicio),
                                fechaAvisoAFin: convertirFechaATexto(tarea.fechaAvisoAFin),
                                fechaAvisoDesdeFin: convertirFechaATexto(tarea.fechaAvisoDesdeFin),
                                estado: tarea.estado || null,
                                comentarios: tarea.comentarios || null,
                                responsable: obtenerResponsableDetalle(tarea.emailResponsables),
                                avisoEmails: obtenerTextoDesdeIds(tarea.emailEnvio),
                                activoSn: tarea.activoSn || 'S',
                                usuCreacion: usuarioActual.id
                            }
                            : {
                                empresaId,
                                planificadorId: planificadorIdAUsar,
                                tareaAsociadaId: null,
                                nombreCategoria: categoria.nombre,
                                nombreTarea: tarea.nombreTarea,
                                empiezaEn: tarea.empiezaEn || null,
                                terminaEn: tarea.terminaEn || null,
                                diasAvisoDesdeInicio: tarea.diasAvisoDesdeInicio || null,
                                diasAvisoDesdeFin: tarea.diasAvisoDesdeFin || null,
                                diasAvisoAFin: tarea.diasAvisoAFin || null,
                                estado: tarea.estado || null,
                                comentarios: tarea.comentarios || null,
                                activoSn: tarea.activoSn || 'S',
                                usuCreacion: usuarioActual.id
                            };
                        const resultado = esDetalleProducto
                            ? await postPlanificadorDetalle(tareaDataPost)
                            : await postPlanificadorPlantilla(tareaDataPost);
                        tareaId = resultado.id;

                        // Guardar el mapeo de UID a ID real
                        if (tarea.uid) {
                            uidToIdMap[tarea.uid] = tareaId;
                        }
                    }
                }
            }

            // Actualizar tareas con sus asociaciones correctas y responsables/emails
            for (const categoria of categorias) {
                if (categoria.tareas.length === 0) continue;

                for (const tarea of categoria.tareas) {
                    let tareaId = tarea.id || uidToIdMap[tarea.uid];

                    if (!tareaId) {
                        continue;
                    }

                    // Resolver la tarea asociada (puede ser un UID temporal o un ID real)
                    let tareaAsociadaId = tarea.tareaAsociadaId;
                    if (tareaAsociadaId && uidToIdMap[tareaAsociadaId]) {
                        tareaAsociadaId = uidToIdMap[tareaAsociadaId];
                    }

                    const tareaDataPatch = esDetalleProducto
                        ? {
                            tareaAsociadaId: tareaAsociadaId || null,
                            nombreCategoria: categoria.nombre,
                            nombreTarea: tarea.nombreTarea,
                            empiezaEn: tarea.empiezaEn || null,
                            terminaEn: tarea.terminaEn || null,
                            diasAvisoDesdeInicio: tarea.diasAvisoDesdeInicio || null,
                            diasAvisoDesdeFin: tarea.diasAvisoDesdeFin || null,
                            diasAvisoAFin: tarea.diasAvisoAFin || null,
                            fechaInicio: convertirFechaATexto(tarea.fechaInicio),
                            fechaFin: convertirFechaATexto(tarea.fechaFin),
                            fechaAvisoDesdeInicio: convertirFechaATexto(tarea.fechaAvisoDesdeInicio),
                            fechaAvisoAFin: convertirFechaATexto(tarea.fechaAvisoAFin),
                            fechaAvisoDesdeFin: convertirFechaATexto(tarea.fechaAvisoDesdeFin),
                            estado: tarea.estado || null,
                            comentarios: tarea.comentarios || null,
                            responsable: obtenerResponsableDetalle(tarea.emailResponsables),
                            avisoEmails: obtenerTextoDesdeIds(tarea.emailEnvio),
                            activoSn: tarea.activoSn || 'S',
                            usuModificacion: usuarioActual.id
                        }
                        : {
                            tareaAsociadaId: tareaAsociadaId || null,
                            nombreCategoria: categoria.nombre,
                            nombreTarea: tarea.nombreTarea,
                            empiezaEn: tarea.empiezaEn || null,
                            terminaEn: tarea.terminaEn || null,
                            diasAvisoDesdeInicio: tarea.diasAvisoDesdeInicio || null,
                            diasAvisoDesdeFin: tarea.diasAvisoDesdeFin || null,
                            diasAvisoAFin: tarea.diasAvisoAFin || null,
                            estado: tarea.estado || null,
                            comentarios: tarea.comentarios || null,
                            activoSn: tarea.activoSn || 'S',
                            usuModificacion: usuarioActual.id
                        };
                    if (esDetalleProducto) {
                        await patchPlanificadorDetalle(tareaId, tareaDataPatch);
                        continue;
                    }

                    await patchPlanificadorPlantilla(tareaId, tareaDataPatch);

                    // Gestionar responsables (relación con tabla planificador_plantilla_responsable)
                    if (tareaId) {
                        const filtroResponsables = JSON.stringify({
                            where: {
                                planificadorPlantillaId: tareaId,
                            },
                        });
                        const responsablesExistentes = await getPlanificadorPlantillaResponsables(filtroResponsables);
                        const responsablesSeleccionadosIds = Array.from(
                            new Set(
                                (Array.isArray(tarea.emailResponsables) ? tarea.emailResponsables : [])
                                    .map((id) => parseInt(id, 10))
                                    .filter((id) => !Number.isNaN(id))
                            )
                        );

                        await Promise.all(
                            responsablesExistentes.map((responsable) =>
                                deletePlanificadorPlantillaResponsable(responsable.id)
                            )
                        );

                        await Promise.all(
                            responsablesSeleccionadosIds.map((responsableId) =>
                                postPlanificadorPlantillaResponsable({
                                    responsableId,
                                    planificadorPlantillaId: tareaId,
                                })
                            )
                        );

                        // Gestionar emails asociados a la tarea de plantilla
                        const filtroEmails = JSON.stringify({
                            where: {
                                planificadorPlantillaId: tareaId,
                            },
                        });
                        const emailsExistentes = await getPlanificadorPlantillaEmails(filtroEmails);
                        const emailsSeleccionadosIds = Array.from(
                            new Set(
                                (Array.isArray(tarea.emailEnvio) ? tarea.emailEnvio : [])
                                    .map((id) => parseInt(id, 10))
                                    .filter((id) => !Number.isNaN(id))
                            )
                        );

                        await Promise.all(
                            emailsExistentes.map((email) =>
                                deletePlanificadorPlantillaEmail(email.id)
                            )
                        );

                        await Promise.all(
                            emailsSeleccionadosIds.map((usuarioId) =>
                                postPlanificadorPlantillaEmail({
                                    usuarioId,
                                    planificadorPlantillaId: tareaId,
                                })
                            )
                        );
                    }
                }
            }

            // Recargar los datos para reflejar los cambios
            await cargarDatos();

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Tareas guardadas correctamente' }),
                life: 3000,
            });

            return true; // Retornar true para indicar éxito

        } catch (error) {
            console.error('Error al guardar plantillas:', error);
            const detalleError =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                intl.formatMessage({ id: 'Error al guardar las plantillas' });
            toast.current?.show({
                severity: 'error',
                summary: intl.formatMessage({ id: 'ERROR' }),
                detail: detalleError,
                life: 5000,
            });
            return false; // Retornar false para indicar error
        } finally {
            setEstadoGuardando(false);
        }
    };

    const footerConfirmacionEliminarCategoria = (
        <div className="flex gap-2 justify-content-end">
            <Button
                label={intl.formatMessage({ id: 'Cancelar' })}
                className="p-button-secondary"
                onClick={() => setMostrarConfirmacionEliminarCategoria(false)}
            />
            <Button
                label={intl.formatMessage({ id: 'Sí, eliminar categoría' })}
                icon="pi pi-exclamation-triangle"
                className="p-button-danger"
                onClick={eliminarCategoria}
            />
        </div>
    );

    const footerConfirmacionEliminarTarea = (
        <div className="flex gap-2 justify-content-end">
            <Button
                label={intl.formatMessage({ id: 'Cancelar' })}
                className="p-button-secondary"
                onClick={() => setMostrarConfirmacionEliminarTarea(false)}
            />
            <Button
                label={intl.formatMessage({ id: 'Sí, eliminar tarea' })}
                icon="pi pi-exclamation-triangle"
                className="p-button-danger"
                onClick={eliminarTarea}
            />
        </div>
    );

    if (cargando) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Cargando plantillas...' })}</div>;
    }

    const Wrapper = ocultarRecuadro ? 'div' : Fieldset;
    return (
        <Wrapper
            {...(!ocultarRecuadro && { legend: intl.formatMessage({ id: 'Plantillas' }) })}
        >
            <div className="flex flex-column">
                {editable && (
                    <div className="flex justify-content-start align-items-center gap-3 flex-wrap mb-4 mt-4">
                        <Button
                            label={intl.formatMessage({ id: 'Nueva Categoría' })}
                            onClick={() => agregarCategoria('')}
                        />
                    </div>
                )}

                {categorias.length === 0 ? (
                    <div className="text-center p-4" style={{ color: '#6c757d' }}>
                        {intl.formatMessage({ id: 'No hay categorías. Cree una nueva categoría para comenzar.' })}
                    </div>
                ) : (
                    categorias.map((categoria, categoriaIndex) => (
                        <div
                            key={categoria.uid}
                            ref={(elemento) => {
                                if (elemento) {
                                    categoriaRefs.current[categoria.uid] = elemento;
                                }
                            }}
                            className="mb-3"
                        >
                            <Fieldset className={`mt-3 ${erroresValidacionCategorias.has(categoria.uid) ? 'border-red-500 bg-red-50' : ''}`}>
                                <div className="flex flex-column">
                                    <div className="flex align-items-center gap-3 mt-2 mb-3" style={{ width: '50%' }}>
                                        {/* Input editable para el nombre de la categoría */}
                                        <InputText
                                            value={categoria.nombre}
                                            onChange={(e) => actualizarNombreCategoria(categoriaIndex, categoria.uid, e.target.value)}
                                            placeholder={intl.formatMessage({ id: 'Nombre de la categoría' })}
                                            className={`col-8 col-sm-12 ${erroresValidacionCategorias.has(categoria.uid) ? 'p-invalid' : ''}`}
                                            style={{ height: '42px' }}
                                            maxLength={100}
                                            disabled={!editable}
                                        />
                                        {erroresValidacionCategorias.has(categoria.uid) && (
                                            <small className="p-error">{intl.formatMessage({ id: 'Campo requerido' })}</small>
                                        )}
                                        {editable && (
                                            <Button
                                                label={intl.formatMessage({ id: 'Nueva tarea' })}
                                                onClick={() => agregarTarea(categoria.uid)}
                                                disabled={!editable || !categoria.nombre || categoria.nombre.trim() === ''}
                                            />
                                        )}
                                        {editable && (
                                            <Button
                                                icon="pi pi-trash"
                                                className="p-button-danger p-button-outlined"
                                                onClick={() => confirmarEliminarCategoria(categoria.uid)}
                                                tooltip={intl.formatMessage({ id: 'Eliminar categoría' })}
                                                tooltipOptions={{ position: 'top' }}
                                            />
                                        )}
                                    </div>

                                    {categoria.tareas.length > 0 && (
                                        <div>
                                            {categoria.tareas.map((tarea, tareaIndex) => {
                                                // Filtrar las tareas de la misma categoría para el dropdown (excluyendo la tarea actual)
                                                const tareasDeCategoria = categoria.tareas
                                                    .filter((t, idx) => idx !== tareaIndex) // Excluir la tarea actual
                                                    .filter(t => t.nombreTarea && t.nombreTarea.trim() !== '') // Solo tareas con nombre
                                                    .map(t => ({
                                                        label: t.nombreTarea,
                                                        value: t.id || t.uid // Usar uid si no tiene id (tarea nueva)
                                                    }));

                                                const tareaKey = tarea.uid || tarea.id || `nueva-${tareaIndex}`;
                                                const detallesVisibles = tareasExpandidas[tareaKey] === true;
                                                const tareaConError = erroresValidacionTareas.has(obtenerClaveTarea(categoria.uid, tarea, tareaIndex));

                                                return (
                                                    <div
                                                        key={tareaKey}
                                                        ref={(elemento) => {
                                                            if (elemento) {
                                                                tareaRefs.current[tarea.uid || tarea.id || tareaKey] = elemento;
                                                            }
                                                        }}
                                                    >
                                                        <Fieldset className={`mt-5 mb-3 ${tareaConError ? 'border-red-500 bg-red-50' : ''}`} style={{ position: 'relative' }}>

                                                        <div className="formgrid grid">
                                                            <div className="field col-12 md:col-3">
                                                                <label className="font-bold">{intl.formatMessage({ id: 'Nombre de la tarea' })}*</label>
                                                                <div style={{ position: 'relative' }}>
                                                                    <Button
                                                                        icon={detallesVisibles ? 'pi pi-chevron-down' : 'pi pi-chevron-right'}
                                                                        className="p-button-text p-button-sm"
                                                                        onClick={() => toggleDetallesTarea(tareaKey)}
                                                                        aria-label={detallesVisibles ? intl.formatMessage({ id: 'Contraer detalles' }) : intl.formatMessage({ id: 'Expandir detalles' })}
                                                                        tooltip={detallesVisibles ? intl.formatMessage({ id: 'Ocultar detalles' }) : intl.formatMessage({ id: 'Ver detalles' })}
                                                                        tooltipOptions={{ position: 'top' }}
                                                                        type="button"
                                                                        style={{
                                                                            width: '1.9rem',
                                                                            height: '1.9rem',
                                                                            padding: 0,
                                                                            borderRadius: '4px',
                                                                            position: 'absolute',
                                                                            left: '-2rem',
                                                                            top: '50%',
                                                                            transform: 'translateY(-50%)'
                                                                        }}
                                                                    />
                                                                    <InputText
                                                                        value={tarea.nombreTarea || ''}
                                                                        onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'nombreTarea', e.target.value)}
                                                                        className={`w-full ${tareaConError ? 'p-invalid' : ''}`}
                                                                        placeholder={intl.formatMessage({ id: 'Nombre' })}
                                                                        disabled={!editable}
                                                                    />
                                                                </div>
                                                                {tareaConError && (
                                                                    <small className="p-error">{intl.formatMessage({ id: 'Campo requerido' })}</small>
                                                                )}
                                                            </div>

                                                            {mostrarEstado && (
                                                                <div className="field col-12 md:col-2">
                                                                    <label>{intl.formatMessage({ id: 'Estado' })}</label>
                                                                    <Dropdown
                                                                        value={tarea.estado || null}
                                                                        options={estadosMaestra}
                                                                        onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'estado', e.value || null)}
                                                                        placeholder={intl.formatMessage({ id: 'Selecciona' })}
                                                                        className="w-full"
                                                                        showClear
                                                                        disabled={!editable}
                                                                        emptyMessage={intl.formatMessage({ id: 'No hay estados disponibles' })}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="field col-12 md:col-3">
                                                                <label>{intl.formatMessage({ id: 'Responsables' })}</label>
                                                                <MultiSelect
                                                                    value={Array.isArray(tarea.emailResponsables) ? tarea.emailResponsables : []}
                                                                    options={usuariosDisponibles}
                                                                    onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'emailResponsables', esDetalleProducto ? (e.value || []).slice(-1) : e.value || [])}
                                                                    placeholder={cargandoUsuarios ? intl.formatMessage({ id: 'Cargando...' }) : intl.formatMessage({ id: 'Seleccionar' })}
                                                                    className="w-full"
                                                                    display="chip"
                                                                    maxSelectedLabels={esDetalleProducto ? 1 : 2}
                                                                    dataKey="value"
                                                                    filter
                                                                    disabled={!editable || cargandoUsuarios}
                                                                    emptyMessage={intl.formatMessage({ id: 'No hay usuarios' })}
                                                                    emptyFilterMessage={intl.formatMessage({ id: 'Sin resultados' })}
                                                                />
                                                            </div>

                                                            <div className="field col-12 md:col-3">
                                                                <label>{intl.formatMessage({ id: 'Envío email' })}</label>
                                                                <MultiSelect
                                                                    value={Array.isArray(tarea.emailEnvio) ? tarea.emailEnvio : []}
                                                                    options={usuariosEmail}
                                                                    onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'emailEnvio', e.value || [])}
                                                                    placeholder={cargandoUsuarios ? intl.formatMessage({ id: 'Cargando...' }) : intl.formatMessage({ id: 'Seleccionar' })}
                                                                    className="w-full"
                                                                    display="chip"
                                                                    maxSelectedLabels={2}
                                                                    dataKey="value"
                                                                    filter
                                                                    disabled={!editable || cargandoUsuarios}
                                                                    emptyMessage={intl.formatMessage({ id: 'No hay usuarios' })}
                                                                    emptyFilterMessage={intl.formatMessage({ id: 'Sin resultados' })}
                                                                />
                                                            </div>

                                                            <div className="field col-12 md:col-1 flex align-items-end justify-content-end pr-2">
                                                                {editable && (
                                                                    <Button
                                                                        icon="pi pi-trash"
                                                                        className="p-button-danger p-button-outlined"
                                                                        onClick={() => confirmarEliminarTarea(categoria.uid, tarea.uid || tarea.id)}
                                                                        tooltip={intl.formatMessage({ id: 'Eliminar tarea' })}
                                                                        tooltipOptions={{ position: 'top' }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Segunda fila: detalle de la tarea */}
                                                        {detallesVisibles && (
                                                            <div className="formgrid grid align-items-end">
                                                                <div className="field col-12 md:col-2">
                                                                    <label>{intl.formatMessage({ id: 'Tarea Asociada' })}</label>
                                                                    <Dropdown
                                                                        value={tarea.tareaAsociadaId}
                                                                        options={tareasDeCategoria}
                                                                        onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'tareaAsociadaId', e.value)}
                                                                        placeholder={intl.formatMessage({ id: 'Seleccionar' })}
                                                                        className="w-full"
                                                                        showClear
                                                                        disabled={!editable || tareasDeCategoria.length === 0}
                                                                        emptyMessage={intl.formatMessage({ id: 'No hay tareas' })}
                                                                    />
                                                                </div>

                                                                {!esDetalleProducto ? (
                                                                    <>
                                                                        <div className="field col-6 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Empieza en (días)' })}</label>
                                                                            <InputNumber
                                                                                value={tarea.empiezaEn}
                                                                                onValueChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'empiezaEn', e.value)}
                                                                                className={`w-full ${estadoGuardando && tarea.empiezaEn !== null && tarea.empiezaEn < 1 ? 'p-invalid' : ''}`}
                                                                                inputClassName="text-right"
                                                                                placeholder="0"
                                                                                min={1}
                                                                                disabled={!editable}
                                                                            />
                                                                            {estadoGuardando && tarea.empiezaEn !== null && tarea.empiezaEn < 1 && (
                                                                                <small className="p-error">{intl.formatMessage({ id: 'Debe ser mayor a 0' })}</small>
                                                                            )}
                                                                        </div>
                                                                        <div className="field col-6 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Termina en (días)' })}</label>
                                                                            <InputNumber
                                                                                value={tarea.terminaEn}
                                                                                onValueChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'terminaEn', e.value)}
                                                                                className={`w-full ${estadoGuardando && tarea.terminaEn !== null && tarea.terminaEn < 1 ? 'p-invalid' : ''}`}
                                                                                inputClassName="text-right"
                                                                                placeholder="0"
                                                                                min={1}
                                                                                disabled={!editable}
                                                                            />
                                                                        </div>
                                                                        <div className="field col-4 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Aviso desde inicio' })}</label>
                                                                            <InputNumber
                                                                                value={tarea.diasAvisoDesdeInicio}
                                                                                onValueChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'diasAvisoDesdeInicio', e.value)}
                                                                                className="w-full"
                                                                                inputClassName="text-right"
                                                                                placeholder="0"
                                                                                min={0}
                                                                                disabled={!editable}
                                                                            />
                                                                        </div>
                                                                        <div className="field col-4 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Aviso a fin' })}</label>
                                                                            <InputNumber
                                                                                value={tarea.diasAvisoAFin}
                                                                                onValueChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'diasAvisoAFin', e.value)}
                                                                                className="w-full"
                                                                                inputClassName="text-right"
                                                                                placeholder="0"
                                                                                min={0}
                                                                                disabled={!editable}
                                                                            />
                                                                        </div>
                                                                        <div className="field col-4 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Aviso desde fin' })}</label>
                                                                            <InputNumber
                                                                                value={tarea.diasAvisoDesdeFin}
                                                                                onValueChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'diasAvisoDesdeFin', e.value)}
                                                                                className="w-full"
                                                                                inputClassName="text-right"
                                                                                placeholder="0"
                                                                                min={0}
                                                                                disabled={!editable}
                                                                            />
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="field col-6 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Fecha de inicio' })}</label>
                                                                            <Calendar
                                                                                value={tarea.fechaInicio || null}
                                                                                onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'fechaInicio', e.value || null)}
                                                                                dateFormat="dd/mm/yy"
                                                                                placeholder="dd/mm/yyyy"
                                                                                className="w-full"
                                                                                disabled={!editable}
                                                                                showIcon
                                                                            />
                                                                        </div>
                                                                        <div className="field col-6 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Fecha de fin' })}</label>
                                                                            <Calendar
                                                                                value={tarea.fechaFin || null}
                                                                                onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'fechaFin', e.value || null)}
                                                                                dateFormat="dd/mm/yy"
                                                                                placeholder="dd/mm/yyyy"
                                                                                className="w-full"
                                                                                disabled={!editable}
                                                                                showIcon
                                                                            />
                                                                        </div>
                                                                        <div className="field col-4 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Aviso desde inicio' })}</label>
                                                                            <Calendar
                                                                                value={tarea.fechaAvisoDesdeInicio || null}
                                                                                onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'fechaAvisoDesdeInicio', e.value || null)}
                                                                                dateFormat="dd/mm/yy"
                                                                                placeholder="dd/mm/yyyy"
                                                                                className="w-full"
                                                                                disabled={!editable}
                                                                                showIcon
                                                                            />
                                                                        </div>
                                                                        <div className="field col-4 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Aviso a fin' })}</label>
                                                                            <Calendar
                                                                                value={tarea.fechaAvisoAFin || null}
                                                                                onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'fechaAvisoAFin', e.value || null)}
                                                                                dateFormat="dd/mm/yy"
                                                                                placeholder="dd/mm/yyyy"
                                                                                className="w-full"
                                                                                disabled={!editable}
                                                                                showIcon
                                                                            />
                                                                        </div>
                                                                        <div className="field col-4 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Aviso desde fin' })}</label>
                                                                            <Calendar
                                                                                value={tarea.fechaAvisoDesdeFin || null}
                                                                                onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'fechaAvisoDesdeFin', e.value || null)}
                                                                                dateFormat="dd/mm/yy"
                                                                                placeholder="dd/mm/yyyy"
                                                                                className="w-full"
                                                                                disabled={!editable}
                                                                                showIcon
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="field col-12">
                                                                    <label>{intl.formatMessage({ id: 'Comentarios' })}</label>
                                                                    <InputTextarea
                                                                        value={tarea.comentarios || ''}
                                                                        onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'comentarios', e.target.value)}
                                                                        rows={2}
                                                                        autoResize
                                                                        className="w-full"
                                                                        disabled={!editable}
                                                                    />
                                                                </div>
                                                                <div className="field col-12 flex justify-content-start">
                                                                    <div className="flex flex-column align-items-start text-left">
                                                                        <label className="mb-2">{intl.formatMessage({ id: 'Activo' })}</label>
                                                                        <InputSwitch
                                                                            checked={tarea.activoSn === "S"}
                                                                            onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'activoSn', e.value ? 'S' : 'N')}
                                                                            disabled={!editable}
                                                                        />
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        )}
                                                        </Fieldset>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Fieldset>
                        </div>
                    ))
                )}
            </div>




            {/* Dialog confirmar eliminar categoría */}
            <Dialog
                visible={mostrarConfirmacionEliminarCategoria}
                style={{ width: '36rem', maxWidth: '95vw' }}
                header={intl.formatMessage({ id: 'Eliminar categoría del planificador' })}
                modal
                footer={footerConfirmacionEliminarCategoria}
                onHide={() => setMostrarConfirmacionEliminarCategoria(false)}
            >
                <div className="flex align-items-center gap-3 mb-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-500" />
                    <span className="font-bold text-lg">
                        {intl.formatMessage({ id: 'Atención: esta acción es irreversible' })}
                    </span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                    {intl.formatMessage({ id: 'Al eliminar esta categoría del planificador se eliminarán de forma permanente:' })}
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>{intl.formatMessage({ id: 'La categoría seleccionada' })}</li>
                    <li>{intl.formatMessage({ id: 'Todas las tareas dentro de esa categoría' })}</li>
                    <li>{intl.formatMessage({ id: 'Los datos rellenados en esas tareas' })}</li>
                </ul>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                    <strong>{intl.formatMessage({ id: '¿Desea continuar?' })}</strong>
                </p>
            </Dialog>

            {/* Dialog confirmar eliminar tarea */}
            <Dialog
                visible={mostrarConfirmacionEliminarTarea}
                style={{ width: '36rem', maxWidth: '95vw' }}
                header={intl.formatMessage({ id: 'Eliminar tarea del planificador' })}
                modal
                footer={footerConfirmacionEliminarTarea}
                onHide={() => setMostrarConfirmacionEliminarTarea(false)}
            >
                <div className="flex align-items-center gap-3 mb-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-500" />
                    <span className="font-bold text-lg">
                        {intl.formatMessage({ id: 'Atención: esta acción es irreversible' })}
                    </span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                    {intl.formatMessage({ id: 'Al eliminar esta tarea del planificador se eliminarán de forma permanente:' })}
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>{intl.formatMessage({ id: 'La tarea seleccionada' })}</li>
                    <li>{intl.formatMessage({ id: 'Los datos rellenados en esa tarea' })}</li>
                    <li>{intl.formatMessage({ id: 'Su relación con tareas asociadas' })}</li>
                </ul>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                    <strong>{intl.formatMessage({ id: '¿Desea continuar?' })}</strong>
                </p>
            </Dialog>
        </Wrapper>
    );
});


TareasPlantilla.displayName = 'TareasPlantilla';

export default TareasPlantilla;

