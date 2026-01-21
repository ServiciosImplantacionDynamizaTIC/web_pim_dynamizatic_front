"use client";
import { deleteCategoria, getCategorias, getCategoriasCount } from "@/app/api-endpoints/categoria";
import Crud from "../../components/shared/crud";
import EditarCategoria from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Categoria = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'categoriaPadreNombre', header: intl.formatMessage({ id: 'Categoría Padre' }), tipo: 'number' },
        { campo: 'orden', header: intl.formatMessage({ id: 'Orden' }), tipo: 'number' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Categorías' })}
                getRegistros={getCategorias}
                getRegistrosCount={getCategoriasCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Categorias"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarCategoria />}
                seccion={"Categorias"}
                columnas={columnas}
                deleteRegistro={deleteCategoria}
            />
        </div>
    );
};
export default Categoria;