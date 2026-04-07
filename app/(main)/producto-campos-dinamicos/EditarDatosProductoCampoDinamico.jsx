import React, { useState, useEffect } from "react";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { getProductos } from "@/app/api-endpoints/producto";
import { getCamposDinamicos } from "@/app/api-endpoints/campo_dinamico";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarDatosProductoCampoDinamico = ({ productoCampoDinamico, setProductoCampoDinamico, estadoGuardando, editable, idProducto, rowData }) => {
    const intl = useIntl();

    const [productos, setProductos] = useState([]);
    const [camposDinamicos, setCamposDinamicos] = useState([]);
    const [camposDinamicosCompletos, setCamposDinamicosCompletos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoCamposDinamicos, setCargandoCamposDinamicos] = useState(false);

    const leerOpcionesCampo = (opcionesCrudas) => {
        try {
            const opciones = typeof opcionesCrudas === "string"
                ? JSON.parse(opcionesCrudas || "{}")
                : (opcionesCrudas || {});

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

    const convertirValorDesdeBd = (tipoCampo, opciones, valor) => {
        const tipoNormalizado = `${tipoCampo || "texto"}`.toLowerCase();
        const opcionesConfiguradas = leerOpcionesCampo(opciones);
        const esMulti = tipoNormalizado === "multiselect" || opcionesConfiguradas.multiselectSn === "S";

        if (tipoNormalizado === "booleano" || tipoNormalizado === "switch") {
            if (
                valor === true ||
                valor === 1 ||
                valor === "1" ||
                `${valor || ""}`.trim().toUpperCase() === "S" ||
                `${valor || ""}`.trim().toLowerCase() === "true"
            ) {
                return true;
            }

            return false;
        }

        if (tipoNormalizado === "numero") {
            if (valor === undefined || valor === null || valor === "") {
                return null;
            }
            const numero = Number(valor);
            return Number.isNaN(numero) ? null : numero;
        }

        if (tipoNormalizado === "fecha") {
            if (!valor) {
                return null;
            }
            const fecha = new Date(valor);
            return Number.isNaN(fecha.getTime()) ? null : fecha;
        }

        if (esMulti) {
            if (!valor) {
                return [];
            }
            return `${valor}`.split(",").map((item) => item.trim()).filter(Boolean);
        }

        return valor || "";
    };

    // Cargar productos para el dropdown
    useEffect(() => {
        const cargarProductos = async () => {
            setCargandoProductos(true);
            try {
                let filtro;
                if (idProducto) {
                    filtro = JSON.stringify({
                        where: {
                            and: {
                                id: idProducto,
                                empresaId: getUsuarioSesion()?.empresaId,
                                activoSn: "S"
                            }
                        }
                    });
                } else {
                    filtro = JSON.stringify({
                        where: {
                            and: {
                                empresaId: getUsuarioSesion()?.empresaId,
                                activoSn: "S"
                            }
                        }
                    });
                }

                const data = await getProductos(filtro);
                const productosFormateados = data.map(prod => ({
                    label: `${prod.sku} - ${prod.nombre}`,
                    value: prod.id
                }));
                setProductos(productosFormateados);

            } catch (error) {
                console.error("Error cargando productos:", error);
            } finally {
                setCargandoProductos(false);
            }
        };

        cargarProductos();
    }, [idProducto]);

    // Cargar campos dinámicos para el dropdown
    useEffect(() => {
        const cargarCamposDinamicos = async () => {
            setCargandoCamposDinamicos(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: "S"
                        }
                    },
                    order: ["orden ASC", "nombre ASC"]
                });

                const data = await getCamposDinamicos(filtro);
                setCamposDinamicosCompletos(data);

                let camposDisponibles = data;
                if (rowData && idProducto) {
                    const camposUsados = rowData
                        .filter(registro => registro.productoId === idProducto && registro.id !== productoCampoDinamico?.id)
                        .map(registro => registro.campoDinamicoId);

                    camposDisponibles = data.filter(campo => !camposUsados.includes(campo.id));
                }

                const camposFormateados = camposDisponibles.map(campo => ({
                    label: campo.etiqueta || campo.nombre,
                    value: campo.id
                }));
                setCamposDinamicos(camposFormateados);

            } catch (error) {
                console.error("Error cargando campos dinámicos:", error);
            } finally {
                setCargandoCamposDinamicos(false);
            }
        };

        cargarCamposDinamicos();
    }, [rowData, idProducto, productoCampoDinamico?.id]);

    // Efecto separado para auto-seleccionar el producto cuando está disponible
    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoCampoDinamico(prev => {
                if (!prev?.productoId || prev.productoId !== idProducto) {
                    return { ...prev, productoId: idProducto };
                }
                return prev;
            });
        }
    }, [idProducto, productos, setProductoCampoDinamico]);

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setProductoCampoDinamico(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setProductoCampoDinamico(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioCampoDinamico = (e) => {
        const campoDinamicoId = e.value;
        const campoSeleccionado = camposDinamicosCompletos.find(campo => campo.id === campoDinamicoId);

        setProductoCampoDinamico(prev => ({
            ...prev,
            campoDinamicoId,
            tipoCampo: opcionesConfiguradas?.tipoExtendido || campoSeleccionado?.tipoCampo || "texto",
            opciones: campoSeleccionado?.opciones || null,
            valor: convertirValorDesdeBd(opcionesConfiguradas?.tipoExtendido || campoSeleccionado?.tipoCampo, campoSeleccionado?.opciones, prev?.valor),
        }));
    };

    const manejarCambioNumero = (e, nombreCampo) => {
        const valor = e.value;
        setProductoCampoDinamico(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const renderizarCampoValor = () => {
        const tipoCampo = `${productoCampoDinamico?.tipoCampo || "texto"}`.toLowerCase();
        const opcionesConfiguradas = leerOpcionesCampo(productoCampoDinamico?.opciones);
        const opciones = (opcionesConfiguradas?.valores || []).map((valor) => ({
            label: valor,
            value: valor,
        }));

        switch (tipoCampo) {
            case "texto":
                return (
                    <InputText
                        inputId="valor"
                        value={productoCampoDinamico?.valor || ""}
                        onChange={(e) => manejarCambioInput(e, "valor")}
                        disabled={!editable || estadoGuardando}
                        placeholder={intl.formatMessage({ id: "Valor del campo dinámico para este producto" })}
                        className={(!productoCampoDinamico?.valor || `${productoCampoDinamico?.valor}`.trim() === "") ? "p-invalid" : ""}
                    />
                );

            case "texto largo":
            case "textolargo":
            case "textarea":
                return (
                    <InputTextarea
                        inputId="valor"
                        value={productoCampoDinamico?.valor || ""}
                        onChange={(e) => manejarCambioInput(e, "valor")}
                        disabled={!editable || estadoGuardando}
                        rows={4}
                        autoResize
                        placeholder={intl.formatMessage({ id: "Valor del campo dinámico para este producto" })}
                        className={(!productoCampoDinamico?.valor || `${productoCampoDinamico?.valor}`.trim() === "") ? "p-invalid" : ""}
                    />
                );

            case "numero":
                return (
                    <InputNumber
                        inputId="valor"
                        value={productoCampoDinamico?.valor ?? null}
                        onValueChange={(e) => manejarCambioNumero(e, "valor")}
                        disabled={!editable || estadoGuardando}
                        placeholder={intl.formatMessage({ id: "Valor numérico del campo dinámico" })}
                        className={productoCampoDinamico?.valor === null || productoCampoDinamico?.valor === undefined ? "p-invalid" : ""}
                    />
                );

            case "fecha":
                return (
                    <Calendar
                        inputId="valor"
                        value={productoCampoDinamico?.valor || null}
                        onChange={(e) => setProductoCampoDinamico(prev => ({ ...prev, valor: e.value || null }))}
                        disabled={!editable || estadoGuardando}
                        placeholder={intl.formatMessage({ id: "Seleccione la fecha" })}
                        dateFormat="dd/mm/yy"
                        className={!productoCampoDinamico?.valor ? "p-invalid w-full" : "w-full"}
                    />
                );

            case "booleano":
            case "switch":
                return (
                    <InputSwitch
                        inputId="valor"
                        checked={!!productoCampoDinamico?.valor}
                        onChange={(e) => setProductoCampoDinamico(prev => ({ ...prev, valor: !!e.value }))}
                        disabled={!editable || estadoGuardando}
                    />
                );

            case "lista":
            case "select":
                if (opcionesConfiguradas.multiselectSn === "S") {
                    return (
                        <MultiSelect
                            inputId="valor"
                            value={Array.isArray(productoCampoDinamico?.valor) ? productoCampoDinamico.valor : []}
                            options={opciones}
                            onChange={(e) => setProductoCampoDinamico(prev => ({ ...prev, valor: e.value || [] }))}
                            placeholder={intl.formatMessage({ id: "Seleccione opciones" })}
                            disabled={!editable || estadoGuardando}
                            className="w-full"
                            display="chip"
                        />
                    );
                }

                return (
                    <Dropdown
                        inputId="valor"
                        value={productoCampoDinamico?.valor || ""}
                        options={opciones}
                        onChange={(e) => manejarCambioDropdown(e, "valor")}
                        placeholder={intl.formatMessage({ id: "Seleccione una opción" })}
                        disabled={!editable || estadoGuardando}
                        className={(!productoCampoDinamico?.valor || `${productoCampoDinamico?.valor}`.trim() === "") ? "p-invalid w-full" : "w-full"}
                        emptyMessage={intl.formatMessage({ id: "No hay opciones disponibles" })}
                        showClear
                    />
                );

            case "multiselect":
                return (
                    <MultiSelect
                        inputId="valor"
                        value={Array.isArray(productoCampoDinamico?.valor) ? productoCampoDinamico.valor : []}
                        options={opciones}
                        onChange={(e) => setProductoCampoDinamico(prev => ({ ...prev, valor: e.value || [] }))}
                        placeholder={intl.formatMessage({ id: "Seleccione opciones" })}
                        disabled={!editable || estadoGuardando}
                        className="w-full"
                        display="chip"
                    />
                );

            default:
                return (
                    <InputTextarea
                        inputId="valor"
                        value={productoCampoDinamico?.valor || ""}
                        onChange={(e) => manejarCambioInput(e, "valor")}
                        disabled={!editable || estadoGuardando}
                        rows={3}
                        autoResize
                        placeholder={intl.formatMessage({ id: "Valor del campo dinámico para este producto" })}
                        className={(!productoCampoDinamico?.valor || `${productoCampoDinamico?.valor}`.trim() === "") ? "p-invalid" : ""}
                    />
                );
        }
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: "Información del Producto" })} collapsed={false} toggleable style={{ display: idProducto ? "none" : "block" }}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: "Producto" })} *</label>
                        <Dropdown
                            inputId="productoId"
                            value={productoCampoDinamico?.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioDropdown(e, "productoId")}
                            placeholder={cargandoProductos ? intl.formatMessage({ id: "Cargando productos..." }) : intl.formatMessage({ id: "Seleccione un producto" })}
                            disabled={!editable || estadoGuardando || cargandoProductos || (idProducto && productos.length === 1)}
                            loading={cargandoProductos}
                            filter
                            showClear
                            className={(!productoCampoDinamico?.productoId) ? "p-invalid" : ""}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: "Información del Campo dinámico" })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="campoDinamicoId"><b>{intl.formatMessage({ id: "Campo dinámico" })} *</b></label>
                        <Dropdown
                            inputId="campoDinamicoId"
                            value={productoCampoDinamico?.campoDinamicoId}
                            options={camposDinamicos}
                            onChange={manejarCambioCampoDinamico}
                            placeholder={cargandoCamposDinamicos ? intl.formatMessage({ id: "Cargando campos dinámicos..." }) : intl.formatMessage({ id: "Seleccione un campo dinámico" })}
                            disabled={!editable || estadoGuardando || cargandoCamposDinamicos}
                            loading={cargandoCamposDinamicos}
                            filter
                            showClear
                            className={(!productoCampoDinamico?.campoDinamicoId) ? "p-invalid" : ""}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tipoCampo">{intl.formatMessage({ id: "Tipo" })}</label>
                        <InputText
                            inputId="tipoCampo"
                            value={productoCampoDinamico?.tipoCampo || ""}
                            disabled
                            placeholder={intl.formatMessage({ id: "Tipo del campo dinámico" })}
                        />
                    </div>
                </div>

                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="valor"><b>{intl.formatMessage({ id: "Valor" })} *</b></label>
                        {renderizarCampoValor()}
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoCampoDinamico;
