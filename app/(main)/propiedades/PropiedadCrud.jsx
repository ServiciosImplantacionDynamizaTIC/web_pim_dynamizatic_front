"use client";
/**
 * PropiedadCrud.jsx — Componente CRUD genérico para propiedades
 *
 * Este es uno de los 2 componentes genéricos del sistema.
 * Sirve tanto para "Atributos" como para "Campos Dinámicos", que internamente
 * son el mismo modelo (tabla: propiedad), diferenciados por la columna
 * "tipoDePropiedad" (valores: 'atributo' | 'campo_dinamico').
 *
 * Recibe el prop `tipoDePropiedad` para saber qué tipo está gestionando y
 * adapta dinámicamente: título, columna de grupo, controlador de permisos,
 * mensajes de error y el filtro base enviado a la API.
 *
 * Las páginas que usan este componente son:
 *   - /atributos          → tipoDePropiedad="atributo"
 *   - /campos-dinamicos   → tipoDePropiedad="campo_dinamico"
 *   - /propiedades        → tipoDePropiedad="atributo"
 */
import { deletePropiedad, gePropiedades, gePropiedadesCount } from "@/app/api-endpoints/propiedad";
import { getProductosPropiedad } from "@/app/api-endpoints/producto_propiedad";
import Crud from "../../components/shared/crud";
import EditarPropiedad from "./editar";
import { useIntl } from 'react-intl'

const PropiedadCrud = ({ tipoDePropiedad = 'atributo' }) => {
    const intl = useIntl();
    const esAtributo = tipoDePropiedad === 'atributo';

    const tituloTexto = esAtributo
        ? intl.formatMessage({ id: 'Atributos' }) 
        : intl.formatMessage({ id: 'Campos Dinámicos' });

    // Controlador que se usa para verificar permisos del usuario (debe coincidir con la BD de permisos)
    const controladorTexto = esAtributo ? 'Atributos' : 'CamposDinamicos';
    const seccionTexto = esAtributo ? 'Atributos' : 'CamposDinamicos';

    const columnaGrupoTitulo = esAtributo
        ? intl.formatMessage({ id: 'Grupo de Atributos' })
        : intl.formatMessage({ id: 'Grupo de Campos Dinámicos' });

    const mensajeErrorEliminar = esAtributo
        ? intl.formatMessage({ id: 'No se puede eliminar el atributo porque tiene valores asignados a un producto' })
        : intl.formatMessage({ id: 'No se puede eliminar el campo dinámico porque tiene valores asignados a un producto' });

    // Antes de eliminar, se comprueba que la propiedad no tenga valores asignados a productos
    const eliminarPropiedadConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { atributoId: id } } });
        const productosPropiedad = await getProductosPropiedad(filtro);
        if (productosPropiedad && productosPropiedad.length > 0) {
            const tieneValor = productosPropiedad.some(productoPropiedad => productoPropiedad.valor !== null && productoPropiedad.valor !== undefined && productoPropiedad.valor !== '');
            if (tieneValor) {
                throw new Error(mensajeErrorEliminar);
            }
        }
        return await deletePropiedad(id);
    };

    const columnas = [
        { campo: 'grupoPropiedadNombre', header: columnaGrupoTitulo, tipo: 'string' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipoDato', header: intl.formatMessage({ id: 'Tipo de Dato' }), tipo: 'string' },
        { campo: 'unidadMedida', header: intl.formatMessage({ id: 'Unidad Medida' }), tipo: 'string' },
        { campo: 'obligatorioSn', header: intl.formatMessage({ id: 'Obligatorio' }), tipo: 'booleano' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ];

    return (
        <div>
            {/*
             * filtradoBase: filtra automáticamente por tipoDePropiedad en todas las consultas
             *   → 'atributo' muestra solo atributos; 'campo_dinamico' muestra solo campos dinámicos
             * editarComponenteParametrosExtra: pasa tipoDePropiedad al formulario de edición
             *   → así el formulario sabe qué tipo de propiedad está creando/editando
             */}
            <Crud
                headerCrud={tituloTexto}
                getRegistros={gePropiedades}
                getRegistrosCount={gePropiedadesCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={controladorTexto}
                filtradoBase={{ tipoDePropiedad: tipoDePropiedad }}
                editarComponente={<EditarPropiedad />}
                editarComponenteParametrosExtra={{ tipoDePropiedad: tipoDePropiedad }}
                seccion={seccionTexto}
                columnas={columnas}
                deleteRegistro={eliminarPropiedadConValidacion}
            />
        </div>
    );
};

export default PropiedadCrud;
