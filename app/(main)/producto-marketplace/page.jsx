"use client";
import { deleteProductoMarketplace, getProductosMarketplace, getProductosMarketplaceCount } from "@/app/api-endpoints/producto_marketplace";
import Crud from "../../components/shared/crud";
import EditarProductoMarketplace from "./editar";
import { useIntl } from 'react-intl'

const ProductoMarketplace = ({ idProducto, estoyEditandoProducto }) => {
    const intl = useIntl();

    const columnas = [
        { campo: 'marketplaceNombre', header: intl.formatMessage({ id: 'Marketplace' }), tipo: 'string' },
        { campo: 'tituloPersonalizado', header: intl.formatMessage({ id: 'Título Personalizado' }), tipo: 'string' },
        { campo: 'descripcionPersonalizada', header: intl.formatMessage({ id: 'Descripción Personalizada' }), tipo: 'string' },
        { campo: 'palabrasClavePersonalizadas', header: intl.formatMessage({ id: 'Palabras Clave Personalizadas' }), tipo: 'string' },
        { campo: 'activoEnMarketplace', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
        // { campo: 'estadoSincronizacion', header: intl.formatMessage({ id: 'Estado Sincronización' }), tipo: 'string' },
        // { campo: 'fechaUltimaSincronizacion', header: intl.formatMessage({ id: 'Última Sincronización' }), tipo: 'string' },
   ]

   const botones = estoyEditandoProducto 
        ? ['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']
        : ['ver', 'descargarCSV'];
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Marketplaces de Productos' })}
                getRegistros={() => getProductosMarketplace(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                getRegistrosCount={() => getProductosMarketplaceCount(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                deleteRegistro={deleteProductoMarketplace}
                botones={botones}
                controlador={"ProductoMarketplace"}
                filtradoBase={idProducto ?  { productoId: idProducto } : {}}
                editarComponente={<EditarProductoMarketplace 
                    idProducto={idProducto}
                    emptyRegistro={{
                        productoId: idProducto,
                        marketplaceId: null,
                        tituloPersonalizado: "",
                        descripcionPersonalizada: "",
                        palabrasClavePersonalizadas: "",
                        activoEnMarketplace: "S",
                        estadoSincronizacion: "pendiente"
                    }} />}
                columnas={columnas}
            />
        </div>
    );
};

export default ProductoMarketplace;