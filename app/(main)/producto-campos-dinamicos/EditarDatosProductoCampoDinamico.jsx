"use client";
import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { postProductoCampoDinamico, patchProductoCampoDinamico } from "@/app/api-endpoints/producto_campo_dinamico";
import GrupoItemsConfigurables from "@/app/components/shared/GrupoItemsConfigurables";

const EditarDatosProductoCampoDinamico = ({
  idProducto = null,
  cargando = false,
  mensajeError = "",
  mensajeErrorGuardado = "",
  gruposDefinidos = [],
  valoresCampos = {},
  setValoresCampos = () => {},
  onActualizarOrdenGrupo = () => {},
  onGuardarCamposListo = () => {},
  guardando = false,
  estoyEditandoProducto = false,
}) => {
  const intl = useIntl();
  const [mensajeErrorGuardadoLocal, setMensajeErrorGuardadoLocal] = useState("");
  const [estadoGuardandoCampos, setEstadoGuardandoCampos] = useState(false);

  const convertirValorInputAValorBaseDatos = (campo, valorInput) => {
    const tipoCampo = `${campo?.tipoCampoNormalizado || ""}`.toLowerCase();
    const esMultiSelect =
      tipoCampo === "multiselect" || campo?.opcionesConfiguradas?.multiselectSn === "S";

    if (tipoCampo === "numero") {
      if (valorInput === null || valorInput === undefined || valorInput === "") {
        return null;
      }
      return `${valorInput}`;
    }

    if (tipoCampo === "fecha") {
      if (!valorInput) {
        return null;
      }

      if (valorInput instanceof Date) {
        return valorInput.toISOString().split("T")[0];
      }

      return `${valorInput}`;
    }

    if (esMultiSelect) {
      if (!Array.isArray(valorInput) || !valorInput.length) {
        return null;
      }
      return valorInput.join(", ");
    }

    if (valorInput === null || valorInput === undefined) {
      return null;
    }

    const texto = `${valorInput}`.trim();
    return texto ? texto : null;
  };

  const guardarCamposDinamicosEnBaseDatos = async () => {
    if (!idProducto) {
      return true;
    }

    setEstadoGuardandoCampos(true);
    setMensajeErrorGuardadoLocal("");

    try {
      const usuarioId = getUsuarioSesion()?.id;
      const idsCamposYaGuardados = new Set();
      const idsNuevosRegistrosPorCampo = {};

      for (const grupo of gruposDefinidos || []) {
        for (const campo of grupo?.campos || []) {
          if (!campo?.id || idsCamposYaGuardados.has(campo.id)) {
            continue;
          }

          idsCamposYaGuardados.add(campo.id);

          const valorActualCampo = valoresCampos[campo.id] || {};
          const valorBaseDatos = convertirValorInputAValorBaseDatos(campo, valorActualCampo?.valor);

          const payload = {
            productoId: idProducto,
            campoDinamicoId: campo.id,
            valor: valorBaseDatos,
          };

          if (valorActualCampo?.id) {
            await patchProductoCampoDinamico(valorActualCampo.id, {
              ...payload,
              usuarioModificacion: usuarioId,
            });
          } else if (valorBaseDatos !== null) {
            const nuevoRegistro = await postProductoCampoDinamico({
              ...payload,
              usuarioCreacion: usuarioId,
            });

            if (nuevoRegistro?.id) {
              idsNuevosRegistrosPorCampo[campo.id] = nuevoRegistro.id;
            }
          }
        }
      }

      if (Object.keys(idsNuevosRegistrosPorCampo).length) {
        setValoresCampos((valoresActuales) => {
          const nuevosValores = { ...valoresActuales };

          Object.keys(idsNuevosRegistrosPorCampo).forEach((idCampoTexto) => {
            const idCampo = Number(idCampoTexto);
            nuevosValores[idCampo] = {
              ...(nuevosValores[idCampo] || {}),
              id: idsNuevosRegistrosPorCampo[idCampo],
            };
          });

          return nuevosValores;
        });
      }

      return true;
    } catch (error) {
      console.error("Error guardando campos dinamicos:", error);
      setMensajeErrorGuardadoLocal(
        intl.formatMessage({ id: "Error al guardar los campos dinamicos" })
      );
      return false;
    } finally {
      setEstadoGuardandoCampos(false);
    }
  };

  useEffect(() => {
    onGuardarCamposListo(() => guardarCamposDinamicosEnBaseDatos);
    return () => onGuardarCamposListo(null);
  }, [onGuardarCamposListo, idProducto, gruposDefinidos, valoresCampos, intl]);

  const contenido = cargando ? (
    <div className="text-center p-4">
      {intl.formatMessage({ id: "Cargando campos dinamicos" })}...
    </div>
  ) : (
    <div>
      {mensajeError && (
        <div className="mb-3 p-2 border-round surface-100 text-red-500">{mensajeError}</div>
      )}
      {(mensajeErrorGuardado || mensajeErrorGuardadoLocal) && (
        <div className="mb-3 p-2 border-round surface-100 text-red-500">
          {mensajeErrorGuardado || mensajeErrorGuardadoLocal}
        </div>
      )}
      <GrupoItemsConfigurables
        grupos={gruposDefinidos}
        valoresCampos={valoresCampos}
        setValoresCampos={setValoresCampos}
        onActualizarOrdenGrupo={onActualizarOrdenGrupo}
        guardando={guardando || estadoGuardandoCampos}
        estoyEditandoProducto={estoyEditandoProducto}
      />
    </div>
  );

  return contenido;
};

export default EditarDatosProductoCampoDinamico;