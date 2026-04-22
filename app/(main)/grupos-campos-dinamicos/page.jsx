"use client";
/**
 * page.jsx — Página de Grupos de Campos Dinámicos (/grupos-campos-dinamicos)
 *
 * Punto de entrada del menú "Grupos de Campos Dinámicos". Renderiza el componente genérico
 * GrupoPropiedadCrud pasando tipoDeGrupoPropiedad="grupo_campos_dinamicos", lo que hace que:
 *   - Se muestren y gestionen únicamente grupos de tipo 'grupo_campos_dinamicos'
 *   - El título sea "Grupos de Campos Dinámicos"
 *   - Al crear/editar, se guarde tipoDeGrupoPropiedad="grupo_campos_dinamicos" en la BD
 *   - La validación de eliminación verifique lo que no haya campos dinámicos asociados
 *
 * Reutiliza exactamente el mismo código que la página de Grupos de Atributos;
 * la diferencia es únicamente el parámetro tipoDeGrupoPropiedad.
 */
import GrupoPropiedadCrud from "../grupo-propiedades/GrupoPropiedadCrud";

const GruposCamposDinamicosPage = () => {
    return <GrupoPropiedadCrud tipoDeGrupoPropiedad="grupo_campos_dinamicos" />;
};

export default GruposCamposDinamicosPage;
