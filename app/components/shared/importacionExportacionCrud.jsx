"use client";

import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ProgressBar } from "primereact/progressbar";
import { descargarErroresImportacion, descargarPlantillaInsertarImportacion, descargarTodoImportacion, getForeignKeysImportacion, 
    getInicioImportacion, getProgresoImportacion, postImportarTabla,} from "@/app/api-endpoints/importacion";

const ImportacionExportacionCrud = ({ visible, onHide, controlador, headerCrud, tabla, toast }) => {
    const intl = useIntl();
    const inputArchivoRef = useRef(null);
    const intervaloProgresoRef = useRef(null);
    const [archivo, setArchivo] = useState(null);
    const [tipoImportacion, setTipoImportacion] = useState("insertar");
    const [importando, setImportando] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [respuestas, setRespuestas] = useState({});
    const [preguntas, setPreguntas] = useState([]);
    const [progreso, setProgreso] = useState(0);
    const [resultado, setResultado] = useState(null);
    const procesando = importando || descargando;
    const titulo = intl.formatMessage({ id: `Importar ${String(headerCrud || controlador || "registros").toLowerCase()}` });

    const TIPOS_IMPORTACION = [
        { label: "Insertar", value: "insertar"   },
        { label: "Actualizar", value: "actualizar" },
    ];

    /**
     * Convierte un nombre en camelCase a una etiqueta legible.
     * "rolId" → "Rol" | "usuarioCreacion" → "Usuario creacion"
     */
    const formatearEtiquetaCampo = (campo = "") => {
        const sinSufijo = String(campo).replace(/Id$/, "");
        const conEspacios = sinSufijo.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
        return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
    };

    /**
     * Extrae el mensaje de error más específico disponible de una respuesta HTTP
     * o de un Error nativo.
     */
    const extraerMensajeError = (error, fallback) => {
        if (typeof error === "string") return error;
        return (
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            error?.message ||
            error?.statusText ||
            fallback
        );
    };

    /**
     * Cuenta las filas de datos de un CSV (excluye la cabecera y las líneas vacías).
     */
    const contarFilasCsv = async (archivo) => {
        const contenido = await archivo.text();
        return contenido
            .replace(/^\uFEFF/, "")
            .replace(/\r\n?/g, "\n")
            .split("\n")
            .filter((linea) => linea.trim() !== "")
            .slice(1).length;
    };

    /**
     * Convierte las foreign-keys devueltas por el backend en preguntas dinámicas
     * listas para renderizar en el formulario.
     */
    const mapearForeignKeysAPreguntas = (foreignKeys, intl) =>
        (foreignKeys || []).map((fk) => ({
            id: fk.campo,
            type: "select",
            label: formatearEtiquetaCampo(fk.campo),
            placeholder: intl.formatMessage({ id: "Selecciona una opción" }),
            options: fk.options || [],
            required: true,
            validationMessage: intl.formatMessage({ id: "Complete los campos requeridos antes de importar" }),
        }));

    /**
     * Lanza una excepción si el resultado de la importación contiene alguna señal
     * de error proveniente del backend (statusCode >= 400, campos de error, etc.).
     */
    const lanzarSiResultadoErroneo = (resultado, mensajeFallback) => {
        if (!resultado) {
            throw new Error(mensajeFallback);
        }

        const mensajeError = resultado?.error?.message || resultado?.message;
        const tieneCodigoError = Number(resultado?.statusCode) >= 400;
        const tieneNombreError = resultado?.name === "BadRequestError" || resultado?.name === "HttpError";
        const estadosValidos = ["OK", "WARNING", "ERROR"];
        const estadoInvalido = resultado?.status && !estadosValidos.includes(resultado.status);
        const sinEstadoConError = !resultado?.status && mensajeError;

        if (tieneCodigoError || tieneNombreError || resultado?.error?.message || estadoInvalido || sinEstadoConError) {
            throw new Error(mensajeError || mensajeFallback);
        }
    };

    /**
     * Traduce el status devuelto por el backend al severity de PrimeReact Toast.
     */
    const resolverSeveridadToast = (status) => {
        if (status === "WARNING") return { severity: "warn", summary: "AVISO" };
        if (status === "ERROR") return { severity: "error", summary: "ERROR" };
        return { severity: "success", summary: "OK" };
    };


    // Carga los desplegables dinámicos cada vez que se abre el diálogo.
    useEffect(() => {
        if (!visible || !tabla) {
            setPreguntas([]);
            return;
        }

        getForeignKeysImportacion(tabla)
            .then((fks) => setPreguntas(mapearForeignKeysAPreguntas(fks, intl)))
            .catch(() => setPreguntas([]));
    }, [intl, tabla, visible]);

    // Reinicia el formulario cuando el diálogo se abre (no depende de `preguntas`
    // para evitar un doble reset al cargar los desplegables).
    useEffect(() => {
        if (!visible) return;

        setArchivo(null);
        setTipoImportacion("insertar");
        setResultado(null);
        setProgreso(0);
        setRespuestas({});
    }, [visible]);

    // Limpia el intervalo al desmontar.
    useEffect(() => () => limpiarIntervalo(), []);


    const limpiarIntervalo = () => {
        if (intervaloProgresoRef.current) {
            window.clearInterval(intervaloProgresoRef.current);
            intervaloProgresoRef.current = null;
        }
    };
    // consulta al backend cada 3 s cuántos registros lleva procesados
    // y actualiza la barra de progreso. Se detiene al 99 % para esperar la confirmación final.

    const iniciarSeguimientoProgreso = (fechaInicio, totalFilas, tipo) => {
        limpiarIntervalo();
        setProgreso(0);

        const consultar = async () => {
            try {
                const { procesados = 0 } = await getProgresoImportacion(tabla, fechaInicio, tipo);
                const porcentaje = totalFilas > 0 ? Math.floor((procesados / totalFilas) * 100) : 0;
                setProgreso(Math.min(99, Math.max(0, porcentaje)));
            } catch {
                // En caso de error, no actualizamos el progreso pero seguimos intentando consultar
            }
        };

        consultar();
        intervaloProgresoRef.current = window.setInterval(consultar, 3000);
    };

    // Comprueba que todos los desplegables obligatorios del formulario dinámico
    // tengan valor antes de lanzar la importación. En modo "actualizar" no aplica.
    const validarPreguntasObligatorias = () => {
        if (tipoImportacion === "actualizar") return true;

        for (const pregunta of preguntas) {
            if (!pregunta.required) continue;

            const valor = respuestas[pregunta.id];
            if (valor === null || valor === undefined || valor === "") {
                mostrarError(pregunta.validationMessage);
                return false;
            }
        }
        return true;
    };

    /* 
    /*Estas variables son para ayudar a mostrar el modal mejor visualmente
    */
    const mostrarError = (detalle) =>
        toast.current?.show({ severity: "error", summary: "ERROR", detail: detalle, life: 5000 });
    
    // Actualiza el valor de una respuesta del formulario dinámico por su id.
    const actualizarRespuesta = (id, valor) =>
        setRespuestas((prev) => ({ ...prev, [id]: valor }));

    const abrirSelectorArchivo = () => inputArchivoRef.current?.click();

    // Cierra el diálogo y limpia el estado. Bloqueado mientras hay una operación en curso.
    const cerrarDialogo = () => {
        if (procesando) return;
        onHide?.();
        setArchivo(null);
        setRespuestas({});
        setResultado(null);
        setProgreso(0);
    };

    // Limpia el archivo y el resultado para permitir importar otro fichero sin cerrar el modal.
    const prepararOtraImportacion = () => {
        if (procesando) return;
        setArchivo(null);
        setResultado(null);
        setProgreso(0);
    };

    // Devuelve el título del bloque de progreso según el estado actual de la operación.
    const obtenerTituloResultado = () => {
        if (!resultado) return intl.formatMessage({ id: "Procesando importación..." });
        return resultado.estado === "OK"
            ? intl.formatMessage({ id: "Proceso finalizado correctamente" })
            : intl.formatMessage({ id: "Proceso finalizado con errores" });
    };

    // Devuelve el texto explicativo bajo la barra de progreso una vez finalizada la operación.
    const obtenerDescripcionResultado = () => {
        if (!resultado) return intl.formatMessage({ id: "No cierres esta ventana hasta que termine el proceso." });
        return resultado.tieneErrores
            ? intl.formatMessage({ id: "Se ha descargado un fichero con el detalle de los errores para que puedas revisarlos." })
            : intl.formatMessage({ id: "Ya puedes cerrar esta ventana cuando quieras." });
    };

    // Ejecuta una acción de descarga bloqueando el diálogo hasta que termine.
    const ejecutarDescarga = async (accion) => {
        try {
            setDescargando(true);
            await accion();
            setProgreso(100);
        } catch (error) {
            mostrarError(extraerMensajeError(error, intl.formatMessage({ id: "Ha ocurrido un error al descargar" })));
        } finally {
            setDescargando(false);
        }
    };

    // Valida el formulario, lanza la importación al backend y gestiona el resultado:
    // actualiza la barra de progreso, descarga el CSV de errores si los hay y muestra el toast final.
    const importarArchivo = async () => {
        const mensajeFallback = intl.formatMessage({ id: "Ha ocurrido un error importando el archivo" });

        if (!archivo) {
            mostrarError(intl.formatMessage({ id: "Seleccione un archivo para importar" }));
            return;
        }
        if (!validarPreguntasObligatorias()) return;

        try {
            setImportando(true);
            setResultado(null);
            setProgreso(0);

            const respuestasAEnviar = tipoImportacion === "insertar" ? respuestas : {};
            const { fechaInicioImportacion } = await getInicioImportacion(tabla);
            const totalFilas = await contarFilasCsv(archivo);

            iniciarSeguimientoProgreso(fechaInicioImportacion, totalFilas, tipoImportacion);

            const respuestaBackend = await postImportarTabla(
                tabla,
                archivo,
                respuestasAEnviar,
                tipoImportacion,
                fechaInicioImportacion,
            );

            lanzarSiResultadoErroneo(respuestaBackend, mensajeFallback);

            setProgreso(100);
            setResultado({
                estado: respuestaBackend?.status || "OK",
                mensaje: respuestaBackend?.message || intl.formatMessage({ id: "Importación lanzada correctamente" }),
                tieneErrores: Boolean(respuestaBackend?.erroresCsv),
            });

            if (respuestaBackend?.erroresCsv) {
                descargarErroresImportacion(
                    respuestaBackend.erroresCsv,
                    respuestaBackend.nombreArchivoErrores || `${tabla}_errores.csv`,
                );
            }

            const { severity, summary } = resolverSeveridadToast(respuestaBackend?.status);
            toast.current?.show({ severity, summary, detail: respuestaBackend?.message, life: 5000 });

        } catch (error) {
            setResultado(null);
            mostrarError(extraerMensajeError(error, mensajeFallback));
        } finally {
            limpiarIntervalo();
            setImportando(false);
        }
    };



    const footerResultado = (
        <>
            <Button
                label={intl.formatMessage({ id: "Finalizar y cerrar" })}
                icon="pi pi-check"
                text
                onClick={cerrarDialogo}
            />
            <Button
                label={intl.formatMessage({ id: "Importar otro archivo" })}
                icon="pi pi-refresh"
                onClick={prepararOtraImportacion}
            />
        </>
    );

    const footerAccion = (
        <>
            <Button
                label={intl.formatMessage({ id: "Cancelar" })}
                icon="pi pi-times"
                text
                onClick={cerrarDialogo}
                disabled={procesando}
            />
            <Button
                label={importando
                    ? `${intl.formatMessage({ id: "Importando" })}...`
                    : intl.formatMessage({ id: "Importar" })}
                icon={importando ? "pi pi-spin pi-spinner" : "pi pi-upload"}
                onClick={importarArchivo}
                disabled={procesando}
            />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: "700px", maxWidth: "95vw" }}
            header={titulo}
            modal
            blockScroll
            closable={!procesando}
            closeOnEscape={!procesando}
            dismissableMask={!procesando}
            footer={resultado && !procesando ? footerResultado : footerAccion}
            onHide={cerrarDialogo}
        >
            <div className="flex flex-column gap-4">
                <span>{intl.formatMessage({ id: "Selecciona un fichero para importar" })}</span>

                <div className="flex flex-column gap-2">
                    <b>{intl.formatMessage({ id: "Tipo de proceso" })}</b>
                    <Dropdown
                        value={tipoImportacion}
                        options={TIPOS_IMPORTACION}
                        onChange={(e) => setTipoImportacion(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        disabled={procesando}
                        className="w-full"
                    />
                </div>

                <div className="grid">
                    <div className="col-12 md:col-6">
                        <Button
                            label={intl.formatMessage({ id: "Plantilla insertar" })}
                            icon="pi pi-download"
                            outlined
                            className="w-full"
                            onClick={() => ejecutarDescarga(() => descargarPlantillaInsertarImportacion(tabla))}
                            disabled={procesando}
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <Button
                            label={intl.formatMessage({ id: "Descargar todo" })}
                            icon="pi pi-table"
                            outlined
                            className="w-full"
                            onClick={() => ejecutarDescarga(() => descargarTodoImportacion(tabla))}
                            disabled={procesando}
                        />
                    </div>
                </div>

                {tipoImportacion === "insertar" && preguntas.length > 0 && (
                    <div className="flex flex-column gap-3">
                        {preguntas.map((pregunta) => (
                            <div key={pregunta.id} className="flex flex-column gap-2">
                                <label htmlFor={`pregunta-importacion-${pregunta.id}`}>
                                    <b>
                                        {pregunta.label}
                                        {pregunta.required && <span className="text-red-500"> *</span>}
                                    </b>
                                </label>

                                {pregunta.type === "select" ? (
                                    <Dropdown
                                        id={`pregunta-importacion-${pregunta.id}`}
                                        value={respuestas[pregunta.id] ?? null}
                                        options={pregunta.options}
                                        onChange={(e) => actualizarRespuesta(pregunta.id, e.value)}
                                        optionLabel={pregunta.optionLabel || "label"}
                                        optionValue={pregunta.optionValue || "value"}
                                        placeholder={pregunta.placeholder}
                                        disabled={procesando || pregunta.disabled}
                                        className="w-full"
                                    />
                                ) : (
                                    <InputText
                                        id={`pregunta-importacion-${pregunta.id}`}
                                        value={respuestas[pregunta.id] || ""}
                                        onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
                                        placeholder={pregunta.placeholder}
                                        disabled={procesando || pregunta.disabled}
                                    />
                                )}

                                {pregunta.helpText && <small>{pregunta.helpText}</small>}
                            </div>
                        ))}
                    </div>
                )}

                {(procesando || resultado) && (
                    <div className="flex flex-column align-items-center justify-content-center gap-3 py-3">
                        <ProgressBar value={progreso} style={{ width: "100%", height: "10px" }} />
                        <b>
                            {descargando
                                ? intl.formatMessage({ id: "Preparando descarga..." })
                                : obtenerTituloResultado()}
                        </b>
                        <small>
                            {descargando
                                ? intl.formatMessage({ id: "La descarga se está preparando. Espera un momento." })
                                : obtenerDescripcionResultado()}
                        </small>
                    </div>
                )}

                <div className="flex flex-column gap-2">
                    <b>{intl.formatMessage({ id: "Archivo a importar" })}</b>
                    <input
                        ref={inputArchivoRef}
                        id={`archivo-importacion-${controlador || "crud"}`}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-column md:flex-row gap-2">
                        <Button
                            label={archivo
                                ? intl.formatMessage({ id: "Cambiar archivo" })
                                : intl.formatMessage({ id: "Elegir archivo" })}
                            icon="pi pi-file-import"
                            outlined
                            onClick={abrirSelectorArchivo}
                            disabled={procesando}
                        />
                        {archivo && (
                            <Button
                                label={intl.formatMessage({ id: "Quitar archivo" })}
                                icon="pi pi-trash"
                                text
                                severity="secondary"
                                onClick={() => setArchivo(null)}
                                disabled={procesando}
                            />
                        )}
                    </div>
                    {archivo && <small>{archivo.name}</small>}
                </div>
            </div>
        </Dialog>
    );
};

export default ImportacionExportacionCrud;