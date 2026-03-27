"use client";
import React from "react";
import Crud from "../../components/shared/crud";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "../../utility/Utils";
import { deleteCampoDinamico, getCampoDinamico, getCamposDinamicos, getCamposDinamicosCount } from "@/app/api-endpoints/campo_dinamico";
import EditarCampoDinamico from "./editar";
import CamposDinamicosActivos from "@/app/components/shared/CamposDinamicosActivos";

const CamposDinamicos = () => {
    const intl = useIntl();

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "tipoCampo", header: intl.formatMessage({ id: "Tipo" }), tipo: "string" },
        { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
    ];

    const eliminarCampoDinamico = async (idCampoDinamico) => {
        const resultado = await deleteCampoDinamico(idCampoDinamico);
        if (resultado?.statusCode >= 400 || resultado?.sqlMessage || resultado?.error?.sqlMessage) {
            throw new Error(resultado?.sqlMessage || resultado?.error?.sqlMessage || "Error eliminando el registro");
        }
        try {
            const registro = await getCampoDinamico(idCampoDinamico);
            if (registro?.id) {
                throw new Error("No se pudo eliminar el registro porque tiene otros registros relacionados.");
            }
        } catch (error) {
            const status = error?.response?.status;
            if (status !== 404) {
                throw error;
            }
        }
        return resultado;
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

            <CamposDinamicosActivos />
        </div>
    );
};

export default CamposDinamicos;
