"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useIntl } from "react-intl";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { getUsuarioSesion } from "@/app/utility/Utils";
import {
    deleteProductoGrupoCampoDinamico,
    getProductosGrupoCampoDinamico,
    postProductoGrupoCampoDinamico,
} from "@/app/api-endpoints/producto_grupo_campo_dinamico";
import { getCamposDinamicosPorGruposProductoAgrupado } from "@/app/api-endpoints/producto_campos_dinamicos_grupos";
import {
    postProductoCampoDinamico,
    patchProductoCampoDinamico,
} from "@/app/api-endpoints/producto_campo_dinamico";
import { patchGrupoCampoDinamico } from "@/app/api-endpoints/grupo_campo_dinamico";
import { patchCampoDinamico } from "@/app/api-endpoints/campo_dinamico";

const ProductoCamposDinamicos = ({
    idProducto,
    idsGruposSeleccionadosExternos = [],
    registrarGuardadoGrupos = true,
    mostrarCampos = true,
    onGuardarGruposListo = () => { },
    onGuardarCamposListo = () => { },
    estoyEditandoProducto = false,
    mostrarBotonGuardar = true,
}) => {
    const intl = useIntl();
    const toast = useRef(null);

    const [gruposCamposDinamicosDefinidos, setGruposCamposDinamicosDefinidos] = useState([]);
    const [valoresCamposDinamicos, setValoresCamposDinamicos] = useState({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [erroresValidacion, setErroresValidacion] = useState(new Set());

    // Lee y normaliza la configuración de opciones de un campo dinámico.
    const leerOpcionesCampo = (opcionesCrudas) => {
        try {
            const opciones =
                typeof opcionesCrudas === "string"
                    ? JSON.parse(opcionesCrudas || "{}")
                    : opcionesCrudas || {};

            return {
                multiselectSn: opciones?.multiselectSn || "N",
                valores: Array.isArray(opciones?.valores) ? opciones.valores : [],
                tipoExtendido: opciones?.tipoExtendido || null,
            };
        } catch (_error) {
            return {
                multiselectSn: "N",
                valores: [],
                tipoExtendido: null,
            };
        }
    };

    // Convierte el valor guardado en base de datos al formato que necesita cada input.
    const convertirValorBdAInput = (campoDinamico, valorBd) => {
        const tipoCampo = `${campoDinamico?.tipoCampo || "texto"}`.trim().toLowerCase();
        const esMulti =
            tipoCampo === "multiselect" ||
            campoDinamico?.opcionesConfiguradas?.multiselectSn === "S";

        if (tipoCampo === "booleano" || tipoCampo === "switch") {
            if (
                valorBd === true ||
                valorBd === 1 ||
                valorBd === "1" ||
                `${valorBd || ""}`.trim().toUpperCase() === "S" ||
                `${valorBd || ""}`.trim().toLowerCase() === "true"
            ) {
                return true;
            }

            return false;
        }

        if (tipoCampo === "numero") {
            if (valorBd === undefined || valorBd === null || valorBd === "") {
                return null;
            }

            const valorNumerico = Number(valorBd);
            return Number.isNaN(valorNumerico) ? null : valorNumerico;
        }

        if (tipoCampo === "fecha") {
            if (!valorBd) {
                return null;
            }

            const fecha = new Date(valorBd);
            return Number.isNaN(fecha.getTime()) ? null : fecha;
        }

        if (esMulti) {
            if (!valorBd) {
                return [];
            }

            return `${valorBd}`
                .split(",")
                .map((valor) => valor.trim())
                .filter(Boolean);
        }

        return valorBd ?? "";
    };

    // Convierte el valor del formulario al formato que se guarda en base de datos.
    const convertirValorInputABaseDatos = (campoDinamico, valorInput) => {
        const tipoCampo = `${campoDinamico?.tipoCampo || "texto"}`.trim().toLowerCase();
        const esMulti =
            tipoCampo === "multiselect" ||
            campoDinamico?.opcionesConfiguradas?.multiselectSn === "S";

        if (tipoCampo === "booleano" || tipoCampo === "switch") {
            return valorInput ? "S" : "N";
        }

        if (tipoCampo === "numero") {
            if (valorInput === undefined || valorInput === null || valorInput === "") {
                return null;
            }

            return `${valorInput}`;
        }

        if (tipoCampo === "fecha") {
            if (!valorInput) {
                return null;
            }

            if (valorInput instanceof Date) {
                return valorInput.toISOString().split("T")[0];
            }

            return `${valorInput}`;
        }

        if (esMulti) {
            if (!Array.isArray(valorInput) || valorInput.length === 0) {
                return null;
            }

            return valorInput.join(", ");
        }

        if (valorInput === undefined || valorInput === null) {
            return null;
        }

        const texto = `${valorInput}`.trim();
        return texto === "" ? null : texto;
    };

    // Guarda en base de datos los grupos seleccionados para el producto actual.
    const guardarGruposCampoDinamico = async (idProductoGuardar, usuarioActual, idsSeleccionadosForzados = null) => {
        if (!idProductoGuardar) {
            return true;
        }

        const idsSeleccionados = Array.from(
            new Set(
                (idsSeleccionadosForzados ?? idsGruposSeleccionadosExternos ?? [])
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            )
        );

        const relacionesActuales = await getProductosGrupoCampoDinamico(
            JSON.stringify({
                where: { and: { productoId: idProductoGuardar } },
                order: ["id ASC"],
            })
        );

        const mapaRelacionPorGrupo = {};
        (relacionesActuales || []).forEach((registro) => {
            const idGrupo = registro?.grupoCampoDinamicoId ?? registro?.grupo_campo_dinamico_id;
            if (idGrupo && !mapaRelacionPorGrupo[idGrupo]) {
                mapaRelacionPorGrupo[idGrupo] = registro;
            }
        });

        for (const idGrupo of idsSeleccionados) {
            const relacionExistente = mapaRelacionPorGrupo[idGrupo];
            if (!relacionExistente?.id) {
                try {
                    await postProductoGrupoCampoDinamico({
                        productoId: idProductoGuardar,
                        grupoCampoDinamicoId: idGrupo,
                        usuarioCreacion: usuarioActual,
                    });
                } catch (error) {
                    const codigoError = error?.response?.data?.error?.code || error?.code;
                    const mensajeError = error?.response?.data?.error?.message || error?.message || "";
                    const esDuplicado =
                        codigoError === "ER_DUP_ENTRY" ||
                        `${mensajeError}`.includes("Duplicate entry");

                    if (!esDuplicado) {
                        throw error;
                    }
                }
            }
        }

        for (const registro of relacionesActuales || []) {
            const idGrupo = registro?.grupoCampoDinamicoId ?? registro?.grupo_campo_dinamico_id;
            if (!idGrupo || idsSeleccionados.includes(Number(idGrupo))) {
                continue;
            }

            await deleteProductoGrupoCampoDinamico(registro.id);
        }

        return true;
    };

    // Registra en el padre la función que guarda grupos dinámicos.
    useEffect(() => {
        if (!registrarGuardadoGrupos) {
            return undefined;
        }

        onGuardarGruposListo(() => guardarGruposCampoDinamico);
        return () => onGuardarGruposListo(null);
    }, [idsGruposSeleccionadosExternos, onGuardarGruposListo, registrarGuardadoGrupos]);

    // Carga los grupos, campos y valores dinámicos del producto.
    useEffect(() => {
        const cargarDatos = async () => {
            if (!mostrarCampos) {
                setCargando(false);
                return;
            }

            if (!idProducto) {
                setGruposCamposDinamicosDefinidos([]);
                setValoresCamposDinamicos({});
                setCargando(false);
                return;
            }

            const idsGruposFiltrar = Array.from(
                new Set(
                    (idsGruposSeleccionadosExternos || [])
                        .map((id) => Number(id))
                        .filter((id) => Number.isFinite(id) && id > 0)
                )
            );
            if (!idsGruposFiltrar.length) {
                setGruposCamposDinamicosDefinidos([]);
                setValoresCamposDinamicos({});
                setCargando(false);
                return;
            }

            setCargando(true);

            try {
                const respuesta = await getCamposDinamicosPorGruposProductoAgrupado(
                    Number(idProducto),
                    idsGruposFiltrar
                );

                const gruposRecibidos = Array.isArray(respuesta?.grupos) ? respuesta.grupos : [];
                const valoresMap = {};

                const gruposFormateados = gruposRecibidos.map((grupo) => ({
                    id: Number(grupo?.id || 0),
                    nombre: grupo?.nombre || `${grupo?.id || ""}`,
                    descripcion: grupo?.descripcion || "",
                    orden: Number(grupo?.ordenGrupo ?? 0),
                    campos: (grupo?.campos || []).map((campo) => {
                        const opcionesConfiguradas = leerOpcionesCampo(campo?.opciones);
                        const campoFormateado = {
                            id: Number(campo?.id || 0),
                            nombre: campo?.nombre || "",
                            etiqueta: campo?.etiqueta || campo?.nombre || "",
                            descripcion: campo?.descripcion || "",
                            tipoCampo: `${opcionesConfiguradas?.tipoExtendido || campo?.tipoCampo || "texto"}`.trim().toLowerCase(),
                            opciones: campo?.opciones || null,
                            opcionesConfiguradas,
                            obligatorioSn: campo?.obligatorioSn || "N",
                            orden: Number(campo?.ordenCampo ?? 0),
                            bloqueado: !!campo?.bloqueado,
                            activoSn: campo?.activoCampoSn ?? null,
                        };

                        if (campoFormateado.id > 0 && !valoresMap[campoFormateado.id]) {
                            valoresMap[campoFormateado.id] = {
                                id: campo?.valorId ?? null,
                                valor: convertirValorBdAInput(campoFormateado, campo?.valor),
                            };
                        }

                        return campoFormateado;
                    }).filter((campo) => campo.id > 0 && campo.activoSn !== "N"),
                }));

                setGruposCamposDinamicosDefinidos(gruposFormateados);
                setValoresCamposDinamicos(valoresMap);
            } catch (error) {
                console.error("Error cargando datos:", error);
                toast.current?.show({
                    severity: "error",
                    summary: "Error",
                    detail: intl.formatMessage({ id: "Error al cargar los datos" }),
                    life: 3000,
                });
                setGruposCamposDinamicosDefinidos([]);
                setValoresCamposDinamicos({});
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [idProducto, idsGruposSeleccionadosExternos, intl, mostrarCampos]);

    // Actualiza en memoria el valor de un campo dinámico.
    const actualizarValorCampoDinamico = (campoDinamicoId, campo, valor) => {
        setValoresCamposDinamicos((prev) => ({
            ...prev,
            [campoDinamicoId]: {
                ...prev[campoDinamicoId],
                [campo]: valor,
            },
        }));

        if (campo === "valor" && erroresValidacion.has(campoDinamicoId)) {
            setErroresValidacion((prev) => {
                const nuevo = new Set(prev);
                nuevo.delete(campoDinamicoId);
                return nuevo;
            });
        }
    };

    // Actualiza en memoria el orden de un grupo de campos dinámicos.
    const actualizarOrdenGrupo = (grupoId, valor) => {
        setGruposCamposDinamicosDefinidos((prev) =>
            (prev || []).map((grupo) =>
                grupo.id === grupoId
                    ? { ...grupo, orden: Number(valor || 0) }
                    : grupo
            )
        );
    };

    // Actualiza en memoria el orden de un campo dinámico.
    const actualizarOrdenCampo = (campoDinamicoId, valor) => {
        setGruposCamposDinamicosDefinidos((prev) =>
            (prev || []).map((grupo) => ({
                ...grupo,
                campos: (grupo.campos || []).map((campo) =>
                    campo.id === campoDinamicoId
                        ? { ...campo, orden: Number(valor || 0) }
                        : campo
                ),
            }))
        );
    };

    // Renderiza el input adecuado según el tipo del campo dinámico.
    const renderizarCampoDinamico = (campoDinamico) => {
        const valorActual = valoresCamposDinamicos[campoDinamico.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando || campoDinamico.bloqueado;
        const opciones = (campoDinamico.opcionesConfiguradas?.valores || []).map((valor) => ({
            label: valor,
            value: valor,
        }));

        switch (campoDinamico.tipoCampo) {
            case "texto":
                return (
                    <InputText
                        value={valorActual.valor || ""}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.target.value)}
                        placeholder={intl.formatMessage({ id: "Ingrese el valor" })}
                        disabled={deshabilitado}
                        className="w-full"
                    />
                );

            case "texto largo":
            case "textolargo":
            case "textarea":
                return (
                    <InputTextarea
                        value={valorActual.valor || ""}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.target.value)}
                        placeholder={intl.formatMessage({ id: "Ingrese el valor" })}
                        disabled={deshabilitado}
                        rows={4}
                        className="w-full"
                        style={{ resize: "vertical" }}
                    />
                );

            case "numero":
                return (
                    <InputNumber
                        value={valorActual.valor ?? null}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.value ?? null)}
                        placeholder={intl.formatMessage({ id: "Ingrese el número" })}
                        disabled={deshabilitado}
                        inputStyle={{ textAlign: "right" }}
                        className="w-full"
                    />
                );

            case "fecha":
                return (
                    <Calendar
                        value={valorActual.valor || null}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.value || null)}
                        disabled={deshabilitado}
                        placeholder={intl.formatMessage({ id: "Seleccione la fecha" })}
                        dateFormat="dd/mm/yy"
                        className="w-full"
                    />
                );

            case "booleano":
            case "switch":
                return (
                    <InputSwitch
                        checked={!!valorActual.valor}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", !!e.value)}
                        disabled={deshabilitado}
                    />
                );

            case "lista":
            case "select":
                if (campoDinamico.opcionesConfiguradas?.multiselectSn === "S") {
                    return (
                        <MultiSelect
                            value={Array.isArray(valorActual.valor) ? valorActual.valor : []}
                            options={opciones}
                            onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.value || [])}
                            placeholder={intl.formatMessage({ id: "Seleccione opciones" })}
                            disabled={deshabilitado}
                            className="w-full"
                            display="chip"
                        />
                    );
                }

                return (
                    <Dropdown
                        value={valorActual.valor || ""}
                        options={opciones}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.value || "")}
                        placeholder={intl.formatMessage({ id: "Seleccione una opción" })}
                        disabled={deshabilitado}
                        className="w-full"
                        emptyMessage={intl.formatMessage({ id: "No hay opciones disponibles" })}
                        showClear
                    />
                );

            case "multiselect":
                return (
                    <MultiSelect
                        value={Array.isArray(valorActual.valor) ? valorActual.valor : []}
                        options={opciones}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.value || [])}
                        placeholder={intl.formatMessage({ id: "Seleccione opciones" })}
                        disabled={deshabilitado}
                        className="w-full"
                        display="chip"
                    />
                );

            default:
                return (
                    <InputTextarea
                        value={valorActual.valor || ""}
                        onChange={(e) => actualizarValorCampoDinamico(campoDinamico.id, "valor", e.target.value)}
                        placeholder={intl.formatMessage({ id: "Ingrese el valor" })}
                        disabled={deshabilitado}
                        rows={3}
                        className="w-full"
                    />
                );
        }
    };

    // Valida que todos los campos obligatorios tengan valor.
    const validarObligatorios = () => {
        const errores = new Set();
        const camposFaltantes = [];
        const camposYaValidados = new Set();

        gruposCamposDinamicosDefinidos.forEach((grupo) => {
            (grupo.campos || []).forEach((campo) => {
                if (!campo?.id || camposYaValidados.has(campo.id)) {
                    return;
                }

                camposYaValidados.add(campo.id);

                if (campo.obligatorioSn === "S") {
                    const valor = valoresCamposDinamicos[campo.id]?.valor;
                    const vacio = Array.isArray(valor)
                        ? valor.length === 0
                        : valor === undefined || valor === null || `${valor}`.trim() === "";

                    if (vacio) {
                        errores.add(campo.id);
                        camposFaltantes.push({
                            grupo: grupo?.nombre || intl.formatMessage({ id: "Sin grupo" }),
                            campo: campo.etiqueta || campo.nombre,
                        });
                    }
                }
            });
        });

        setErroresValidacion(errores);

        if (camposFaltantes.length > 0) {
            const porGrupo = {};
            camposFaltantes.forEach(({ grupo, campo }) => {
                if (!porGrupo[grupo]) porGrupo[grupo] = [];
                porGrupo[grupo].push(campo);
            });

            const detalle = (
                <div>
                    {Object.entries(porGrupo).map(([grupo, campos]) => (
                        <div key={grupo} className="mb-2">
                            <b>{grupo}:</b>
                            <ul className="m-0 pl-3 mt-1">
                                {campos.map((campo) => <li key={campo}>{campo}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            );

            toast.current?.show({
                severity: "warn",
                summary: intl.formatMessage({ id: "Campos obligatorios vacíos" }),
                detail,
                life: 6000,
                sticky: false,
            });
            return false;
        }

        return true;
    };

    // Guarda órdenes y valores de los campos dinámicos del producto.
    const guardarCamposDinamicos = async ({ mostrarToastExito = false } = {}) => {
        if (!idProducto) {
            return true;
        }

        if (!validarObligatorios()) {
            return false;
        }

        setGuardando(true);
        const usuario = getUsuarioSesion();

        try {
            const idsCamposYaGuardados = new Set();
            const nuevosIdsPorCampo = {};
            const idsGruposYaActualizados = new Set();

            for (const grupo of gruposCamposDinamicosDefinidos || []) {
                if (grupo?.id && !idsGruposYaActualizados.has(grupo.id)) {
                    idsGruposYaActualizados.add(grupo.id);
                    await patchGrupoCampoDinamico(grupo.id, {
                        orden: Number(grupo.orden || 0),
                        usuarioModificacion: usuario?.id,
                    });
                }
            }

            for (const grupo of gruposCamposDinamicosDefinidos || []) {
                for (const campo of grupo.campos || []) {
                    if (!campo?.id || idsCamposYaGuardados.has(campo.id)) {
                        continue;
                    }

                    idsCamposYaGuardados.add(campo.id);

                    const valorActual = valoresCamposDinamicos[campo.id] || {};
                    const valorBaseDatos = convertirValorInputABaseDatos(campo, valorActual.valor);
                    const datosCampo = {
                        productoId: idProducto,
                        campoDinamicoId: campo.id,
                        valor: valorBaseDatos,
                        usuarioCreacion: usuario?.id,
                        usuarioModificacion: usuario?.id,
                    };

                    await patchCampoDinamico(campo.id, {
                        orden: Number(campo.orden || 0),
                        usuarioModificacion: usuario?.id,
                    });

                    if (valorActual.id) {
                        await patchProductoCampoDinamico(valorActual.id, datosCampo);
                    } else if (valorBaseDatos !== null) {
                        const nuevoRegistro = await postProductoCampoDinamico(datosCampo);
                        if (nuevoRegistro?.id) {
                            nuevosIdsPorCampo[campo.id] = nuevoRegistro.id;
                        }
                    }
                }
            }

            if (Object.keys(nuevosIdsPorCampo).length > 0) {
                setValoresCamposDinamicos((prev) => {
                    const nuevoMapa = { ...prev };
                    Object.entries(nuevosIdsPorCampo).forEach(([campoId, valorId]) => {
                        nuevoMapa[Number(campoId)] = {
                            ...(nuevoMapa[Number(campoId)] || {}),
                            id: valorId,
                        };
                    });
                    return nuevoMapa;
                });
            }

            if (mostrarToastExito) {
                toast.current?.show({
                    severity: "success",
                    summary: intl.formatMessage({ id: "Éxito" }),
                    detail: intl.formatMessage({ id: "Campos dinámicos guardados correctamente" }),
                    life: 3000,
                });
            }

            return true;
        } catch (error) {
            console.error("Error guardando campos dinámicos:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: intl.formatMessage({ id: "Error al guardar los campos dinámicos" }),
                life: 3000,
            });
            return false;
        } finally {
            setGuardando(false);
        }
    };

    // Ejecuta el guardado completo de grupos seleccionados y valores.
    const guardarTodoCamposDinamicos = async () => {
        if (!idProducto) {
            return;
        }

        setGuardando(true);

        try {
            const usuario = getUsuarioSesion();
            const gruposGuardados = await guardarGruposCampoDinamico(
                idProducto,
                usuario?.id,
                idsGruposSeleccionadosExternos
            );

            if (!gruposGuardados) {
                return;
            }

            await guardarCamposDinamicos({ mostrarToastExito: true });
        } finally {
            setGuardando(false);
        }
    };

    // Registra en el padre la función que guarda los campos dinámicos.
    useEffect(() => {
        onGuardarCamposListo(() => () => guardarCamposDinamicos({ mostrarToastExito: false }));
        return () => onGuardarCamposListo(null);
    }, [gruposCamposDinamicosDefinidos, idProducto, onGuardarCamposListo, valoresCamposDinamicos]);

    // Ordena los grupos y los campos para mostrarlos en pantalla.
    const gruposCamposDinamicosAgrupados = useMemo(() => {
        const gruposOrdenados = [...(gruposCamposDinamicosDefinidos || [])]
            .map((grupo) => ({
                ...grupo,
                campos: [...(grupo.campos || [])].sort((a, b) => {
                    const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
                    const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
                    if (ordenA !== ordenB) return ordenA - ordenB;
                    return (a.nombre || "").localeCompare(b.nombre || "");
                }),
            }));

        return { gruposOrdenados };
    }, [gruposCamposDinamicosDefinidos]);

    const renderCampoDinamicoCard = (campoDinamico) => {
        const valorActual = valoresCamposDinamicos[campoDinamico.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando || campoDinamico.bloqueado;

        return (
            <div key={campoDinamico.id} className="field col-12 md:col-6 lg:col-4">
                <div className={`p-3 border-1 border-round transition-colors transition-duration-200 ${erroresValidacion.has(campoDinamico.id) ? "border-red-500 bg-red-50" : "border-300 hover:border-primary"}`}>
                    <div className="flex align-items-center mb-2">
                        <div className="flex flex-column align-items-center mr-2">
                            <label className="text-xs font-semibold mb-1">{intl.formatMessage({ id: "Orden" })}</label>
                            <InputNumber
                                value={campoDinamico.orden || 0}
                                onValueChange={(e) => actualizarOrdenCampo(campoDinamico.id, e.value)}
                                disabled={!estoyEditandoProducto || guardando || campoDinamico.bloqueado}
                                min={0}
                                max={999}
                                inputStyle={{ textAlign: "right", width: "3.5rem" }}
                                placeholder="0"
                            />
                        </div>
                        <Divider layout="vertical" className="mx-2" />
                        <label className="block font-medium">
                            <b>{campoDinamico.etiqueta || campoDinamico.nombre}</b>
                            {campoDinamico.obligatorioSn === "S" && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    </div>
                    <div className="mb-2">
                        <div className="flex align-items-center gap-2">
                            <div className="flex-1">
                                {renderizarCampoDinamico(campoDinamico)}
                            </div>
                        </div>
                    </div>
                    {campoDinamico.descripcion && (
                        <small className="text-gray-600 block mt-1">
                            {campoDinamico.descripcion}
                        </small>
                    )}
                    {campoDinamico.bloqueado && (
                        <small className="block mt-1 font-bold">
                            {intl.formatMessage({ id: "Este campo se edita en otro grupo más arriba." })}
                        </small>
                    )}
                </div>
            </div>
        );
    };

    // Renderiza un grupo completo de campos dinámicos.
    const renderGrupoCamposDinamicos = (grupo, indice) => {
        const leyendaGrupo = (
            <div className="flex align-items-center">
                <div className="flex flex-column align-items-center mr-2">
                    <label htmlFor={`orden-grupo-${grupo.id}`} className="text-xs font-semibold mb-1">
                        {intl.formatMessage({ id: "Orden" })}
                    </label>
                    <InputNumber
                        inputId={`orden-grupo-${grupo.id}`}
                        value={grupo.orden || 0}
                        onValueChange={(e) => actualizarOrdenGrupo(grupo.id, e.value)}
                        disabled={!estoyEditandoProducto || guardando}
                        min={0}
                        max={999}
                        inputStyle={{ textAlign: "right", width: "3.5rem" }}
                        placeholder="0"
                    />
                </div>
                <Divider layout="vertical" className="mx-2" />
                <span className="font-medium">
                    <b>{`${grupo.nombre} (${grupo.campos.length})`}</b>
                </span>
            </div>
        );

        return (
            <Fieldset
                key={grupo.id}
                legend={leyendaGrupo}
                collapsed={indice !== 0}
                toggleable
                className="mb-3"
            >
                {grupo.descripcion && (
                    <small className="p-text-secondary block mb-3">{grupo.descripcion}</small>
                )}

                {grupo.campos.length > 0 ? (
                    <div className="formgrid grid">
                        {grupo.campos.map(renderCampoDinamicoCard)}
                    </div>
                ) : (
                    <div className="text-center p-4">
                        {intl.formatMessage({ id: "No hay campos dinámicos en este grupo" })}
                    </div>
                )}
            </Fieldset>
        );
    };

    if (!mostrarCampos) {
        return null;
    }

    if (cargando) {
        return (
            <div className="flex justify-content-center p-4">
                <ProgressSpinner style={{ width: "50px", height: "50px" }} />
            </div>
        );
    }

    if (!idProducto) {
        return <div className="text-center p-4">{intl.formatMessage({ id: "Seleccione un producto" })}</div>;
    }

    if (!gruposCamposDinamicosAgrupados.gruposOrdenados.length) {
        return (
            <Card title={intl.formatMessage({ id: "Campos dinámicos del Producto" })}>
                <div className="text-center p-4">
                    {intl.formatMessage({ id: "No hay grupos de campos dinámicos seleccionados" })}
                </div>
            </Card>
        );
    }

    return (
        <div>
            <Toast ref={toast} />
            <Card title={intl.formatMessage({ id: "Campos dinámicos del Producto" })}>
                {gruposCamposDinamicosAgrupados.gruposOrdenados.map(renderGrupoCamposDinamicos)}

                {(mostrarBotonGuardar && estoyEditandoProducto) && (
                    <div className="flex justify-content-end mt-4">
                        <Button
                            label={guardando
                                ? `${intl.formatMessage({ id: "Guardando" })}...`
                                : intl.formatMessage({ id: "Guardar Campos dinámicos" })}
                            icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-save"}
                            onClick={guardarTodoCamposDinamicos}
                            disabled={guardando}
                            className="p-button-primary"
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProductoCamposDinamicos;
