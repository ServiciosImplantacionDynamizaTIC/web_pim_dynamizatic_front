"use client";

import { deletePlanificadorEstado, getVistaPlanificadorEstadoEmpresa, getVistaPlanificadorEstadoEmpresaCount } from "@/app/api-endpoints/planificador_estado";
import Crud from "@/app/components/shared/crud";
import EditarPlanificadorEstado from "./editar";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const PlanificadorEstadosPage = () => {
    const intl = useIntl();

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
        { campo: "finalizadoSn", header: intl.formatMessage({ id: "Finalizado" }), tipo: "booleano" },
    ];

    return (
        <Crud
            headerCrud={intl.formatMessage({ id: "Estados del planificador" })}
            getRegistros={getVistaPlanificadorEstadoEmpresa}
            getRegistrosCount={getVistaPlanificadorEstadoEmpresaCount}
            botones={["nuevo", "ver", "editar", "eliminar", "descargarCSV"]}
            controlador={"Estados del planificador"}
            filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId }}
            editarComponente={<EditarPlanificadorEstado />}
            columnas={columnas}
            deleteRegistro={deletePlanificadorEstado}
        />
    );
};

export default PlanificadorEstadosPage;

