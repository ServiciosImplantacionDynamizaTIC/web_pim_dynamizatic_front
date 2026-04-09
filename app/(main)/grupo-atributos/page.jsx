"use client";
import { deleteGrupoPropiedad, getGrupoPropiedades, getGrupoPropiedadesCount } from "@/app/api-endpoints/grupo_atributo";
import { gePropiedades } from "@/app/api-endpoints/atributo";
import Crud from "../../components/shared/crud";
import EditarGrupoPropiedad from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const GrupoPropiedad = () => {
    const intl = useIntl();

    const eliminarGrupoPropiedadConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { grupoPropiedadId: id } } });
        const atributosAsociados = await gePropiedades(filtro);
        if (atributosAsociados && atributosAsociados.length > 0) {
            throw new Error(intl.formatMessage({ id: 'No se puede eliminar el grupo de propiedades porque tiene propiedades asociados' }));
        }
        return await deleteGrupoPropiedad(id);
    };

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'orden', header: intl.formatMessage({ id: 'Orden' }), tipo: 'number' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Grupos de Propiedades' })}
                getRegistros={getGrupoPropiedades}
                getRegistrosCount={getGrupoPropiedadesCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"GrupoPropiedades"}
                editarComponente={<EditarGrupoPropiedad />}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                seccion={"GrupoPropiedades"}
                columnas={columnas}
                deleteRegistro={eliminarGrupoPropiedadConValidacion}
            />
        </div>
    );
};
export default GrupoPropiedad;