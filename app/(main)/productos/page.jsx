"use client";
import { deleteProducto, getProductos, getProductosCount } from "@/app/api-endpoints/producto";
import Crud from "../../components/shared/crud";
import EditarProducto from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Producto = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'imagenPrincipal', header: intl.formatMessage({ id: 'Imagen' }), tipo: 'imagen' },
        { campo: 'sku', header: intl.formatMessage({ id: 'SKU' }), tipo: 'string' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'MarcaNombre', header: intl.formatMessage({ id: 'Marca' }), tipo: 'string' },
        { campo: 'EstadoNombre', header: intl.formatMessage({ id: 'Estado' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Productos' })}
                getRegistros={getProductos}
                getRegistrosCount={getProductosCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Productos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarProducto />}
                seccion={"Productos"}
                columnas={columnas}
                deleteRegistro={deleteProducto}
            />
        </div>
    );
};
export default Producto;