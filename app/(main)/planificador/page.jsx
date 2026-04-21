"use client";

import { deletePlanificador, getPlanificadores, getPlanificadoresCount } from "@/app/api-endpoints/planificador";
import Crud from "@/app/components/shared/crud";
import EditarPlanificador from "./editar";
import { useIntl } from "react-intl";

const PlanificadorPage = () => {
    const intl = useIntl();

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
    ];

    return (
        <Crud
            headerCrud={intl.formatMessage({ id: "Gestor de proyectos" })}
            getRegistros={getPlanificadores}
            getRegistrosCount={getPlanificadoresCount}
            botones={["nuevo", "ver", "editar", "eliminar", "descargarCSV"]}
            controlador={"Gestor de proyectos"}
            filtradoBase={{ empresaId: Number(localStorage.getItem("empresa")) }}
            editarComponente={<EditarPlanificador />}
            columnas={columnas}
            deleteRegistro={deletePlanificador}
        />
    );
};

export default PlanificadorPage;

