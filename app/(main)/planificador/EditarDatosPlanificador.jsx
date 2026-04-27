"use client";

import { Fieldset } from "primereact/fieldset";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { useIntl } from "react-intl";

const EditarDatosPlanificador = ({ planificador, setPlanificador, estadoGuardando }) => {
    const intl = useIntl();

    const actualizarCampo = (campo, valor) => {
        setPlanificador({ ...planificador, [campo]: valor });
    };

    return (
        <Fieldset legend={intl.formatMessage({ id: "Datos del planificador de producto" })}>
            <div className="formgrid grid">
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="nombre">
                        <b>{intl.formatMessage({ id: "Nombre de plantilla" })}*</b>
                    </label>
                    <InputText
                        id="nombre"
                        value={planificador.nombre || ""}
                        placeholder={intl.formatMessage({ id: "Nombre del planificador" })}
                        onChange={(e) => actualizarCampo("nombre", e.target.value)}
                        className={estadoGuardando && !planificador.nombre ? "p-invalid" : ""}
                        maxLength={50}
                    />
                </div>
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-2">
                    <label htmlFor="activoSn" className="font-bold block">
                        {intl.formatMessage({ id: "Activo" })}
                    </label>
                    <InputSwitch
                        checked={(planificador.activoSn || planificador.activoSn) === "S"}
                        onChange={(e) => {
                            const valor = e.value ? "S" : "N";
                            setPlanificador({ ...planificador, activoSn: valor });
                        }}
                    />
                </div>
            </div>
        </Fieldset>
    );
};

export default EditarDatosPlanificador;

