"use client";
import {
  deleteGrupoCampoDinamico,
  getGruposCampoDinamicos,
  getGruposCampoDinamicosCount,
} from "@/app/api-endpoints/grupo_campo_dinamico";
import { getGrupoCampoDinamicoDetalles } from "@/app/api-endpoints/grupo_campo_dinamico_detalle";
import Crud from "../../components/shared/crud";
import EditarGrupoCampoDinamico from "./editar";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "../../utility/Utils";

const GrupoCamposDinamicos = () => {
  const intl = useIntl();

  const columnas = [
    { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
    { campo: "orden", header: intl.formatMessage({ id: "Orden" }), tipo: "number" },
    { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
  ];

  const eliminarGrupoCampoDinamico = async (idGrupoCampoDinamico) => {
    const filtroDetalles = JSON.stringify({
      where: {
        and: {
          grupoCampoDinamicoId: idGrupoCampoDinamico,
          activoSn: "S",
        },
      },
      limit: 1,
    });

    const detallesActivos = await getGrupoCampoDinamicoDetalles(filtroDetalles);
    if (detallesActivos?.length > 0) {
      throw new Error("No se puede eliminar el grupo porque tiene campos dinamicos asociados.");
    }

    return deleteGrupoCampoDinamico(idGrupoCampoDinamico);
  };

  return (
    <div>
      <Crud
        headerCrud={intl.formatMessage({ id: "Grupos de Campos dinamicos" })}
        getRegistros={getGruposCampoDinamicos}
        getRegistrosCount={getGruposCampoDinamicosCount}
        botones={["nuevo", "ver", "editar", "eliminar", "descargarCSV"]}
        controlador={"Grupo Campos Dinamicos"}
        editarComponente={<EditarGrupoCampoDinamico />}
        filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId }}
        seccion={"Grupo Campos Dinamicos"}
        columnas={columnas}
        deleteRegistro={eliminarGrupoCampoDinamico}
      />
    </div>
  );
};

export default GrupoCamposDinamicos;
