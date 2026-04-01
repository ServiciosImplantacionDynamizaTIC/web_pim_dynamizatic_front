"use client";
import { deleteAtributo, getAtributos, getAtributosCount } from "@/app/api-endpoints/atributo";
import { getProductosAtributo } from "@/app/api-endpoints/producto_atributo";
import Crud from "../../components/shared/crud";
import EditarAtributo from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Atributo = () => {
    const intl = useIntl();

    const eliminarAtributoConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { atributoId: id } } });
        const productosAtributo = await getProductosAtributo(filtro);
        if (productosAtributo && productosAtributo.length > 0) {
            const tieneValor = productosAtributo.some(productoAtributo => productoAtributo.valor !== null && productoAtributo.valor !== undefined && productoAtributo.valor !== '');
            if (tieneValor) {
                throw new Error(intl.formatMessage({ id: 'No se puede eliminar el atributo porque tiene valores asignados a un producto' }));
            }
        }
        return await deleteAtributo(id);
    };

    const columnas = [
        { campo: 'grupoAtributoNombre', header: intl.formatMessage({ id: 'Grupo Atributo' }), tipo: 'string' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipoDato', header: intl.formatMessage({ id: 'Tipo de Dato' }), tipo: 'string' },
        { campo: 'unidadMedida', header: intl.formatMessage({ id: 'Unidad Medida' }), tipo: 'string' },
        { campo: 'obligatorioSn', header: intl.formatMessage({ id: 'Obligatorio' }), tipo: 'booleano' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Atributos' })}
                getRegistros={getAtributos}
                getRegistrosCount={getAtributosCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Atributos"}
                // filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarAtributo />}
                seccion={"Atributos"}
                columnas={columnas}
                deleteRegistro={eliminarAtributoConValidacion}
            />
        </div>
    );
};
export default Atributo;