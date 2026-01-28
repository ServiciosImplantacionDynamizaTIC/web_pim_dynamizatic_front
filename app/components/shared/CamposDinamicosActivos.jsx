import React, { useEffect, useMemo, useRef, useState } from "react";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useIntl } from "react-intl";
import { getCamposDinamicos } from "@/app/api-endpoints/campo_dinamico";
import { getProductos } from "@/app/api-endpoints/producto";
import { getProductoCampoDinamicos, patchProductoCampoDinamico, postProductoCampoDinamico } from "@/app/api-endpoints/producto_campo_dinamico";
import { getUsuarioSesion } from "@/app/utility/Utils";

const CamposDinamicosActivos = ({ refrescar = 0 }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const [campos, setCampos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);
    // Valores locales por campo dinamico
    const [valoresCampos, setValoresCampos] = useState({});
    const [mapaRegistrosProducto, setMapaRegistrosProducto] = useState({});
    const panelRefs = useRef({});
    const [panelWidths, setPanelWidths] = useState({});

    // Carga campos dinamicos activos por empresa
    const cargarCampos = async () => {
        try {
            const filtro = JSON.stringify({
                where: {
                    and: {
                        empresaId: getUsuarioSesion()?.empresaId,
                        activoSn: "S",
                    },
                },
                order: "orden ASC",
            });
            const registros = await getCamposDinamicos(filtro);
            setCampos(registros || []);
        } catch (error) {
            console.error("Error cargando campos dinamicos:", error);
            setCampos([]);
        }
    };

    useEffect(() => {
        cargarCampos();
    }, [refrescar]);

    // Carga los productos disponibles (solo ids)
    const cargarProductos = async () => {
        try {
            const filtro = JSON.stringify({
                where: {
                    and: {
                        empresaId: getUsuarioSesion()?.empresaId,
                    },
                },
                fields: { id: true },
                order: "id ASC",
            });
            const registros = await getProductos(filtro);
            const opciones = (registros || []).map((producto) => ({
                label: `${producto.id}`,
                value: producto.id,
            }));
            setProductos(opciones);
            if (!productoSeleccionadoId && opciones.length > 0) {
                setProductoSeleccionadoId(opciones[0].value);
            }
        } catch (error) {
            console.error("Error cargando productos:", error);
            setProductos([]);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    // Interpreta el JSON de opciones para pintar inputs
    const parsearOpciones = (opciones) => {
        if (!opciones) {
            return { multiselectSn: "N", valores: [] };
        }
        try {
            const json = JSON.parse(opciones);
            return {
                multiselectSn: json?.multiselectSn === "S" ? "S" : "N",
                valores: Array.isArray(json?.valores) ? json.valores : [],
            };
        } catch (error) {
            const valores = opciones
                .split(",")
                .map((valor) => valor.trim())
                .filter((valor) => valor !== "");
            return { multiselectSn: "N", valores };
        }
    };

    // Cache de opciones por id de campo
    const opcionesPorCampo = useMemo(() => {
        const opciones = {};
        campos.forEach((campo) => {
            opciones[campo.id] = parsearOpciones(campo.opciones);
        });
        return opciones;
    }, [campos]);

    // Carga valores guardados por producto y los aplica al estado
    const cargarValoresProducto = async (productoId) => {
        if (!productoId) {
            setValoresCampos({});
            setMapaRegistrosProducto({});
            return;
        }
        try {
            const filtro = JSON.stringify({
                where: {
                    and: {
                        productoId: productoId,
                    },
                },
            });
            const registros = await getProductoCampoDinamicos(filtro);
            const mapa = {};
            const valores = {};
            (registros || []).forEach((registro) => {
                mapa[registro.campoDinamicoId] = registro;
            });
            campos.forEach((campo) => {
                const registro = mapa[campo.id];
                if (!registro || registro.valor === null || registro.valor === undefined) {
                    valores[campo.id] = campo.tipoCampo === "select" ? [] : "";
                    return;
                }
                const opcionesCampo = opcionesPorCampo[campo.id] || { multiselectSn: "N" };
                valores[campo.id] = deserializarValor(campo, registro.valor, opcionesCampo);
            });
            setMapaRegistrosProducto(mapa);
            setValoresCampos(valores);
        } catch (error) {
            console.error("Error cargando valores de producto:", error);
            setMapaRegistrosProducto({});
            setValoresCampos({});
        }
    };

    useEffect(() => {
        if (campos.length === 0) {
            setValoresCampos({});
            setMapaRegistrosProducto({});
            return;
        }
        cargarValoresProducto(productoSeleccionadoId);
    }, [campos, productoSeleccionadoId, opcionesPorCampo]);

    // Convierte el valor almacenado en el tipo esperado por el input
    const deserializarValor = (campo, valor, opcionesCampo) => {
        if (valor === null || valor === undefined) {
            return "";
        }
        switch (campo.tipoCampo) {
            case "numero":
                return Number(valor);
            case "fecha": {
                const fecha = new Date(valor);
                return isNaN(fecha.getTime()) ? null : fecha;
            }
            case "select":
                if (opcionesCampo.multiselectSn === "S") {
                    try {
                        const parsed = JSON.parse(valor);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (error) {
                        return valor.split(",").map((item) => item.trim()).filter((item) => item !== "");
                    }
                }
                return valor;
            default:
                return valor;
        }
    };

    // Convierte el valor del input a string para persistir
    const serializarValor = (campo, valor, opcionesCampo) => {
        if (valor === null || valor === undefined || valor === "") {
            return null;
        }
        switch (campo.tipoCampo) {
            case "numero":
                return `${valor}`;
            case "fecha":
                return valor instanceof Date ? valor.toISOString() : `${valor}`;
            case "select":
                if (opcionesCampo.multiselectSn === "S") {
                    return JSON.stringify(Array.isArray(valor) ? valor : []);
                }
                return `${valor}`;
            default:
                return `${valor}`;
        }
    };

    // Actualiza el valor local del campo
    const actualizarValor = (campoId, valor) => {
        setValoresCampos((prev) => ({
            ...prev,
            [campoId]: valor,
        }));
    };

    const ajustarAnchoPanel = (campoId) => {
        const contenedor = panelRefs.current[campoId];
        const ancho = contenedor?.offsetWidth;
        if (!ancho) {
            return;
        }
        setPanelWidths((prev) => ({
            ...prev,
            [campoId]: `${ancho}px`,
        }));
    };

    const campoObligatorioCompleto = (campo) => {
        if (campo.obligatorioSn !== "S") {
            return true;
        }
        const valor = valoresCampos[campo.id];
        const opcionesCampo = opcionesPorCampo[campo.id] || { multiselectSn: "N" };
        switch (campo.tipoCampo) {
            case "numero":
                return valor !== null && valor !== undefined && valor !== "";
            case "fecha":
                return valor instanceof Date ? !isNaN(valor.getTime()) : !!valor;
            case "select":
                if (opcionesCampo.multiselectSn === "S") {
                    return Array.isArray(valor) && valor.length > 0;
                }
                return valor !== null && valor !== undefined && valor !== "";
            default:
                return typeof valor === "string" ? valor.trim() !== "" : valor !== null && valor !== undefined && valor !== "";
        }
    };

    // Renderiza el input segun el tipo de campo
    const renderInputCampo = (campo) => {
        const valorActual = valoresCampos[campo.id];
        const opcionesCampo = opcionesPorCampo[campo.id] || { multiselectSn: "N", valores: [] };
        const valoresOpciones = opcionesCampo.valores.map((valor) => ({
            label: valor,
            value: valor,
        }));
        const placeholder = campo.etiqueta || campo.nombre;
        const truncarTexto = (texto, limite = 10) => {
            const limpio = `${texto ?? ""}`;
            if (limpio.length <= limite) {
                return limpio;
            }
            return `${limpio.slice(0, limite)}...`;
        };
        const valoresSeleccionados =
            campo.tipoCampo === "select" && opcionesCampo.multiselectSn === "S"
                ? (Array.isArray(valorActual) ? valorActual : [])
                      .map((item) => (item !== null && item !== undefined ? `${item}` : ""))
                      .map((item) => item.trim())
                      .filter((item) => item !== "")
                : valorActual;
        const plantillaOpcion = (opcion) => (
            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {opcion?.label ?? ""}
            </span>
        );
        const plantillaSeleccion = (opcion) => truncarTexto(opcion?.label ?? opcion ?? "");
        const plantillaSeleccionMulti = (valorSeleccionado) => {
            const etiquetaCompleta =
                valoresOpciones.find((opcion) => opcion.value === valorSeleccionado)?.label ?? valorSeleccionado;
            if (!etiquetaCompleta) {
                return null;
            }
            const etiqueta = truncarTexto(etiquetaCompleta);
            const quitarValor = (e) => {
                e.stopPropagation();
                const valoresActuales = Array.isArray(valoresSeleccionados) ? valoresSeleccionados : [];
                const nuevosValores = valoresActuales.filter((item) => item !== valorSeleccionado);
                actualizarValor(campo.id, nuevosValores);
            };
            return (
                <div className="p-multiselect-token">
                    <span className="p-multiselect-token-label">{etiqueta}</span>
                    <span className="p-multiselect-token-icon pi pi-times" role="button" onClick={quitarValor} />
                </div>
            );
        };

        switch (campo.tipoCampo) {
            case "texto":
                return (
                    <InputText
                        value={valorActual || ""}
                        placeholder={placeholder}
                        onChange={(e) => actualizarValor(campo.id, e.target.value)}
                    />
                );
            case "numero":
                return (
                    <InputNumber
                        value={valorActual || 0}
                        placeholder={placeholder}
                        onValueChange={(e) => actualizarValor(campo.id, e.value)}
                        inputStyle={{ textAlign: "right" }}
                    />
                );
            case "fecha":
                return (
                    <Calendar
                        value={valorActual || null}
                        onChange={(e) => actualizarValor(campo.id, e.value)}
                        placeholder={placeholder}
                        dateFormat="dd/mm/yy"
                        showIcon
                    />
                );
            case "select":
                if (valoresOpciones.length === 0) {
                    return (
                        <small className="text-500">
                            {intl.formatMessage({ id: "Sin opciones configuradas" })}
                        </small>
                    );
                }
                return (
                    <div ref={(el) => { panelRefs.current[campo.id] = el; }}>
                        {opcionesCampo.multiselectSn === "S" ? (
                            <MultiSelect
                                value={valoresSeleccionados || []}
                                options={valoresOpciones}
                                onChange={(e) => actualizarValor(campo.id, e.value)}
                                placeholder={intl.formatMessage({ id: "Seleccionar opciones" })}
                                display="chip"
                                itemTemplate={plantillaOpcion}
                                selectedItemTemplate={plantillaSeleccionMulti}
                                panelStyle={{ width: panelWidths[campo.id] }}
                                onShow={() => ajustarAnchoPanel(campo.id)}
                                className="w-full"
                            />
                        ) : (
                            <Dropdown
                                value={valorActual || null}
                                options={valoresOpciones}
                                onChange={(e) => actualizarValor(campo.id, e.value)}
                                placeholder={intl.formatMessage({ id: "Seleccionar opcion" })}
                                showClear
                                itemTemplate={plantillaOpcion}
                                valueTemplate={plantillaSeleccion}
                                panelStyle={{ width: panelWidths[campo.id] }}
                                onShow={() => ajustarAnchoPanel(campo.id)}
                                className="w-full"
                                style={{ minHeight: "3.2rem" }}
                            />
                        )}
                    </div>
                );
            default:
                return (
                    <InputText
                        value={valorActual || ""}
                        placeholder={placeholder}
                        onChange={(e) => actualizarValor(campo.id, e.target.value)}
                    />
                );
        }
    };

    // Guarda los valores actuales por producto y campo dinamico
    const guardarValores = async () => {
        if (!productoSeleccionadoId) {
            return;
        }
        const faltanObligatorios = campos.some((campo) => !campoObligatorioCompleto(campo));
        if (faltanObligatorios) {
            toast.current?.show({
                severity: "warn",
                summary: intl.formatMessage({ id: "Campos obligatorios" }),
                detail: intl.formatMessage({ id: "Hay campos obligatorios sin rellenar" }),
                life: 4000,
            });
            return;
        }
        const usuarioActual = getUsuarioSesion()?.id;
        try {
            const operaciones = campos.map(async (campo) => {
                const opcionesCampo = opcionesPorCampo[campo.id] || { multiselectSn: "N" };
                const valor = serializarValor(campo, valoresCampos[campo.id], opcionesCampo);
                const registroExistente = mapaRegistrosProducto[campo.id];

                if (registroExistente && registroExistente.id) {
                    const objActualizar = {
                        valor: valor,
                        usuarioModificacion: usuarioActual,
                    };
                    await patchProductoCampoDinamico(registroExistente.id, objActualizar);
                } else {
                    const objNuevo = {
                        productoId: productoSeleccionadoId,
                        campoDinamicoId: campo.id,
                        valor: valor,
                        usuarioCreacion: usuarioActual,
                    };
                    const nuevoRegistro = await postProductoCampoDinamico(objNuevo);
                    if (nuevoRegistro?.id) {
                        setMapaRegistrosProducto((prev) => ({
                            ...prev,
                            [campo.id]: nuevoRegistro,
                        }));
                    }
                }
            });
            await Promise.all(operaciones);
            toast.current?.show({
                severity: "success",
                summary: intl.formatMessage({ id: "Guardado correcto" }),
                detail: intl.formatMessage({ id: "Los campos se han guardado correctamente" }),
                life: 3000,
            });
        } catch (error) {
            console.error("Error guardando campos dinamicos:", error);
            toast.current?.show({
                severity: "error",
                summary: intl.formatMessage({ id: "Error" }),
                detail: intl.formatMessage({ id: "No se pudieron guardar los campos" }),
                life: 4000,
            });
        }
    };

    return (
        <div className="mt-4">
            <Toast ref={toast} position="top-right" />
            <div className="mb-2">
                <small style={{ color: "#dc2626", fontWeight: "600" }}>
                    {intl.formatMessage({ id: "Este componente es provisional y se mostrara en la pagina de producto." })}
                </small>
            </div>
            <div className="formgrid grid align-items-end mb-3">
                <div className="flex flex-column field gap-2 col-12 lg:col-3">
                    <label htmlFor="productoId">{intl.formatMessage({ id: "Producto" })}</label>
                    <Dropdown
                        id="productoId"
                        value={productoSeleccionadoId}
                        options={productos}
                        onChange={(e) => setProductoSeleccionadoId(e.value)}
                        placeholder={intl.formatMessage({ id: "Seleccionar producto" })}
                        filter
                        showClear
                        disabled={productos.length === 0}
                    />
                </div>
            </div>
            <Fieldset>
                {campos.length === 0 ? (
                    <small className="text-500">
                        {intl.formatMessage({ id: "No hay campos dinamicos activos" })}
                    </small>
                ) : (
                    <div className="formgrid grid">
                        {campos.map((campo) => (
                            <div key={campo.id} className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                                <label>
                                    {campo.obligatorioSn === "S" ? (
                                        <strong>
                                            {campo.etiqueta || campo.nombre} *
                                        </strong>
                                    ) : (
                                        campo.etiqueta || campo.nombre
                                    )}
                                </label>
                                {renderInputCampo(campo)}
                            </div>
                        ))}
                    </div>
                )}
            </Fieldset>
            <div className="flex justify-content-end mt-3">
                <Button
                    label={intl.formatMessage({ id: "Guardar" })}
                    icon="pi pi-save"
                    onClick={guardarValores}
                    disabled={!productoSeleccionadoId || campos.length === 0}
                />
            </div>
        </div>
    );
};

export default CamposDinamicosActivos;
