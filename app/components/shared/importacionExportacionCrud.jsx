"use client";

import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import { descargarPlantillaImportacion, descargarTodoImportacion, getForeignKeysImportacion, postImportarTabla } from "@/app/api-endpoints/importacion";

// Convierte nombres como rolId o usuarioCreacion en etiquetas más legibles.
const formatearEtiquetaCampo = (campo = "") => {
    const sinIdFinal = String(campo).replace(/Id$/, "");
    const conEspacios = sinIdFinal.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
};

const ImportacionExportacionCrud = ({ visible, onHide, controlador, headerCrud, tabla, toast }) => {
    const intl = useIntl();
    const inputArchivoRef = useRef(null);
    const [archivoImportacion, setArchivoImportacion] = useState(null);
    const [estadoImportando, setEstadoImportando] = useState(false);
    const [estadoDescargando, setEstadoDescargando] = useState(false);
    const [respuestasImportacion, setRespuestasImportacion] = useState({});
    const [preguntasDinamicas, setPreguntasDinamicas] = useState([]);

    const nombreBase = headerCrud || controlador || 'registros';
    const titulo = intl.formatMessage({ id: `Importar ${String(nombreBase).toLowerCase()}` });
    const mensajeExito = intl.formatMessage({ id: 'Importación lanzada correctamente' });
    const estadoProcesando = estadoImportando || estadoDescargando;
    const accept = ".csv,.xlsx,.xls";

    useEffect(() => {
        const cargarPreguntasDinamicas = async () => {
            if (!visible || !tabla) {
                setPreguntasDinamicas([]);
                return;
            }

            // Pide al backend qué desplegables necesita esa tabla.
            const foreignKeys = await getForeignKeysImportacion(tabla);
            setPreguntasDinamicas(
                (foreignKeys || []).map((foreignKey) => ({
                    id: foreignKey.campo,
                    type: 'select',
                    label: formatearEtiquetaCampo(foreignKey.campo),
                    placeholder: intl.formatMessage({ id: 'Selecciona una opción' }),
                    options: foreignKey.options || [],
                    required: true,
                    validationMessage: intl.formatMessage({ id: 'Complete los campos requeridos antes de importar' }),
                }))
            );
        };

        cargarPreguntasDinamicas();
    }, [intl, tabla, visible]);

    useEffect(() => {
        if (!visible) {
            return;
        }

        // Reinicia el formulario cada vez que se abre el diálogo.
        setArchivoImportacion(null);
        const respuestasIniciales = {};
        preguntasDinamicas.forEach((pregunta) => {
            respuestasIniciales[pregunta.id] = pregunta.defaultValue ?? null;
        });
        setRespuestasImportacion(respuestasIniciales);
    }, [preguntasDinamicas, visible]);

    const cerrarDialogo = () => {
        if (!estadoProcesando) {
            onHide?.();
            setArchivoImportacion(null);
            setRespuestasImportacion({});
        }
    };

    const actualizarRespuesta = (preguntaId, valor) => {
        setRespuestasImportacion((prev) => ({
            ...prev,
            [preguntaId]: valor,
        }));
    };

    const validarPreguntas = () => {
        for (const pregunta of preguntasDinamicas) {
            if (!pregunta.required) {
                continue;
            }

            const valor = respuestasImportacion[pregunta.id];
            if (valor === null || valor === undefined || valor === '') {
                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail: pregunta.validationMessage || intl.formatMessage({ id: 'Complete los campos requeridos antes de importar' }),
                    life: 4000,
                });
                return false;
            }
        }

        return true;
    };

    // Saca el mensaje real del backend o uno genérico si no viene nada.
    const obtenerMensajeError = (error) => {
        return error?.response?.data?.error?.message
            || error?.response?.data?.message
            || error?.message
            || intl.formatMessage({ id: 'Ha ocurrido un error importando el archivo' });
    };

    // Traduce el status del backend al tipo de toast del front.
    const obtenerEstadoToastImportacion = (resultado) => {
        if (resultado?.status === 'WARNING') {
            return {
                severity: 'warn',
                summary: 'AVISO',
            };
        }

        if (resultado?.status === 'ERROR') {
            return {
                severity: 'error',
                summary: 'ERROR',
            };
        }

        return {
            severity: 'success',
            summary: 'OK',
        };
    };

    // Ejecuta una descarga y bloquea el diálogo hasta que termine.
    const ejecutarDescarga = async (accion) => {
        try {
            setEstadoDescargando(true);
            await accion();
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: obtenerMensajeError(error),
                life: 5000,
            });
        } finally {
            setEstadoDescargando(false);
        }
    };

    // Envía el archivo completo al backend junto con las respuestas del formulario.
    const importarArchivo = async () => {
        if (!archivoImportacion) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: 'Seleccione un archivo para importar' }),
                life: 3000,
            });
            return;
        }

        if (!validarPreguntas()) {
            return;
        }

        try {
            setEstadoImportando(true);
            const resultado = await postImportarTabla(tabla, archivoImportacion, respuestasImportacion);

            onHide?.();
            setArchivoImportacion(null);
            const estadoToast = obtenerEstadoToastImportacion(resultado);

            toast.current?.show({
                severity: estadoToast.severity,
                summary: estadoToast.summary,
                detail: resultado?.message || mensajeExito,
                life: 5000,
            });
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: obtenerMensajeError(error),
                life: 5000,
            });
        } finally {
            setEstadoImportando(false);
        }
    };

    return (
        <Dialog
            visible={visible}
            style={{ width: "700px", maxWidth: "95vw" }}
            header={titulo || intl.formatMessage({ id: 'Importar archivo CSV' })}
            modal
            closable={!estadoProcesando}
            closeOnEscape={!estadoProcesando}
            dismissableMask={!estadoProcesando}
            footer={
                <>
                    <Button
                        label={intl.formatMessage({ id: 'Cancelar' })}
                        icon="pi pi-times"
                        text
                        onClick={cerrarDialogo}
                        disabled={estadoProcesando}
                    />
                    <Button
                        label={estadoImportando ? `${intl.formatMessage({ id: 'Importando' })}...` : intl.formatMessage({ id: 'Importar' })}
                        icon={estadoImportando ? "pi pi-spin pi-spinner" : "pi pi-upload"}
                        onClick={importarArchivo}
                        disabled={estadoProcesando}
                    />
                </>
            }
            onHide={cerrarDialogo}
        >
            <div className="flex flex-column gap-4">
                <span>{intl.formatMessage({ id: 'Selecciona un fichero para importar' })}</span>

                <div className="grid">
                    <div className="col-12 md:col-4">
                        <Button
                            label={intl.formatMessage({ id: 'Plantilla insert' })}
                            icon="pi pi-download"
                            outlined
                            className="w-full"
                            onClick={() => ejecutarDescarga(() => descargarPlantillaImportacion(tabla, 'insertar'))}
                            disabled={estadoProcesando}
                        />
                    </div>
                    <div className="col-12 md:col-4">
                        <Button
                            label={intl.formatMessage({ id: 'Plantilla update' })}
                            icon="pi pi-download"
                            outlined
                            className="w-full"
                            onClick={() => ejecutarDescarga(() => descargarPlantillaImportacion(tabla, 'actualizar'))}
                            disabled={estadoProcesando}
                        />
                    </div>
                    <div className="col-12 md:col-4">
                        <Button
                            label={intl.formatMessage({ id: 'Descargar todo' })}
                            icon="pi pi-table"
                            outlined
                            className="w-full"
                            onClick={() => ejecutarDescarga(() => descargarTodoImportacion(tabla))}
                            disabled={estadoProcesando}
                        />
                    </div>
                </div>

                {preguntasDinamicas.length > 0 && (
                    <div className="flex flex-column gap-3">
                        {preguntasDinamicas.map((pregunta) => {
                            const valor = respuestasImportacion[pregunta.id] ?? null;

                            return (
                                <div key={pregunta.id} className="flex flex-column gap-2">
                                    <label htmlFor={`pregunta-importacion-${pregunta.id}`}>
                                        <b>{pregunta.label}</b>
                                    </label>

                                    {pregunta.type === 'select' && (
                                        <Dropdown
                                            id={`pregunta-importacion-${pregunta.id}`}
                                            value={valor}
                                            options={pregunta.options || []}
                                            onChange={(e) => actualizarRespuesta(pregunta.id, e.value)}
                                            optionLabel={pregunta.optionLabel || 'label'}
                                            optionValue={pregunta.optionValue || 'value'}
                                            placeholder={pregunta.placeholder}
                                            disabled={estadoProcesando || pregunta.disabled}
                                            className="w-full"
                                        />
                                    )}

                                    {(pregunta.type === 'text' || !pregunta.type) && (
                                        <InputText
                                            id={`pregunta-importacion-${pregunta.id}`}
                                            value={valor || ''}
                                            onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
                                            placeholder={pregunta.placeholder}
                                            disabled={estadoProcesando || pregunta.disabled}
                                        />
                                    )}

                                    {pregunta.helpText && <small>{pregunta.helpText}</small>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {estadoProcesando && (
                    <div className="flex flex-column align-items-center justify-content-center gap-3 py-3">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                        <b>{intl.formatMessage({ id: estadoImportando ? 'Procesando importación...' : 'Preparando descarga...' })}</b>
                        <small>{intl.formatMessage({ id: 'Espera a que termine el backend para cerrar este diálogo.' })}</small>
                    </div>
                )}

                <div className="flex flex-column gap-2">
                    <b>{intl.formatMessage({ id: 'Archivo a importar' })}</b>
                    <input
                        ref={inputArchivoRef}
                        id={`archivo-importacion-${controlador || 'crud'}`}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) => setArchivoImportacion(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-column md:flex-row gap-2">
                        <Button
                            label={archivoImportacion ? intl.formatMessage({ id: 'Cambiar archivo' }) : intl.formatMessage({ id: 'Elegir archivo' })}
                            icon="pi pi-file-import"
                            outlined
                            onClick={() => inputArchivoRef.current?.click()}
                            disabled={estadoProcesando}
                        />
                        {archivoImportacion && (
                            <Button
                                label={intl.formatMessage({ id: 'Quitar archivo' })}
                                icon="pi pi-trash"
                                text
                                severity="secondary"
                                onClick={() => setArchivoImportacion(null)}
                                disabled={estadoProcesando}
                            />
                        )}
                    </div>
                    {archivoImportacion && <small>{archivoImportacion.name}</small>}
                </div>
            </div>
        </Dialog>
    );
};

export default ImportacionExportacionCrud;
