"use client";
import { deleteIcono, getIconos, getIconosCount } from "@/app/api-endpoints/icono";
import Crud from "../../components/shared/crud";
import EditarIcono from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Icono = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'archivo', header: intl.formatMessage({ id: 'Archivo' }), tipo: 'string' },
        { campo: 'tipo', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Iconos' })}
                getRegistros={getIconos}
                getRegistrosCount={getIconosCount}
                botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Iconos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarIcono />}
                columnas={columnas}
                deleteRegistro={deleteIcono}
            />
        </div>
    );
};
export default Icono;