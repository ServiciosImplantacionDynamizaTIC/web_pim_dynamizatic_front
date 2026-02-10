"use client";
import { deleteProductoMultimedia, getProductosMultimedia, getProductosMultimediaCount } from "@/app/api-endpoints/producto_multimedia";
import Crud from "../../components/shared/crud";
import EditarProductoMultimedia from "./editar";
import { useIntl } from 'react-intl'

const ProductoMultimedia = ({ idProducto, estoyEditandoProducto }) => {
    const intl = useIntl();

    const columnas = [
        { campo: 'orden', header: intl.formatMessage({ id: 'Orden' }), tipo: 'numero' },
        { campo: 'tipoUso', header: intl.formatMessage({ id: 'Tipo de Uso' }), tipo: 'string' },
        { campo: 'esPrincipal', header: intl.formatMessage({ id: 'Principal' }), tipo: 'boolean' },
        { campo: 'multimediaNombre', header: intl.formatMessage({ id: 'Archivo' }), tipo: 'string' },
   ]

   // 
   // Si estoy editando el producto muestro todos los botones (manteniendo permisos). Pero si solo estoy viendo el producto, limito los botones a ver y descargarCSV
   //
    const botones = estoyEditandoProducto 
        ? ['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']
        : ['ver', 'descargarCSV'];
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Multimedia de Productos' })}
                getRegistros={() => getProductosMultimedia(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                getRegistrosCount={() => getProductosMultimediaCount(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                deleteRegistro={deleteProductoMultimedia}
                botones={botones}
                controlador={"Multimedia de Productos"}
                filtradoBase={idProducto ?  { productoId: idProducto } : {}}
                editarComponente={<EditarProductoMultimedia 
                    idProducto={idProducto}
                    emptyRegistro={{
                        productoId: idProducto,
                        multimediaId: null,
                        tipoUso: "galeria",
                        esPrincipal: "N",
                        orden: 0
                    }} />}
                columnas={columnas}
            />
        </div>
    );
};

export default ProductoMultimedia;