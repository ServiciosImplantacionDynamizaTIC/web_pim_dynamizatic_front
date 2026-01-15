"use client";
import { deleteCatalogo, getCatalogos, getCatalogosCount } from "@/app/api-endpoints/catalogo";
import Crud from "../../components/shared/crud";
import EditarCatalogo from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Catalogo = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipo', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'estado', header: intl.formatMessage({ id: 'Estado' }), tipo: 'string' },
        { campo: 'fechaPublicacion', header: intl.formatMessage({ id: 'Fecha Publicación' }), tipo: 'fecha' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Catálogos' })}
                getRegistros={getCatalogos}
                getRegistrosCount={getCatalogosCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Catalogos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarCatalogo />}
                seccion={"Catalogos"}
                columnas={columnas}
                deleteRegistro={deleteCatalogo}
            />
        </div>
    );
};
export default Catalogo;