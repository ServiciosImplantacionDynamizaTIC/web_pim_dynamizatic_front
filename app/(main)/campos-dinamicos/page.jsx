"use client";
import React from "react";
import Crud from "../../components/shared/crud";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "../../utility/Utils";
import { deleteCampoDinamico, getCamposDinamicos, getCamposDinamicosCount } from "@/app/api-endpoints/campo_dinamico";
import EditarCampoDinamico from "./editar";

const CamposDinamicos = () => {
    const intl = useIntl();

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "tipoCampo", header: intl.formatMessage({ id: "Tipo" }), tipo: "string" },
        { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
    ];

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: "Campos Dinamicos" })}
                getRegistros={getCamposDinamicos}
                getRegistrosCount={getCamposDinamicosCount}
                botones={["nuevo", "ver", "editar", "eliminar", "descargarCSV"]}
                controlador={"Campos Dinamicos"}
                filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId }}
                editarComponente={<EditarCampoDinamico />}
                seccion={"Campos Dinamicos"}
                columnas={columnas}
                deleteRegistro={deleteCampoDinamico}
            />
        </div>
    );
};

export default CamposDinamicos;
