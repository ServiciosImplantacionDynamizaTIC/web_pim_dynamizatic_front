"use client";
import { deleteIcono, getIconos, getIconosCount } from "@/app/api-endpoints/icono";
import Crud from "../../components/shared/crud";
import EditarIcono from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Icono = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'imagen', header: intl.formatMessage({ id: 'Imagen' }), tipo: 'imagen' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipo', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Iconos' })}
                getRegistros={getIconos}
                getRegistrosCount={getIconosCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Iconos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarIcono />}
                seccion={"Iconos"}
                columnas={columnas}
                deleteRegistro={deleteIcono}
            />
        </div>
    );
};
export default Icono;