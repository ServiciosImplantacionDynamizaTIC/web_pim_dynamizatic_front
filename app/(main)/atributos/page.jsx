"use client";
import { deletePropiedad, gePropiedades, gePropiedadesCount } from "@/app/api-endpoints/atributo";
import { getProductosPropiedad } from "@/app/api-endpoints/producto_atributo";
import Crud from "../../components/shared/crud";
import EditarPropiedad from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Propiedad = () => {
    const intl = useIntl();

    const eliminarPropiedadConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { atributoId: id } } });
        const productosPropiedad = await getProductosPropiedad(filtro);
        if (productosPropiedad && productosPropiedad.length > 0) {
            const tieneValor = productosPropiedad.some(productoPropiedad => productoPropiedad.valor !== null && productoPropiedad.valor !== undefined && productoPropiedad.valor !== '');
            if (tieneValor) {
                throw new Error(intl.formatMessage({ id: 'No se puede eliminar el atributo porque tiene valores asignados a un producto' }));
            }
        }
        return await deletePropiedad(id);
    };

    const columnas = [
        { campo: 'grupoPropiedadNombre', header: intl.formatMessage({ id: 'Grupo Propiedad' }), tipo: 'string' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipoDato', header: intl.formatMessage({ id: 'Tipo de Dato' }), tipo: 'string' },
        { campo: 'unidadMedida', header: intl.formatMessage({ id: 'Unidad Medida' }), tipo: 'string' },
        { campo: 'obligatorioSn', header: intl.formatMessage({ id: 'Obligatorio' }), tipo: 'booleano' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Propiedades' })}
                getRegistros={gePropiedades}
                getRegistrosCount={gePropiedadesCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Propiedades"}
                // filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarPropiedad />}
                seccion={"Propiedades"}
                columnas={columnas}
                deleteRegistro={eliminarPropiedadConValidacion}
            />
        </div>
    );
};
export default Propiedad;