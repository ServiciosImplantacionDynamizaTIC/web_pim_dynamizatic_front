"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import {
  getGrupoCampoDinamico,
  getGruposCampoDinamicos,
  postGrupoCampoDinamico,
  patchGrupoCampoDinamico,
} from "@/app/api-endpoints/grupo_campo_dinamico";
import EditarDatosGrupoCampoDinamico from "./EditarDatosGrupoCampoDinamico";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarGrupoCampoDinamico = ({
  idEditar,
  setIdEditar,
  rowData,
  emptyRegistro,
  setRegistroResult,
  listaTipoArchivos,
  seccion,
  editable,
}) => {
  const intl = useIntl();
  const toast = useRef(null);

  const [grupoCampoDinamico, setGrupoCampoDinamico] = useState(
    emptyRegistro || {
      nombre: "",
      descripcion: "",
      orden: 0,
      activoSn: "S",
    }
  );
  const [estadoGuardando, setEstadoGuardando] = useState(false);
  const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (idEditar !== 0) {
        const registro = rowData.find((element) => element.id === idEditar);
        setGrupoCampoDinamico(registro);
        setIsEdit(true);
      }
    };
    fetchData();
  }, [idEditar, rowData]);

  const validaciones = async () => {
    const validaNombre =
      grupoCampoDinamico.nombre === undefined ||
      grupoCampoDinamico.nombre === "";
    if (validaNombre) {
      return "campos";
    }

    const nombreGrupo = (grupoCampoDinamico?.nombre || "").trim();
    const empresaActual = getUsuarioSesion()?.empresaId;
    const idActual = Number(idEditar || 0);

    const filtro = JSON.stringify({
      where: {
        and: {
          empresaId: empresaActual,
          nombre: nombreGrupo,
          ...(idActual > 0 ? { id: { neq: idActual } } : {}),
        },
      },
      limit: 10,
    });
    const gruposExistentes = await getGruposCampoDinamicos(filtro);

    const existeDuplicado = (gruposExistentes || []).some((grupo) => {
      const nombreExistente = (grupo?.nombre || "").trim().toLowerCase();
      return nombreExistente === nombreGrupo.toLowerCase();
    });

    if (existeDuplicado) {
      return "duplicado";
    }

    return true;
  };

  const guardarGrupoCampoDinamico = async () => {
    setEstadoGuardando(true);
    setEstadoGuardandoBoton(true);

    const resultadoValidacion = await validaciones();

    if (resultadoValidacion === true) {
      let objGuardar = { ...grupoCampoDinamico };
      const usuarioActual = getUsuarioSesion()?.id;
      objGuardar["orden"] = objGuardar.orden || 0;

      if (idEditar === 0) {
        delete objGuardar.id;
        objGuardar["usuarioCreacion"] = usuarioActual;
        objGuardar["empresaId"] = getUsuarioSesion()?.empresaId;
        if (objGuardar.activoSn === "") {
          objGuardar.activoSn = "S";
        }

        const nuevoRegistro = await postGrupoCampoDinamico(objGuardar);

        if (nuevoRegistro?.id) {
          setRegistroResult("insertado");
          setIdEditar(null);
        } else {
          toast.current?.show({
            severity: "error",
            summary: "ERROR",
            detail: intl.formatMessage({
              id: "Ha ocurrido un error creando el registro",
            }),
            life: 3000,
          });
        }
      } else {
        const grupoCampoDinamicoEditar = {
          id: objGuardar.id,
          nombre: objGuardar.nombre,
          descripcion: objGuardar.descripcion,
          orden: objGuardar.orden || 0,
          activoSn: objGuardar.activoSn || "N",
          usuarioModificacion: usuarioActual,
          empresaId: getUsuarioSesion()?.empresaId,
        };

        await patchGrupoCampoDinamico(objGuardar.id, grupoCampoDinamicoEditar);
        setIdEditar(null);
        setRegistroResult("editado");
      }
    } else {
      let errorMessage = intl.formatMessage({
        id: "Todos los campos obligatorios deben ser rellenados",
      });
      if (resultadoValidacion === "duplicado") {
        errorMessage = intl.formatMessage({
          id: "Ya existe un grupo de campos dinamicos con ese nombre",
        });
      }

      toast.current?.show({
        severity: "error",
        summary: "ERROR",
        detail: errorMessage,
        life: 3000,
      });
    }
    setEstadoGuardandoBoton(false);
    setEstadoGuardando(false);
  };

  const cancelarEdicion = () => {
    setIdEditar(null);
  };

  const header =
    idEditar > 0
      ? editable
        ? intl.formatMessage({ id: "Editar" })
        : intl.formatMessage({ id: "Ver" })
      : intl.formatMessage({ id: "Nuevo" });

  return (
    <div>
      <div className="grid GrupoCampoDinamico">
        <div className="col-12">
          <div className="card">
            <Toast ref={toast} position="top-right" />
            <h2>
              {header}{" "}
              {intl
                .formatMessage({ id: "Grupo de Campos dinamicos" })
                .toLowerCase()}
            </h2>
            <EditarDatosGrupoCampoDinamico
              grupoCampoDinamico={grupoCampoDinamico}
              setGrupoCampoDinamico={setGrupoCampoDinamico}
              listaTipoArchivos={listaTipoArchivos}
              estadoGuardando={estadoGuardando}
              isEdit={isEdit}
            />

            <div className="flex justify-content-end mt-2">
              {editable && (
                <Button
                  label={
                    estadoGuardandoBoton
                      ? `${intl.formatMessage({ id: "Guardando" })}...`
                      : intl.formatMessage({ id: "Guardar" })
                  }
                  icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                  onClick={guardarGrupoCampoDinamico}
                  className="mr-2"
                  disabled={estadoGuardandoBoton}
                />
              )}
              <Button
                label={intl.formatMessage({ id: "Cancelar" })}
                onClick={cancelarEdicion}
                className="p-button-secondary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarGrupoCampoDinamico;
