"use client";

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { getPlanificadorPlantillas, postPlanificadorPlantilla, patchPlanificadorPlantilla, deletePlanificadorPlantilla } from '@/app/api-endpoints/planificador_plantilla';
import { getUsuarioSesion } from '@/app/utility/Utils';
import { useIntl } from 'react-intl';
import { MultiSelect } from 'primereact/multiselect';
import { getVistaUsuarios } from '@/app/api-endpoints/usuario';
import { getPlanificadorPlantillaResponsables, postPlanificadorPlantillaResponsable, deletePlanificadorPlantillaResponsable } from '@/app/api-endpoints/planificador_plantilla_responsable';
import { getPlanificadorPlantillaEmails, postPlanificadorPlantillaEmail, deletePlanificadorPlantillaEmail } from '@/app/api-endpoints/planificador_plantilla_email';
import { getPlanificadorEstados } from '@/app/api-endpoints/planificador_estado';

const TareasPlantilla = React.forwardRef(({ idPlanificador, toastRef, editable = true }, ref) => {
    const toast = toastRef; // Usar el toast del componente padre
    const intl = useIntl();
    const [categorias, setCategorias] = useState([]);
    const [mostrarConfirmacionEliminarCategoria, setMostrarConfirmacionEliminarCategoria] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
    const [mostrarConfirmacionEliminarTarea, setMostrarConfirmacionEliminarTarea] = useState(false);
    const [tareaAEliminar, setTareaAEliminar] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [tareasExpandidas, setTareasExpandidas] = useState({});

    // Estados para seguir eliminaciones pendientes
    const [tareasAEliminar, setTareasAEliminar] = useState([]); // IDs de tareas a eliminar al guardar
    // Estado para usuarios/emails
    const [usuariosDisponibles, setUsuariosDisponibles] = useState([]); // Para responsables (con filtro de rol)
    const [usuariosEmail, setUsuariosEmail] = useState([]); // Para envío de email (sin filtro de rol)
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [estadosMaestra, setEstadosMaestra] = useState([]);

    useEffect(() => {
        cargarDatos();
        cargarUsuarios();
        cargarMaestras();
    }, [idPlanificador]);

    // Exponer la función guardarTareas al componente padre
    React.useImperativeHandle(ref, () => ({
        guardarTareas
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

            // Usamos los usuarios activos de la empresa tanto para responsables como para envío.
            const usuariosFormateados = usuarios.map(usuario => ({
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
                    value: estado.nombre,
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

            const filtro = JSON.stringify({
                where: whereConditions
            });


            const plantillas = await getPlanificadorPlantillas(filtro);

            // Así que filtramos en el frontend como medida de seguridad
            const plantillasFiltradas = plantillas.filter(plantilla => {
                const planificadorIdPlantilla = plantilla.planificadorId;
                return planificadorIdPlantilla === idPlanificador;
            });

            // Cargar responsables y emails para todas las plantillas
            const responsablesPorPlantilla = {};
            const emailsPorPlantilla = {};

            for (const plantilla of plantillasFiltradas) {
                // Cargar responsables - usar formato 'and' para que el backend lo procese
                const filtroResponsables = JSON.stringify({
                    where: {
                        and: {
                            planificadorPlantillaId: plantilla.id,
                        },
                    },
                });
                const responsables = await getPlanificadorPlantillaResponsables(filtroResponsables);
                const responsablesIds = responsables.map(responsable => responsable.responsableId);
                responsablesPorPlantilla[plantilla.id] = responsablesIds;

                // Cargar emails - usar formato 'and' para que el backend lo procese
                const filtroEmails = JSON.stringify({
                    where: {
                        and: {
                            planificadorPlantillaId: plantilla.id,
                        },
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
                    tareaAsociadaId: plantilla.tareaAsociadaId,
                    nombreCategoria: plantilla.nombreCategoria,
                    nombreTarea: nombreTarea,
                    empiezaEn: plantilla.empiezaEn,
                    terminaEn: plantilla.terminaEn,
                    diasAvisoDesdeInicio: plantilla.diasAvisoDesdeInicio,
                    diasAvisoDesdeFin: plantilla.diasAvisoDesdeFin,
                    diasAvisoAFin: plantilla.diasAvisoAFin,
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
            tareaAsociadaId: null,
            nombreCategoria: categoria.nombre,
            nombreTarea: '',
            empiezaEn: null,
            terminaEn: null,
            diasAvisoDesdeInicio: null,
            diasAvisoDesdeFin: null,
            diasAvisoAFin: null,
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

    };

    const validarDiasTarea = (tarea) => {
        if (tarea.empiezaEn && tarea.terminaEn) {
            if (tarea.terminaEn < tarea.empiezaEn) {
                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'ERROR' }),
                    detail: intl.formatMessage({ id: 'El día de fin no puede ser menor que el día de inicio' }),
                    life: 3000,
                });
            }
        }
    };

    const validarAvisosTarea = (tarea) => {
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
                const tareaActualizada = {
                    ...nuevasTareas[tareaIndex],
                    [campo]: valor
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
            for (const categoria of categorias) {
                for (const tarea of categoria.tareas) {
                    if (!tarea.nombreTarea || tarea.nombreTarea.trim() === '') {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'ERROR' }),
                            detail: intl.formatMessage({ id: 'La categoría "' }) + categoria.nombre + intl.formatMessage({ id: '" tiene tareas sin nombre. Por favor, complete todos los campos requeridos.' }),
                            life: 5000,
                        });
                        setEstadoGuardando(false);
                        return false;
                    }
                }
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

                    if (tarea.empiezaEn && tarea.terminaEn && tarea.terminaEn < tarea.empiezaEn) {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'ERROR' }),
                            detail: intl.formatMessage({ id: 'La tarea "' }) + tarea.nombreTarea + intl.formatMessage({ id: '" en la categoría "' }) + categoria.nombre + intl.formatMessage({ id: '" tiene un día de fin menor al día de inicio.' }),
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
                    // Primero eliminar responsables asociados
                    const filtroResponsables = JSON.stringify({
                        where: {
                            and: {
                                planificadorPlantillaId: tareaId,
                            },
                        },
                    });
                    const responsablesExistentes = await getPlanificadorPlantillaResponsables(filtroResponsables);

                    for (const responsable of responsablesExistentes) {
                        await deletePlanificadorPlantillaResponsable(responsable.id);
                    }

                    // Luego eliminar emails asociados
                    const filtroEmails = JSON.stringify({
                        where: {
                            and: {
                                planificadorPlantillaId: tareaId,
                            },
                        },
                    });
                    const emailsExistentes = await getPlanificadorPlantillaEmails(filtroEmails);

                    for (const email of emailsExistentes) {
                        await deletePlanificadorPlantillaEmail(email.id);
                    }

                    // Finalmente eliminar la plantilla
                    await deletePlanificadorPlantilla(tareaId);
                } catch (error) {
                    console.error(`Error al eliminar tarea ${tareaId}:`, error);
                    throw error; // Relanzar el error para que se maneje en el catch principal
                }
            }

            // Limpiar la lista de tareas a eliminar
            setTareasAEliminar([]);
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
                    await patchPlanificadorPlantilla(categoria.placeholderId, categoriaPatch);
                } else {
                    const categoriaPost = {
                        empresaId: empresaId,
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
                    await postPlanificadorPlantilla(categoriaPost);
                }
            }

            for (const categoria of categorias) {
                // Si tiene tareas, procesarlas normalmente
                for (const tarea of categoria.tareas) {
                    let tareaId = tarea.id;

                    if (!tarea.id) {
                        // POST - Nueva tarea sin ID, guardar primero sin tareaAsociadaId
                        const tareaDataPost = {
                            empresaId: empresaId,
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
                        const resultado = await postPlanificadorPlantilla(tareaDataPost);
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

                    const tareaDataPatch = {
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
                    await patchPlanificadorPlantilla(tareaId, tareaDataPatch);

                    // Gestionar responsables (relación con tabla planificador_plantilla_responsable)
                    if (tareaId) {
                        const filtroResponsables = JSON.stringify({
                            where: {
                                and: {
                                    planificadorPlantillaId: tareaId,
                                },
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

                        // Gestionar emails (relación con tabla planificador_plantilla_email) - usar formato 'and'
                        const filtroEmails = JSON.stringify({
                            where: {
                                and: {
                                    planificadorPlantillaId: tareaId,
                                },
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
        <>
            <Button
                label={intl.formatMessage({ id: 'NO' })}
                icon="pi pi-times"
                text
                onClick={() => setMostrarConfirmacionEliminarCategoria(false)}
            />
            <Button
                label={intl.formatMessage({ id: 'SÍ' })}
                icon="pi pi-check"
                text
                onClick={eliminarCategoria}
            />
        </>
    );

    const footerConfirmacionEliminarTarea = (
        <>
            <Button
                label={intl.formatMessage({ id: 'NO' })}
                icon="pi pi-times"
                text
                onClick={() => setMostrarConfirmacionEliminarTarea(false)}
            />
            <Button
                label={intl.formatMessage({ id: 'SÍ' })}
                icon="pi pi-check"
                text
                onClick={eliminarTarea}
            />
        </>
    );

    if (cargando) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Cargando plantillas...' })}</div>;
    }

    return (
        <Fieldset legend={intl.formatMessage({ id: 'Plantillas' })}>
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
                        <div key={categoria.uid} className="mb-3">
                            <Fieldset className="mt-3">
                                <div className="flex flex-column">
                                    <div className="flex align-items-center gap-3 mt-2 mb-3" style={{ width: '50%' }}>
                                        {/* Input editable para el nombre de la categoría */}
                                        <InputText
                                            value={categoria.nombre}
                                            onChange={(e) => {
                                                setCategorias(prev =>
                                                    prev.map((cat, i) =>
                                                        i === categoriaIndex
                                                            ? { ...cat, nombre: e.target.value }
                                                            : cat
                                                    )
                                                );
                                            }}
                                            placeholder={intl.formatMessage({ id: 'Nombre de la categoría' })}
                                            className="col-8 col-sm-12"
                                            maxLength={100}
                                            disabled={!editable}
                                        />
                                        {editable && (
                                            <Button
                                                label={intl.formatMessage({ id: 'Nueva tarea' })}
                                                onClick={() => agregarTarea(categoria.uid)}
                                                disabled={!editable || !categoria.nombre || categoria.nombre.trim() === ''}
                                            />
                                        )}
                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-danger p-button-outlined"
                                            onClick={() => confirmarEliminarCategoria(categoria.uid)}
                                            tooltip={intl.formatMessage({ id: 'Eliminar categoría' })}
                                            tooltipOptions={{ position: 'top' }}
                                            disabled={!editable}
                                        />
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

                                                return (
                                                    <Fieldset key={tareaKey} className="mt-5 mb-3" style={{ position: 'relative' }}>

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
                                                                        className={`w-full ${estadoGuardando && (!tarea.nombreTarea || tarea.nombreTarea.trim() === '') ? 'p-invalid' : ''}`}
                                                                        placeholder={intl.formatMessage({ id: 'Nombre' })}
                                                                        disabled={!editable}
                                                                    />
                                                                </div>
                                                                {estadoGuardando && (!tarea.nombreTarea || tarea.nombreTarea.trim() === '') && (
                                                                    <small className="p-error">{intl.formatMessage({ id: 'Campo requerido' })}</small>
                                                                )}
                                                            </div>

                                                            <div className="field col-12 md:col-2">
                                                                <label>{intl.formatMessage({ id: 'Estado' })}</label>
                                                                <Dropdown
                                                                    value={tarea.estado || null}
                                                                    options={estadosMaestra}
                                                                    onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'estado', e.value || null)}
                                                                    placeholder={intl.formatMessage({ id: 'Selecciona' })}
                                                                    className="w-full"
                                                                    showClear
                                                                    emptyMessage={intl.formatMessage({ id: 'No hay estados disponibles' })}
                                                                />
                                                            </div>

                                                            <div className="field col-12 md:col-3">
                                                                <label>{intl.formatMessage({ id: 'Responsables' })}</label>
                                                                <MultiSelect
                                                                    value={Array.isArray(tarea.emailResponsables) ? tarea.emailResponsables : []}
                                                                    options={usuariosDisponibles}
                                                                    onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'emailResponsables', e.value || [])}
                                                                    placeholder={cargandoUsuarios ? intl.formatMessage({ id: 'Cargando...' }) : intl.formatMessage({ id: 'Seleccionar' })}
                                                                    className="w-full"
                                                                    display="chip"
                                                                    maxSelectedLabels={2}
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
                                                                    filter
                                                                    disabled={!editable || cargandoUsuarios}
                                                                    emptyMessage={intl.formatMessage({ id: 'No hay usuarios' })}
                                                                    emptyFilterMessage={intl.formatMessage({ id: 'Sin resultados' })}
                                                                />
                                                            </div>

                                                            <div className="field col-12 md:col-1 flex align-items-end justify-content-end pr-2">
                                                                <Button
                                                                    icon="pi pi-trash"
                                                                    className="p-button-danger p-button-outlined"
                                                                    onClick={() => confirmarEliminarTarea(categoria.uid, tarea.uid || tarea.id)}
                                                                    tooltip={intl.formatMessage({ id: 'Eliminar tarea' })}
                                                                    tooltipOptions={{ position: 'top' }}
                                                                />
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
                                                                        disabled={tareasDeCategoria.length === 0}
                                                                        emptyMessage={intl.formatMessage({ id: 'No hay tareas' })}
                                                                    />
                                                                </div>

                                                                <>
                                                                        <div className="field col-6 md:col-2">
                                                                            <label>{intl.formatMessage({ id: 'Empieza en (días)' })}</label>
                                                                            <InputNumber
                                                                                value={tarea.empiezaEn}
                                                                                onValueChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'empiezaEn', e.value)}
                                                                                className={`w-full ${estadoGuardando && (
                                                                                    (tarea.empiezaEn !== null && tarea.empiezaEn < 1) ||
                                                                                    (tarea.terminaEn && tarea.empiezaEn && tarea.terminaEn < tarea.empiezaEn)
                                                                                ) ? 'p-invalid' : ''
                                                                                    }`}
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
                                                                                className={`w-full ${estadoGuardando && (
                                                                                    (tarea.terminaEn !== null && tarea.terminaEn < 1) ||
                                                                                    (tarea.terminaEn && tarea.empiezaEn && tarea.terminaEn < tarea.empiezaEn)
                                                                                ) ? 'p-invalid' : ''
                                                                                    }`}
                                                                                inputClassName="text-right"
                                                                                placeholder="0"
                                                                                min={1}
                                                                                disabled={!editable}
                                                                            />
                                                                            {estadoGuardando && tarea.terminaEn && tarea.empiezaEn && tarea.terminaEn < tarea.empiezaEn && (
                                                                                <small className="p-error">{intl.formatMessage({ id: 'Debe ser >= día inicio' })}</small>
                                                                            )}
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

                                                                <div className="field col-12">
                                                                    <label>{intl.formatMessage({ id: 'Comentarios' })}</label>
                                                                    <InputTextarea
                                                                        value={tarea.comentarios || ''}
                                                                        onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'comentarios', e.target.value)}
                                                                        rows={2}
                                                                        autoResize
                                                                        className="w-full"
                                                                    />
                                                                </div>
                                                                <div className="field col-12 flex justify-content-start">
                                                                    <div className="flex flex-column align-items-start text-left">
                                                                        <label className="mb-2">{intl.formatMessage({ id: 'Activo' })}</label>
                                                                        <InputSwitch
                                                                            checked={tarea.activoSn === "S"}
                                                                            onChange={(e) => actualizarTarea(categoria.uid, tareaIndex, 'activoSn', e.value ? 'S' : 'N')}
                                                                        />
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        )}
                                                    </Fieldset>
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
                style={{ width: '450px' }}
                header={intl.formatMessage({ id: '¿Eliminar registro?' })}
                modal
                footer={footerConfirmacionEliminarCategoria}
                onHide={() => setMostrarConfirmacionEliminarCategoria(false)}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        {intl.formatMessage({ id: '¿Está seguro de que desea eliminar esta categoría y todas sus tareas?' })}
                    </span>
                </div>
            </Dialog>

            {/* Dialog confirmar eliminar tarea */}
            <Dialog
                visible={mostrarConfirmacionEliminarTarea}
                style={{ width: '450px' }}
                header={intl.formatMessage({ id: '¿Eliminar registro?' })}
                modal
                footer={footerConfirmacionEliminarTarea}
                onHide={() => setMostrarConfirmacionEliminarTarea(false)}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        {intl.formatMessage({ id: '¿Está seguro de que desea eliminar esta tarea?' })}
                    </span>
                </div>
            </Dialog>
        </Fieldset>
    );
});


TareasPlantilla.displayName = 'TareasPlantilla';

export default TareasPlantilla;

