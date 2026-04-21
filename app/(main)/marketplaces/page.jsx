"use client";
import { deleteMarketplace, getMarketplaces, getMarketplacesCount } from "@/app/api-endpoints/marketplace";
import Crud from "../../components/shared/crud";
import EditarMarketplace from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Marketplace = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipo', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'urlApi', header: intl.formatMessage({ id: 'URL API' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
        { campo: 'ultimaSincronizacion', header: intl.formatMessage({ id: 'Última Sincronización' }), tipo: 'fecha' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Marketplaces' })}
                getRegistros={getMarketplaces}
                getRegistrosCount={getMarketplacesCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Marketplaces"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarMarketplace />}
                seccion={"Marketplaces"}
                columnas={columnas}
                deleteRegistro={deleteMarketplace}
            />
        </div>
    );
};
export default Marketplace;