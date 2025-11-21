"use client";
import { getVistaTipoArchivoEmpresaSeccionCount, getVistaTipoArchivoEmpresaSeccion, deleteTipoArchivo } from "@/app/api-endpoints/tipo_archivo";
import { getSecciones } from "@/app/api-endpoints/seccion";
import EditarTipoArchivo from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "@/app/utility/Utils";
const TipoArchivo = () => {
    const intl = useIntl();
    const columnas = [

        { campo: 'nombreSeccion', header: intl.formatMessage({ id: 'Seccion' }), tipo: 'foraneo' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Tipos de archivo' })}
                getRegistros={getVistaTipoArchivoEmpresaSeccion}
                getRegistrosCount={getVistaTipoArchivoEmpresaSeccionCount}
                getRegistrosForaneos={{ 'nombreSeccion': getSecciones }}
                botones={['nuevo', 'ver', 'editar', 'descargarCSV']}
                controlador={"Tipos de archivo"}
                filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId }}
                editarComponente={<EditarTipoArchivo />}
                columnas={columnas}
                deleteRegistro={deleteTipoArchivo}
            />
        </div>
    );
};
export default TipoArchivo;