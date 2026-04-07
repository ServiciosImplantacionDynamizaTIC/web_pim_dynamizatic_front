"use client";
import { deleteGrupoCampoDinamico, getGruposCampoDinamicos, getGruposCampoDinamicosCount } from "@/app/api-endpoints/grupo_campo_dinamico";
import { getGrupoCampoDinamicoDetalles } from "@/app/api-endpoints/grupo_campo_dinamico_detalle";
import Crud from "../../components/shared/crud";
import EditarGrupoCampoDinamico from "./editar";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "../../utility/Utils";

const GrupoCampoDinamico = () => {
    const intl = useIntl();

    const eliminarGrupoCampoDinamicoConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { grupoCampoDinamicoId: id } } });
        const camposAsociados = await getGrupoCampoDinamicoDetalles(filtro);
        if (camposAsociados && camposAsociados.length > 0) {
            throw new Error(intl.formatMessage({ id: "No se puede eliminar el grupo de campos dinámicos porque tiene campos asociados" }));
        }
        return await deleteGrupoCampoDinamico(id);
    };

    const columnas = [
        { campo: "nombre", header: intl.formatMessage({ id: "Nombre" }), tipo: "string" },
        { campo: "orden", header: intl.formatMessage({ id: "Orden" }), tipo: "number" },
        { campo: "activoSn", header: intl.formatMessage({ id: "Activo" }), tipo: "booleano" },
    ];

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: "Grupos de Campos dinámicos" })}
                getRegistros={getGruposCampoDinamicos}
                getRegistrosCount={getGruposCampoDinamicosCount}
                botones={["nuevo", "ver", "editar", "eliminar", "descargarCSV"]}
                controlador={"Grupo Campos Dinamicos"}
                editarComponente={<EditarGrupoCampoDinamico />}
                filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId }}
                seccion={"Grupo Campos Dinamicos"}
                columnas={columnas}
                deleteRegistro={eliminarGrupoCampoDinamicoConValidacion}
            />
        </div>
    );
};

export default GrupoCampoDinamico;
