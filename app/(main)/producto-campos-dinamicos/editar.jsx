"use client";
import React, { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { deleteProductoGrupoCampoDinamico, getProductosGrupoCampoDinamico, postProductoGrupoCampoDinamico } from "@/app/api-endpoints/producto_grupo_campo_dinamico";
import { getCamposDinamicosPorGruposProductoAgrupado } from "@/app/api-endpoints/producto_campos_dinamicos_grupos";
import EditarDatosProductoCampoDinamico from "./EditarDatosProductoCampoDinamico";

const EditarProductoCampoDinamico = ({
  idProducto,
  idsGruposSeleccionadosExternos = [],
  registrarGuardadoGrupos = true,
  mostrarCampos = true,
  onGuardarGruposListo = () => {},
  onGuardarCamposListo = () => {},
  estoyEditandoProducto = false,
}) => {
  const intl = useIntl();
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [gruposDefinidos, setGruposDefinidos] = useState([]);
  const [valoresCampos, setValoresCampos] = useState({});

  // Devuelve ids unicos normalizados a numero, quitando nulos y vacios.
  const obtenerIdsUnicos = (lista = []) =>
    Array.from(
      new Set(
        (lista || [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

  // Lee el json de opciones del campo dinamico.
  const leerOpciones = (opcionesCrudas) => {
    try {
      const opciones =
        typeof opcionesCrudas === "string"
          ? JSON.parse(opcionesCrudas || "{}")
          : opcionesCrudas || {};
      return {
        multiselectSn: opciones?.multiselectSn || "N",
        valores: Array.isArray(opciones?.valores) ? opciones.valores : [],
      };
    } catch (_error) {
      return { multiselectSn: "N", valores: [] };
    }
  };

  // Convierte el valor de base de datos al valor que usa el input.
  const valorBdAInput = (campo, valorBd) => {
    const tipo = `${campo?.tipoCampoNormalizado || ""}`.toLowerCase();
    const esMulti = tipo === "multiselect" || campo?.opcionesConfiguradas?.multiselectSn === "S";

    if (tipo === "numero") {
      if (valorBd === null || valorBd === undefined || valorBd === "") return null;
      const numero = Number(valorBd);
      return Number.isNaN(numero) ? null : numero;
    }
    if (tipo === "fecha") {
      if (!valorBd) return null;
      const fecha = new Date(valorBd);
      return Number.isNaN(fecha.getTime()) ? null : fecha;
    }
    if (esMulti) {
      if (!valorBd) return [];
      return `${valorBd}`
        .split(",")
        .map((valor) => valor.trim())
        .filter((valor) => valor);
    }
    return valorBd ?? "";
  };

  // Registra callback para guardar grupos al pulsar Guardar producto.
  useEffect(() => {
    if (!registrarGuardadoGrupos) {
      return undefined;
    }

    // Guarda en bd las relaciones de grupos seleccionados para el producto.
    const guardarGrupos = async (idProductoGuardar, usuarioActual, idsSeleccionadosForzados = null) => {
      if (!idProductoGuardar) return true;

      const idsSeleccionados = obtenerIdsUnicos(
        idsSeleccionadosForzados ?? idsGruposSeleccionadosExternos
      );

      const relacionesActuales = await getProductosGrupoCampoDinamico(
        JSON.stringify({
          where: { and: { productoId: idProductoGuardar } },
          order: ["id ASC"]
        })
      );

      const mapaRelacionPorGrupo = {};
      (relacionesActuales || []).forEach((registro) => {
        const idGrupo = registro?.grupoCampoDinamicoId ?? registro?.grupo_campo_dinamico_id;
        if (idGrupo && !mapaRelacionPorGrupo[idGrupo]) {
          mapaRelacionPorGrupo[idGrupo] = registro;
        }
      });

      for (let index = 0; index < idsSeleccionados.length; index += 1) {
        const idGrupo = idsSeleccionados[index];
        const relacionExistente = mapaRelacionPorGrupo[idGrupo];

        if (!relacionExistente?.id) {
          await postProductoGrupoCampoDinamico({
            productoId: idProductoGuardar,
            grupoCampoDinamicoId: idGrupo,
            usuarioCreacion: usuarioActual,
          });
        }
      }

      for (const registro of relacionesActuales || []) {
        const idGrupo = registro?.grupoCampoDinamicoId ?? registro?.grupo_campo_dinamico_id;
        if (!idGrupo || idsSeleccionados.includes(idGrupo)) continue;

        await deleteProductoGrupoCampoDinamico(registro.id);
      }

      return true;
    };

    onGuardarGruposListo(() => guardarGrupos);
    return () => onGuardarGruposListo(null);
  }, [idsGruposSeleccionadosExternos, gruposDefinidos, onGuardarGruposListo, registrarGuardadoGrupos]);

  // Carga campos dinamicos solo de los grupos seleccionados/asociados al producto.
  useEffect(() => {
    // Trae los grupos y campos dinamicos desde la vista de backend.
    const cargarCampos = async () => {
      if (!mostrarCampos) {
        return;
      }

      setCargando(true);
      setMensajeError("");

      try {
        if (!idProducto) {
          setGruposDefinidos([]);
          setValoresCampos({});
          return;
        }

        const idsGruposFiltrar = obtenerIdsUnicos(idsGruposSeleccionadosExternos);
        if (!idsGruposFiltrar.length) {
          setGruposDefinidos([]);
          setValoresCampos({});
          return;
        }

        const respuesta = await getCamposDinamicosPorGruposProductoAgrupado(
          Number(idProducto),
          idsGruposFiltrar
        );

        const gruposRecibidos = Array.isArray(respuesta?.grupos) ? respuesta.grupos : [];
        const valoresFormulario = {};

        const gruposFormateados = (gruposRecibidos || []).map((grupo) => ({
          id: Number(grupo?.id || 0),
          nombre: grupo?.nombre || `${grupo?.id || ""}`,
          descripcion: grupo?.descripcion || "",
          ordenGrupoProducto: Number(grupo?.ordenGrupo ?? 0),
          campos: (grupo?.campos || [])
            .filter((campo) => Number(campo?.id || 0) > 0)
            .map((campo) => {
            const campoNormalizado = {
              id: Number(campo?.id || 0),
              nombre: campo?.nombre || "",
              etiqueta: campo?.etiqueta || campo?.nombre || "",
              descripcion: campo?.descripcion || "",
              tipoCampo: campo?.tipoCampo || "texto",
              tipoCampoNormalizado: `${campo?.tipoCampo || "texto"}`.trim().toLowerCase(),
              opciones: campo?.opciones || null,
              opcionesConfiguradas: leerOpciones(campo?.opciones),
              obligatorioSn: campo?.obligatorioSn || "N",
              orden: Number(campo?.ordenCampo ?? 0),
              bloqueado: !!campo?.bloqueado,
            };

            if (!valoresFormulario[campoNormalizado.id]) {
              valoresFormulario[campoNormalizado.id] = {
                id: campo?.valorId ?? null,
                valor: valorBdAInput(campoNormalizado, campo?.valor),
              };
            }

            return campoNormalizado;
          }),
        }));

        setGruposDefinidos(gruposFormateados);
        setValoresCampos(valoresFormulario);
      } catch (error) {
        console.error("Error cargando campos dinamicos:", error);
        setMensajeError(intl.formatMessage({ id: "Error al cargar los datos" }));
        setGruposDefinidos([]);
        setValoresCampos({});
      } finally {
        setCargando(false);
      }
    };

    cargarCampos();
  }, [idProducto, idsGruposSeleccionadosExternos, mostrarCampos]);

  // Actualiza en memoria el orden de un grupo en pantalla.
  const actualizarOrdenGrupoEnMemoria = (idGrupo, nuevoOrden) => {
    setGruposDefinidos((actuales) =>
      [...(actuales || [])].map((grupo) =>
        `${grupo?.id}` === `${idGrupo}`
          ? { ...grupo, ordenGrupoProducto: Number(nuevoOrden || 0) }
          : grupo
      )
    );
  };

  return (
    <div>
      {mostrarCampos && (
        <EditarDatosProductoCampoDinamico
          idProducto={idProducto}
          cargando={cargando}
          mensajeError={mensajeError}
          mensajeErrorGuardado=""
          gruposDefinidos={gruposDefinidos}
          valoresCampos={valoresCampos}
          setValoresCampos={setValoresCampos}
          onActualizarOrdenGrupo={actualizarOrdenGrupoEnMemoria}
          onGuardarCamposListo={onGuardarCamposListo}
          guardando={false}
          estoyEditandoProducto={estoyEditandoProducto}
        />
      )}
    </div>
  );
};

export default EditarProductoCampoDinamico;