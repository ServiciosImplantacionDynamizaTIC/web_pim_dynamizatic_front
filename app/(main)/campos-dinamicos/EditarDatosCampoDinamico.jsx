import React, { useState } from "react";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { useIntl } from "react-intl";

const EditarDatosCampoDinamico = ({
    campoDinamico,
    setCampoDinamico,
    estadoGuardando,
    opcionesCampo,
    setOpcionesCampo,
    editable,
    gruposDisponibles,
    gruposSeleccionadosIds,
    setGruposSeleccionadosIds,
}) => {
    const intl = useIntl();
    const [nuevoValor, setNuevoValor] = useState("");
    const gruposSeleccionadosNormalizados = Array.from(
        new Set(
            (gruposSeleccionadosIds || [])
                .map((grupoId) => Number(grupoId || 0))
                .filter((grupoId) => grupoId > 0)
        )
    );

    const tiposCampo = [
        { label: intl.formatMessage({ id: "Texto" }), value: "texto" },
        { label: intl.formatMessage({ id: "Numero" }), value: "numero" },
        { label: intl.formatMessage({ id: "Fecha" }), value: "fecha" },
        { label: intl.formatMessage({ id: "Lista" }), value: "lista" },
        { label: intl.formatMessage({ id: "Multiseleccion" }), value: "multiselect" },
    ];

    const mostrarCamposValores = campoDinamico.tipoCampo === "lista" || campoDinamico.tipoCampo === "multiselect";
    const opcionesGrupos = Array.from(
        new Map(
            (gruposDisponibles || [])
                .map((grupo) => {
                    const idGrupo = Number(
                        grupo?.id ?? grupo?.grupoCampoDinamicoId ?? grupo?.grupo_campo_dinamico_id ?? 0
                    );
                    if (!idGrupo) {
                        return null;
                    }
                    return [
                        idGrupo,
                        {
                            label: grupo?.nombre || `${intl.formatMessage({ id: "Grupo" })} ${idGrupo}`,
                            value: idGrupo,
                        },
                    ];
                })
                .filter(Boolean)
        ).values()
    );

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        const esTrue = valor === true ? "S" : "N";
        setCampoDinamico({ ...campoDinamico, [nombreInputSwitch]: esTrue });
    };

    const agregarValor = () => {
        const valorLimpio = (nuevoValor || "").trim();
        if (!valorLimpio) {
            return;
        }

        const valoresActuales = Array.isArray(opcionesCampo?.valores) ? opcionesCampo.valores : [];
        if (valoresActuales.includes(valorLimpio)) {
            setNuevoValor("");
            return;
        }

        setOpcionesCampo({
            ...opcionesCampo,
            valores: [...valoresActuales, valorLimpio],
        });
        setNuevoValor("");
    };

    const manejarKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            agregarValor();
        }
    };

    // Si el tipo de campo cambia a uno que no es lista o multiselect, se limpian las opciones
    const manejarCambioTipoCampo = (e) => {
        const nuevoTipo = e.value;
        setCampoDinamico({ ...campoDinamico, tipoCampo: nuevoTipo });

        if (nuevoTipo === "lista") {
            setOpcionesCampo((prev) => ({ ...prev, multiselectSn: "N" }));
            return;
        }

        if (nuevoTipo === "multiselect") {
            setOpcionesCampo((prev) => ({ ...prev, multiselectSn: "S" }));
            return;
        }

        setOpcionesCampo({ multiselectSn: "N", valores: [] });
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: "Datos del campo dinamico" })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="gruposCampoDinamico">
                            <b>{intl.formatMessage({ id: "Grupo de campos dinamicos" })}*</b>
                        </label>
                        <MultiSelect
                            inputId="gruposCampoDinamico"
                            value={gruposSeleccionadosNormalizados}
                            options={opcionesGrupos}
                            onChange={(e) =>
                                setGruposSeleccionadosIds(
                                    Array.from(
                                        new Set(
                                            (e.value || [])
                                                .map((grupoId) => Number(grupoId || 0))
                                                .filter((grupoId) => grupoId > 0)
                                        )
                                    )
                                )
                            }
                            optionLabel="label"
                            optionValue="value"
                            dataKey="value"
                            placeholder={intl.formatMessage({ id: "Seleccionar grupos" })}
                            display="chip"
                            filter
                            filterBy="label"
                            emptyMessage={intl.formatMessage({ id: "No hay grupos disponibles" })}
                            className={`${estadoGuardando && gruposSeleccionadosNormalizados.length === 0 ? "p-invalid" : ""}`}
                            disabled={estadoGuardando || !editable}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="nombre">
                            <b>{intl.formatMessage({ id: "Nombre" })}*</b>
                        </label>
                        <InputText
                            id="nombre"
                            value={campoDinamico.nombre}
                            placeholder={intl.formatMessage({ id: "Nombre del campo dinamico" })}
                            onChange={(e) => setCampoDinamico({ ...campoDinamico, nombre: e.target.value })}
                            className={`${estadoGuardando && campoDinamico.nombre === "" ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando || !editable}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="orden">{intl.formatMessage({ id: "Orden" })}</label>
                        <InputNumber
                            id="orden"
                            value={campoDinamico.orden || 0}
                            placeholder={intl.formatMessage({ id: "Orden de visualizacion" })}
                            onValueChange={(e) => setCampoDinamico({ ...campoDinamico, orden: e.value || 0 })}
                            disabled={estadoGuardando || !editable}
                            min={0}
                            inputStyle={{ textAlign: "right" }}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="obligatorio" className="font-bold block">
                            {intl.formatMessage({ id: "Obligatorio" })}
                        </label>
                        <InputSwitch
                            id="obligatorio"
                            checked={campoDinamico.obligatorioSn === "S"}
                            onChange={(e) => manejarCambioInputSwitch(e, "obligatorioSn")}
                            disabled={estadoGuardando || !editable}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="activo" className="font-bold block">
                            {intl.formatMessage({ id: "Activo" })}
                        </label>
                        <InputSwitch
                            id="activo"
                            checked={campoDinamico.activoSn === "S"}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando || !editable}
                        />
                    </div>
                </div>

                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="tipoCampo">
                            <b>{intl.formatMessage({ id: "Tipo de Dato" })}</b>
                        </label>
                        <Dropdown
                            id="tipoCampo"
                            value={campoDinamico.tipoCampo}
                            options={tiposCampo}
                            onChange={manejarCambioTipoCampo}
                            placeholder={intl.formatMessage({ id: "Seleccionar tipo de dato" })}
                            disabled={estadoGuardando || !editable}
                        />
                    </div>

                    {mostrarCamposValores && (
                        <>
                            <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                                <label htmlFor="nuevoValor">{intl.formatMessage({ id: "Agregar nuevo valor" })}</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="nuevoValor"
                                        value={nuevoValor}
                                        placeholder={intl.formatMessage({ id: "Ingrese un valor" })}
                                        onChange={(e) => setNuevoValor(e.target.value)}
                                        onKeyPress={manejarKeyPress}
                                        disabled={estadoGuardando || !editable}
                                    />
                                    <Button
                                        icon="pi pi-plus"
                                        label={intl.formatMessage({ id: "Agregar" })}
                                        onClick={agregarValor}
                                        disabled={estadoGuardando || !editable || !nuevoValor.trim()}
                                        className="p-button-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                                <label htmlFor="valoresPermitidos">{intl.formatMessage({ id: "Valores Permitidos" })}</label>
                                <InputTextarea
                                    id="valoresPermitidos"
                                    value={(opcionesCampo?.valores || []).join(";")}
                                    placeholder={intl.formatMessage({ id: "Valores separados por punto y coma (;)" })}
                                    rows={3}
                                    disabled={estadoGuardando || !editable}
                                    readOnly
                                />
                            </div>
                        </>
                    )}

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: "Descripcion" })}</label>
                        <InputTextarea
                            id="descripcion"
                            value={campoDinamico.descripcion || ""}
                            placeholder={intl.formatMessage({ id: "Descripcion del campo dinamico" })}
                            onChange={(e) => setCampoDinamico({ ...campoDinamico, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando || !editable}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosCampoDinamico;
