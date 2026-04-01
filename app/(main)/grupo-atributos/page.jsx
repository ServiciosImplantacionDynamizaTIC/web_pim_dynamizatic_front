"use client";
import { deleteGrupoAtributo, getGrupoAtributos, getGrupoAtributosCount } from "@/app/api-endpoints/grupo_atributo";
import { getAtributos } from "@/app/api-endpoints/atributo";
import Crud from "../../components/shared/crud";
import EditarGrupoAtributo from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const GrupoAtributo = () => {
    const intl = useIntl();

    const eliminarGrupoAtributoConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { grupoAtributoId: id } } });
        const atributosAsociados = await getAtributos(filtro);
        if (atributosAsociados && atributosAsociados.length > 0) {
            throw new Error(intl.formatMessage({ id: 'No se puede eliminar el grupo de atributos porque tiene atributos asociados' }));
        }
        return await deleteGrupoAtributo(id);
    };

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'orden', header: intl.formatMessage({ id: 'Orden' }), tipo: 'number' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Grupos de Atributos' })}
                getRegistros={getGrupoAtributos}
                getRegistrosCount={getGrupoAtributosCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"GrupoAtributos"}
                editarComponente={<EditarGrupoAtributo />}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                seccion={"GrupoAtributos"}
                columnas={columnas}
                deleteRegistro={eliminarGrupoAtributoConValidacion}
            />
        </div>
    );
};
export default GrupoAtributo;