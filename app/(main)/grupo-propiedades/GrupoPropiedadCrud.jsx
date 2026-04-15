"use client";
/**
 * GrupoPropiedadCrud.jsx — Componente CRUD genérico para grupos de propiedades
 *
 * Este es el segundo de los 2 componentes genéricos del sistema.
 * Sirve tanto para "Grupos de Atributos" como para "Grupos de Campos Dinámicos",
 * que internamente son el mismo modelo (tabla: grupo_propiedad), diferenciados
 * por la columna "tipoDeGrupoPropiedad" (valores: 'grupo_atributos' | 'grupo_campos_dinamicos').
 *
 * Recibe el prop `tipoDeGrupoPropiedad` para saber qué tipo está gestionando y
 * adapta dinámicamente: título, controlador de permisos, mensajes de error
 * y el filtro base enviado a la API.
 *
 * Las páginas que usan este componente son:
 *   - /grupos-atributos         → tipoDeGrupoPropiedad="grupo_atributos"
 *   - /grupos-campos-dinamicos  → tipoDeGrupoPropiedad="grupo_campos_dinamicos"
 *   - /grupo-propiedades        → tipoDeGrupoPropiedad="grupo_atributos"
 */
import { deleteGrupoPropiedad, getGrupoPropiedades, getGrupoPropiedadesCount } from "@/app/api-endpoints/grupo_propiedad";
import { gePropiedades } from "@/app/api-endpoints/propiedad";
import Crud from "../../components/shared/crud";
import EditarGrupoPropiedad from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const GrupoPropiedadCrud = ({ tipoDeGrupoPropiedad = 'grupo_atributos' }) => {
    const intl = useIntl();
    const esGrupoAtributos = tipoDeGrupoPropiedad === 'grupo_atributos';

    const tituloTexto = esGrupoAtributos
        ? intl.formatMessage({ id: 'Grupos de Atributos' })
        : intl.formatMessage({ id: 'Grupos de Campos Dinámicos' });

    // Controlador que se usa para verificar permisos del usuario (debe coincidir con la BD de permisos)
    const controladorTexto = esGrupoAtributos ? 'GruposAtributos' : 'GruposCamposDinamicos';
    const seccionTexto = esGrupoAtributos ? 'GruposAtributos' : 'GruposCamposDinamicos';

    // Tipo de propiedad correspondiente a este grupo, usado al validar eliminación
    const tipoDePropiedad = esGrupoAtributos ? 'atributo' : 'campo_dinamico';

    const mensajeErrorEliminar = esGrupoAtributos
        ? intl.formatMessage({ id: 'No se puede eliminar el grupo de atributos porque tiene atributos asociados' })
        : intl.formatMessage({ id: 'No se puede eliminar el grupo de campos dinámicos porque tiene campos dinámicos asociados' });

    // Antes de eliminar, se comprueba que el grupo no tenga propiedades asociadas del tipo correspondiente
    const eliminarGrupoPropiedadConValidacion = async (id) => {
        const filtro = JSON.stringify({ where: { and: { grupoPropiedadId: id, tipoDePropiedad: tipoDePropiedad } } });
        const propiedadesAsociadas = await gePropiedades(filtro);
        if (propiedadesAsociadas && propiedadesAsociadas.length > 0) {
            throw new Error(mensajeErrorEliminar);
        }
        return await deleteGrupoPropiedad(id);
    };

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ];

    return (
        <div>
            {/*
             * filtradoBase: filtra automáticamente por empresaId y tipoDeGrupoPropiedad en todas las consultas
             *   → 'grupo_atributos' muestra solo grupos de atributos
             *   → 'grupo_campos_dinamicos' muestra solo grupos de campos dinámicos
             * editarComponenteParametrosExtra: pasa tipoDeGrupoPropiedad al formulario de edición
             *   → así el formulario sabe qué tipo de grupo está creando/editando y lo guarda en la BD
             */}
            <Crud
                headerCrud={tituloTexto}
                getRegistros={getGrupoPropiedades}
                getRegistrosCount={getGrupoPropiedadesCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={controladorTexto}
                editarComponente={<EditarGrupoPropiedad />}
                editarComponenteParametrosExtra={{ tipoDeGrupoPropiedad: tipoDeGrupoPropiedad }}
                filtradoBase={{ empresaId: getUsuarioSesion()?.empresaId, tipoDeGrupoPropiedad: tipoDeGrupoPropiedad }}
                seccion={seccionTexto}
                columnas={columnas}
                deleteRegistro={eliminarGrupoPropiedadConValidacion}
            />
        </div>
    );
};

export default GrupoPropiedadCrud;
