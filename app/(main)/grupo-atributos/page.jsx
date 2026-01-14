"use client";
import { deleteGrupoAtributo, getGrupoAtributos, getGrupoAtributosCount } from "@/app/api-endpoints/grupo_atributo";
import Crud from "../../components/shared/crud";
import EditarGrupoAtributo from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const GrupoAtributo = () => {
    const intl = useIntl();

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
                botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"GrupoAtributos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                columnas={columnas}
                deleteRegistro={deleteGrupoAtributo}
            />
        </div>
    );
};
export default GrupoAtributo;