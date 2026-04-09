"use client";
/**
 * page.jsx — Página de Atributos (/atributos)
 *
 * Punto de entrada del menú "Atributos". Renderiza el componente genérico
 * PropiedadCrud pasando tipoDePropiedad="atributo", lo que hace que:
 *   - Se muestren y gestionen únicamente registros de tipo 'atributo'
 *   - El título sea "Atributos"
 *   - Los grupos disponibles en el formulario sean solo de tipo 'grupo_atributos'
 *   - Al crear/editar, se guarde tipoDePropiedad="atributo" en la BD
 */
import PropiedadCrud from "../propiedades/PropiedadCrud";

const AtributosPage = () => {
    return <PropiedadCrud tipoDePropiedad="atributo" />;
};

export default AtributosPage;
