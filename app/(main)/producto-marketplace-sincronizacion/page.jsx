"use client";
import { deleteProductoMarketplaceSincronizacion, getProductosMarketplaceSincronizacion, getProductosMarketplaceSincronizacionCount } from "@/app/api-endpoints/producto_marketplace_sincronizacion";
import Crud from "../../components/shared/crud";
import EditarProductoMarketplaceSincronizacion from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const ProductoMarketplaceSincronizacion = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'marketplaceNombre', header: intl.formatMessage({ id: 'Marketplace' }), tipo: 'string' },
        { campo: 'estado', header: intl.formatMessage({ id: 'Estado' }), tipo: 'string' },
        { campo: 'fecha', header: intl.formatMessage({ id: 'Fecha' }), tipo: 'datetime' },
        { campo: 'mensaje', header: intl.formatMessage({ id: 'Mensaje' }), tipo: 'string' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Sincronizaciones de Producto Marketplace' })}
                getRegistros={getProductosMarketplaceSincronizacion}
                getRegistrosCount={getProductosMarketplaceSincronizacionCount}
                botones={['ver', 'descargarCSV']}
                controlador={"Logs de sincronización Marketplaces"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarProductoMarketplaceSincronizacion />}
                seccion={"Logs de sincronización Marketplaces"}
                columnas={columnas}
                deleteRegistro={deleteProductoMarketplaceSincronizacion}
            />
        </div>
    );
};
export default ProductoMarketplaceSincronizacion;