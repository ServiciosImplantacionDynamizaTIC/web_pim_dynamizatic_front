"use client";
import { deleteProductoAtributo, getProductosAtributo, getProductosAtributoCount } from "@/app/api-endpoints/producto_atributo";
import Crud from "../../components/shared/crud";
import EditarProductoAtributo from "./editar";
import { useIntl } from 'react-intl'

const ProductoAtributo = ({ idProducto, estoyEditandoProducto }) => {
    const intl = useIntl();

    const columnas = [
        { campo: 'ordenEnGrupo', header: intl.formatMessage({ id: 'Orden' }), tipo: 'numero' },
        { campo: 'atributoNombre', header: intl.formatMessage({ id: 'Atributo' }), tipo: 'string' },
        { campo: 'valor', header: intl.formatMessage({ id: 'Valor' }), tipo: 'string' },
        { campo: 'unidad', header: intl.formatMessage({ id: 'Unidad' }), tipo: 'string' },
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
                headerCrud={intl.formatMessage({ id: 'Atributos de Productos' })}
                getRegistros={() => getProductosAtributo(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                getRegistrosCount={() => getProductosAtributoCount(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                deleteRegistro={deleteProductoAtributo}
                botones={botones}
                controlador={"Atributos de Productos"}
                filtradoBase={idProducto ?  { productoId: idProducto } : {}}
                editarComponente={<EditarProductoAtributo 
                    idProducto={idProducto}
                    emptyRegistro={{
                        productoId: idProducto,
                        atributoId: null,
                        valor: "",
                        unidad: "",
                        ordenEnGrupo: 0
                    }} />}
                columnas={columnas}
            />
        </div>
    );
};

export default ProductoAtributo;