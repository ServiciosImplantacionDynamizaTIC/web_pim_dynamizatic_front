"use client";
import { deleteMultimedia, getMultimedias, getMultimediasCount } from "@/app/api-endpoints/multimedia";
import Crud from "../../components/shared/crud";
import EditarMultimedia from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Multimedia = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'tipo', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'categoriaNombre', header: intl.formatMessage({ id: 'Categoría' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ];
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Multimedia' })}
                getRegistros={getMultimedias}
                getRegistrosCount={getMultimediasCount}
                botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Multimedia"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarMultimedia />}
                columnas={columnas}
                deleteRegistro={deleteMultimedia}
            />
        </div>
    );
};
export default Multimedia;