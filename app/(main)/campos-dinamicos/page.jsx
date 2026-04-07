"use client";
import React from "react";
import Crud from "../../components/shared/crud";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "../../utility/Utils";
import { deleteCampoDinamico, getCamposDinamicos, getCamposDinamicosCount } from "@/app/api-endpoints/campo_dinamico";
import { getProductoCampoDinamicos } from "@/app/api-endpoints/producto_campo_dinamico";
import EditarCampoDinamico from "./editar";

const CamposDinamicos = () => {
    const intl = useIntl();

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "tipoCampo", header: intl.formatMessage({ id: "Tipo" }), tipo: "string" },
        { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
    ];

    const eliminarCampoDinamico = async (idCampoDinamico) => {
        const filtroValores = JSON.stringify({where: { and: {campoDinamicoId: idCampoDinamico}}});
        const valoresCampo = await getProductoCampoDinamicos(filtroValores);
        if (valoresCampo && valoresCampo.length > 0) {
            throw new Error("No se puede eliminar el campo dinamico porque ya tiene valores en productos.");
        }
        return deleteCampoDinamico(idCampoDinamico);
    };

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
                columnas={columnas}
                deleteRegistro={eliminarCampoDinamico}
            />
        </div>
    );
};

export default CamposDinamicos;
