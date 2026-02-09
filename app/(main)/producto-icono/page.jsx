"use client";
import { deleteProductoIcono, getProductosIcono, getProductosIconoCount } from "@/app/api-endpoints/producto_icono";
import Crud from "../../components/shared/crud";
import EditarProductoIcono from "./editar";
import { useIntl } from 'react-intl'

const ProductoIcono = ({ idProducto, estoyEditandoProducto }) => {
    const intl = useIntl();

    const columnas = [
        { campo: 'orden', header: intl.formatMessage({ id: 'Orden' }), tipo: 'numero' },
        { campo: 'iconoNombre', header: intl.formatMessage({ id: 'Icono' }), tipo: 'string' },
        { campo: 'textoAsociado', header: intl.formatMessage({ id: 'Texto Asociado' }), tipo: 'string' },
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
                headerCrud={intl.formatMessage({ id: 'Iconos de Productos' })}
                getRegistros={() => getProductosIcono(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                getRegistrosCount={() => getProductosIconoCount(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                deleteRegistro={deleteProductoIcono}
                botones={botones}
                controlador={"ProductoIcono"}
                filtradoBase={idProducto ?  { productoId: idProducto } : {}}
                editarComponente={<EditarProductoIcono 
                    idProducto={idProducto}
                    emptyRegistro={{
                        productoId: idProducto,
                        iconoId: null,
                        textoAsociado: "",
                        orden: 0
                    }} />}
                columnas={columnas}
            />
        </div>
    );
};

export default ProductoIcono;