import React, { useState } from "react";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useIntl } from "react-intl";

const EditarDatosCampoDinamico = ({
    campoDinamico,
    setCampoDinamico,
    estadoGuardando,
    opcionesCampo,
    setOpcionesCampo,
}) => {
    const intl = useIntl();
    // Nuevo valor de la lista temporal antes de agregarlo
    const [nuevoValor, setNuevoValor] = useState("");

    const tiposCampo = [
        { label: intl.formatMessage({ id: "Texto" }), value: "texto" },
        { label: intl.formatMessage({ id: "Numero" }), value: "numero" },
        { label: intl.formatMessage({ id: "Fecha" }), value: "fecha" },
        { label: intl.formatMessage({ id: "Lista de valores" }), value: "select" },
    ];

    // Solo mostramos opciones si el tipo es lista de valores
    const mostrarOpciones = campoDinamico.tipoCampo === "select";

    // Normaliza los switches a 'S'/'N'
    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        const esTrue = valor === true ? "S" : "N";
        setCampoDinamico({ ...campoDinamico, [nombreInputSwitch]: esTrue });
    };

    // Agrega un valor único a la lista de opciones
    const agregarValor = () => {
        const valorLimpio = (nuevoValor || "").trim();
        if (!valorLimpio) {
            return;
        }
        if (opcionesCampo.valores.includes(valorLimpio)) {
            setNuevoValor("");
            return;
        }
        setOpcionesCampo({
            ...opcionesCampo,
            valores: [...opcionesCampo.valores, valorLimpio],
        });
        setNuevoValor("");
    };

    // Elimina un valor de la lista de opciones
    const eliminarValor = (valor) => {
        setOpcionesCampo({
            ...opcionesCampo,
            valores: opcionesCampo.valores.filter((item) => item !== valor),
        });
    };

    // Permite agregar con Enter
    const manejarKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            agregarValor();
        }
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: "Campos dinamicos" })}>
                <div className="formgrid grid align-items-end">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="nombre">
                            <b>{intl.formatMessage({ id: "Nombre Campo" })}*</b>
                        </label>
                        <InputText
                            id="nombre"
                            value={campoDinamico.nombre}
                            placeholder={intl.formatMessage({ id: "Nombre" })}
                            onChange={(e) => setCampoDinamico({ ...campoDinamico, nombre: e.target.value })}
                            className={`${estadoGuardando && campoDinamico.nombre === "" ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-3">
                        <label htmlFor="tipoCampo">
                            <b>{intl.formatMessage({ id: "Tipo" })}</b>
                        </label>
                        <Dropdown
                            id="tipoCampo"
                            value={campoDinamico.tipoCampo}
                            options={tiposCampo}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(e) => {
                                const nuevoTipo = e.value;
                                setCampoDinamico({ ...campoDinamico, tipoCampo: nuevoTipo });
                                if (nuevoTipo !== "select") {
                                    setOpcionesCampo({ multiselectSn: "N", valores: [] });
                                }
                            }}
                            placeholder={intl.formatMessage({ id: "Seleccionar" })}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-2">
                        <label htmlFor="activo" className="font-bold block" style={{ minHeight: "2rem" }}>
                            {intl.formatMessage({ id: "Activo" })}
                        </label>
                        <InputSwitch
                            id="activo"
                            checked={campoDinamico.activoSn === "S"}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-2">
                        <label htmlFor="obligatorio" className="font-bold block" style={{ minHeight: "2rem" }}>
                            {intl.formatMessage({ id: "Obligatorio" })}
                        </label>
                        <InputSwitch
                            id="obligatorio"
                            checked={campoDinamico.obligatorioSn === "S"}
                            onChange={(e) => manejarCambioInputSwitch(e, "obligatorioSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>

                {mostrarOpciones && (
                    <div className="formgrid grid align-items-start mt-2">
                        <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-2">
                            <label htmlFor="multiselect" className="block" style={{ minHeight: "2rem" }}>
                                {intl.formatMessage({ id: "Multiselect" })}
                            </label>
                            <InputSwitch
                                id="multiselect"
                                checked={opcionesCampo.multiselectSn === "S"}
                                onChange={(e) => {
                                    const valor = e.target.value === true ? "S" : "N";
                                    setOpcionesCampo({ ...opcionesCampo, multiselectSn: valor });
                                }}
                                disabled={estadoGuardando}
                            />
                        </div>
                        <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-5 pl-0">
                            <label htmlFor="nuevoValor">{intl.formatMessage({ id: "Valor" })}</label>
                            <div className="p-inputgroup">
                                <InputText
                                    id="nuevoValor"
                                    value={nuevoValor}
                                    placeholder={intl.formatMessage({ id: "Escribe un valor" })}
                                    onChange={(e) => setNuevoValor(e.target.value)}
                                    onKeyDown={manejarKeyDown}
                                    disabled={estadoGuardando}
                                    className="w-full"
                                />
                                <Button
                                    type="button"
                                    icon="pi pi-plus"
                                    iconPos="left"
                                    onClick={agregarValor}
                                    disabled={estadoGuardando}
                                />
                            </div>
                        </div>
                        <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-5 pl-0">
                            <label>{intl.formatMessage({ id: "Valores" })}</label>
                            <div className="surface-100 border-round p-2" style={{ minHeight: "44px" }}>
                                {opcionesCampo.valores.length === 0 ? (
                                    <small className="text-500">
                                        {intl.formatMessage({ id: "Aun no hay valores" })}
                                    </small>
                                ) : (
                                    <div className="flex flex-column gap-2">
                                        {opcionesCampo.valores.map((valor) => (
                                            <div key={valor} className="flex align-items-center gap-2">
                                                <span
                                                    className="flex-1"
                                                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                >
                                                    {valor}
                                                </span>
                                                <Button
                                                    type="button"
                                                    icon="pi pi-times"
                                                    className="p-button-text p-button-danger p-button-sm"
                                                    onClick={() => eliminarValor(valor)}
                                                    disabled={estadoGuardando}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Fieldset>
        </>
    );
};

export default EditarDatosCampoDinamico;

