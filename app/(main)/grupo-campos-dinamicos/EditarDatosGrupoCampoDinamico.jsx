import React from "react";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { useIntl } from "react-intl";

const EditarDatosGrupoCampoDinamico = ({
  grupoCampoDinamico,
  setGrupoCampoDinamico,
  estadoGuardando,
}) => {
  const intl = useIntl();

  const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
    const valor = (e.target && e.target.value) || "";
    let _grupoCampoDinamico = { ...grupoCampoDinamico };
    const esTrue = valor === true ? "S" : "N";
    _grupoCampoDinamico[`${nombreInputSwitch}`] = esTrue;
    setGrupoCampoDinamico(_grupoCampoDinamico);
  };

  return (
    <>
      <Fieldset
        legend={intl.formatMessage({
          id: "Datos del grupo de campos dinamicos",
        })}
      >
        <div className="formgrid grid">
          <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
            <label htmlFor="nombre">
              <b>{intl.formatMessage({ id: "Nombre" })}*</b>
            </label>
            <InputText
              id="nombre"
              value={grupoCampoDinamico.nombre}
              placeholder={intl.formatMessage({
                id: "Nombre del grupo de campos dinamicos",
              })}
              onChange={(e) =>
                setGrupoCampoDinamico({
                  ...grupoCampoDinamico,
                  nombre: e.target.value,
                })
              }
              className={`${
                estadoGuardando && grupoCampoDinamico.nombre === ""
                  ? "p-invalid"
                  : ""
              }`}
              maxLength={150}
              disabled={estadoGuardando}
            />
          </div>

          <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
            <label htmlFor="orden">{intl.formatMessage({ id: "Orden" })}</label>
            <InputNumber
              id="orden"
              value={grupoCampoDinamico.orden || 0}
              placeholder={intl.formatMessage({ id: "Orden de visualizacion" })}
              onValueChange={(e) =>
                setGrupoCampoDinamico({
                  ...grupoCampoDinamico,
                  orden: e.value || 0,
                })
              }
              disabled={estadoGuardando}
              min={0}
              inputStyle={{ textAlign: "right" }}
            />
          </div>

          <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
            <label htmlFor="activo" className="font-bold block">
              {intl.formatMessage({ id: "Activo" })}
            </label>
            <InputSwitch
              id="activo"
              checked={grupoCampoDinamico.activoSn === "S"}
              onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
              disabled={estadoGuardando}
            />
          </div>

          <div className="flex flex-column field gap-2 mt-2 col-12">
            <label htmlFor="descripcion">
              {intl.formatMessage({ id: "Descripcion" })}
            </label>
            <InputTextarea
              id="descripcion"
              value={grupoCampoDinamico.descripcion || ""}
              placeholder={intl.formatMessage({
                id: "Descripcion del grupo de campos dinamicos",
              })}
              onChange={(e) =>
                setGrupoCampoDinamico({
                  ...grupoCampoDinamico,
                  descripcion: e.target.value,
                })
              }
              rows={3}
              disabled={estadoGuardando}
            />
          </div>
        </div>
      </Fieldset>
    </>
  );
};

export default EditarDatosGrupoCampoDinamico;
