"use client";
/**
 * page.jsx — Página de Grupos de Atributos (/grupos-atributos)
 *
 * Punto de entrada del menú "Grupos de Atributos". Renderiza el componente genérico
 * GrupoPropiedadCrud pasando tipoDeGrupoPropiedad="grupo_atributos", lo que hace que:
 *   - Se muestren y gestionen únicamente grupos de tipo 'grupo_atributos'
 *   - El título sea "Grupos de Atributos"
 *   - Al crear/editar, se guarde tipoDeGrupoPropiedad="grupo_atributos" en la BD
 *   - La validación de eliminación verifique que no haya atributos asociados
 */
import GrupoPropiedadCrud from "../grupo-propiedades/GrupoPropiedadCrud";

const GruposAtributosPage = () => {
    return <GrupoPropiedadCrud tipoDeGrupoPropiedad="grupo_atributos" />;
};

export default GruposAtributosPage;
