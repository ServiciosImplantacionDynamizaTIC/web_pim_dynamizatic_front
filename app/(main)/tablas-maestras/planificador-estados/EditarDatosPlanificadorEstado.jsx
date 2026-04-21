import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { useIntl } from "react-intl";

const EditarDatosPlanificadorEstado = ({ planificadorEstado, setPlanificadorEstado, estadoGuardando }) => {
    const intl = useIntl();

    return (
        <Fieldset legend={intl.formatMessage({ id: "Datos para el estado del planificador" })}>
            <div className="formgrid grid">
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="nombre">
                        <b>{intl.formatMessage({ id: "Nombre" })}*</b>
                    </label>
                    <InputText
                        id="nombre"
                        value={planificadorEstado.nombre || ""}
                        placeholder={intl.formatMessage({ id: "Nombre del estado del planificador" })}
                        onChange={(e) => setPlanificadorEstado({ ...planificadorEstado, nombre: e.target.value })}
                        className={estadoGuardando && !planificadorEstado.nombre ? "p-invalid" : ""}
                        maxLength={50}
                    />
                </div>
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="activoSn" className="font-bold block">
                        {intl.formatMessage({ id: "Activo" })}
                    </label>
                    <InputSwitch
                        checked={planificadorEstado.activoSn === "S"}
                        onChange={(e) => setPlanificadorEstado({
                            ...planificadorEstado,
                            activoSn: e.value ? "S" : "N",
                        })}
                    />
                </div>
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="finalizadoSn" className="font-bold block">
                        {intl.formatMessage({ id: "Finalizado" })}
                    </label>
                    <InputSwitch
                        checked={planificadorEstado.finalizadoSn === "S"}
                        onChange={(e) => setPlanificadorEstado({
                            ...planificadorEstado,
                            finalizadoSn: e.value ? "S" : "N",
                        })}
                    />
                </div>
            </div>
        </Fieldset>
    );
};

export default EditarDatosPlanificadorEstado;

