"use client";
import React from "react";
import { useIntl } from "react-intl";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";

// Componente visual unico para pintar grupos y campos dinamicos.
const GrupoItemsConfigurables = ({
  grupos = [],
  valoresCampos = {},
  setValoresCampos = () => {},
  onActualizarOrdenGrupo = () => {},
  onActualizarOrdenCampoItem = () => {},
  guardando = false,
  estoyEditandoProducto = false,
  titulo,
  mensajeVacio,
}) => {
  const intl = useIntl();

  const tituloCard = titulo || intl.formatMessage({ id: "Campos dinamicos del Producto" });
  const textoVacio =
    mensajeVacio || intl.formatMessage({ id: "No hay grupos de campos dinamicos seleccionados" });

  const actualizarValorCampo = (campoId, valorNuevo) => {
    setValoresCampos((prev) => ({
      ...prev,
      [campoId]: {
        ...prev[campoId],
        valor: valorNuevo,
      },
    }));
  };

  const actualizarOrdenCampo = (grupoId, campoId, ordenNuevo) => {
    onActualizarOrdenCampoItem(grupoId, campoId, ordenNuevo);
  };

  const renderizarInputCampo = (campo) => {
    const valorActual = valoresCampos[campo.id]?.valor;
    const deshabilitado = !estoyEditandoProducto || guardando || campo.bloqueado;
    const opciones = (campo?.opcionesConfiguradas?.valores || []).map((valor) => ({
      label: valor,
      value: valor,
    }));

    switch (`${campo?.tipoCampoNormalizado || ""}`.toLowerCase()) {
      case "numero":
        return (
          <InputNumber
            value={valorActual ?? null}
            onValueChange={(e) => actualizarValorCampo(campo.id, e.value)}
            disabled={deshabilitado}
            className="w-full"
            inputStyle={{ textAlign: "right" }}
          />
        );

      case "fecha":
        return (
          <Calendar
            value={valorActual || null}
            onChange={(e) => actualizarValorCampo(campo.id, e.value)}
            disabled={deshabilitado}
            dateFormat="dd/mm/yy"
            className="w-full"
          />
        );

      case "multiselect":
        return (
          <MultiSelect
            value={Array.isArray(valorActual) ? valorActual : []}
            options={opciones}
            onChange={(e) => actualizarValorCampo(campo.id, e.value || [])}
            disabled={deshabilitado}
            className="w-full"
            display="chip"
            filter
          />
        );

      case "select":
      case "lista":
      case "radio":
        if (campo?.opcionesConfiguradas?.multiselectSn === "S") {
          return (
            <MultiSelect
              value={Array.isArray(valorActual) ? valorActual : []}
              options={opciones}
              onChange={(e) => actualizarValorCampo(campo.id, e.value || [])}
              disabled={deshabilitado}
              className="w-full"
              display="chip"
              filter
            />
          );
        }

        return (
          <Dropdown
            value={valorActual || null}
            options={opciones}
            onChange={(e) => actualizarValorCampo(campo.id, e.value)}
            disabled={deshabilitado}
            className="w-full"
            showClear
          />
        );

      default:
        return (
          <InputText
            value={valorActual || ""}
            onChange={(e) => actualizarValorCampo(campo.id, e.target.value)}
            disabled={deshabilitado}
            className="w-full"
          />
        );
    }
  };

  if (!(grupos || []).length) {
    return (
      <Card title={tituloCard}>
        <div className="text-center p-4">{textoVacio}</div>
      </Card>
    );
  }

  return (
    <Card title={tituloCard}>
      {(grupos || []).map((grupo, index) => (
        <div key={grupo.id} className="mb-3">
          <Fieldset
            toggleable
            collapsed={index !== 0}
            legend={
              <div className="flex align-items-center">
                <div className="flex flex-column align-items-center">
                  <small className="text-500 font-semibold mb-1">Orden</small>
                  <InputNumber
                    inputId={`ordenGrupo_${grupo.id}`}
                    value={Number(grupo?.ordenGrupoProducto || 0)}
                    onValueChange={(e) => onActualizarOrdenGrupo(grupo.id, e.value || 0)}
                    disabled={!estoyEditandoProducto || guardando}
                    min={0}
                    max={999}
                    inputStyle={{ textAlign: "right", width: "3rem" }}
                    size="small"
                    placeholder="000"
                  />
                </div>
                <span className="mx-3 text-300 text-2xl line-height-1">|</span>
                <span className="font-semibold text-lg">{grupo.nombre}</span>
              </div>
            }
          >
            {!!grupo?.descripcion && (
              <div className="mb-3 text-500 font-medium">{grupo.descripcion}</div>
            )}

            {!grupo?.campos?.length ? (
              <small className="text-500">
                {intl.formatMessage({ id: "No hay campos dinamicos en este grupo" })}
              </small>
            ) : (
              <div className="formgrid grid">
                {[...(grupo.campos || [])]
                  .sort((a, b) => {
                    const ordenA = Number(a?.orden || 0);
                    const ordenB = Number(b?.orden || 0);
                    if (ordenA !== ordenB) {
                      return ordenA - ordenB;
                    }
                    return `${a?.etiqueta || a?.nombre || ""}`.localeCompare(
                      `${b?.etiqueta || b?.nombre || ""}`
                    );
                  })
                  .map((campo) => (
                    <div key={`${grupo.id}-${campo.id}`} className="field col-12 md:col-6 lg:col-4">
                      <div className="border-1 surface-border border-round p-3 h-full surface-card">
                        <div className="flex align-items-stretch">
                          <div className="flex flex-column align-items-center mt-2">
                            <small className="text-500 font-semibold mb-1">Orden</small>
                            <InputNumber
                              value={Number(campo?.orden || 0)}
                              onValueChange={(e) =>
                                actualizarOrdenCampo(grupo.id, campo.id, e.value || 0)
                              }
                              disabled={
                                !estoyEditandoProducto ||
                                guardando ||
                                (campo.bloqueado && index !== 0)
                              }
                              min={0}
                              max={999}
                              inputStyle={{ textAlign: "right", width: "3rem" }}
                              size="small"
                              placeholder="000"
                            />
                          </div>

                          <div className="mx-3 border-left-1 surface-border" />

                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <label className="block font-semibold">
                                {campo.obligatorioSn === "S" ? (
                                  <>
                                    {campo.etiqueta || campo.nombre}
                                    <span className="text-red-500 ml-1">*</span>
                                  </>
                                ) : (
                                  `${campo.etiqueta || campo.nombre}`
                                )}
                              </label>
                            </div>

                            <div className="mb-2 w-full">
                              {renderizarInputCampo(campo)}
                            </div>

                            <div className="text-500 text-sm">
                              <b className="mr-1">Descripcion:</b>
                              <span>{campo.descripcion || "-"}</span>
                            </div>

                            {campo.bloqueado && (
                              <small className="block mt-2 text-500">
                                Este campo esta bloqueado porque pertenece a otros grupos.
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Fieldset>
        </div>
      ))}
    </Card>
  );
};

export default GrupoItemsConfigurables;
