"use client";
import { deleteTipoUsoMultimedia, getTiposUsoMultimedia, getTiposUsoMultimediaCount } from "@/app/api-endpoints/tipo_uso_multimedia";
import Crud from "../../components/shared/crud";
import EditarTipoUsoMultimedia from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const TipoUsoMultimedia = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
        { campo: 'fechaCreacion', header: intl.formatMessage({ id: 'Fecha Creación' }), tipo: 'fecha' },
        { campo: 'usuarioCreacion', header: intl.formatMessage({ id: 'Usuario Creación' }), tipo: 'string' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Tipos de Uso Multimedia' })}
                getRegistros={getTiposUsoMultimedia}
                getRegistrosCount={getTiposUsoMultimediaCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Tipos de Uso Multimedia"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarTipoUsoMultimedia />}
                columnas={columnas}
                deleteRegistro={deleteTipoUsoMultimedia}
            />
        </div>
    );
};
export default TipoUsoMultimedia;