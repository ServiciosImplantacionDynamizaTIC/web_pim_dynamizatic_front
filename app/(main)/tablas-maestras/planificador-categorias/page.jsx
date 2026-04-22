"use client";

import { deletePlanificadorCategoria, getVistaPlanificadorCategoriaEmpresas, getVistaPlanificadorCategoriaEmpresasCount } from "@/app/api-endpoints/planificador_categoria";
import Crud from "@/app/components/shared/crud";
import EditarPlanificadorCategoria from "./editar";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const PlanificadorCategoriasPage = () => {
    const intl = useIntl();

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "descripcion", header: intl.formatMessage({ id: "Descripcion" }), tipo: "string" },
    ];

    return (
        <Crud
            headerCrud={intl.formatMessage({ id: "Categorías del planificador" })}
            getRegistros={getVistaPlanificadorCategoriaEmpresas}
            getRegistrosCount={getVistaPlanificadorCategoriaEmpresasCount}
            botones={["nuevo", "ver", "editar", "eliminar", "descargarCSV"]}
            controlador={"Categorías del planificador"}
            filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId }}
            editarComponente={<EditarPlanificadorCategoria />}
            columnas={columnas}
            deleteRegistro={deletePlanificadorCategoria}
        />
    );
};

export default PlanificadorCategoriasPage;

