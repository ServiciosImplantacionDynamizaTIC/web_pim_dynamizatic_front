"use client";
/**
 * page.jsx — Página de Campos Dinámicos (/campos-dinamicos)
 *
 * Punto de entrada del menú "Campos Dinámicos". Renderiza el componente genérico
 * PropiedadCrud pasando tipoDePropiedad="campo_dinamico", lo que hace que:
 *   - Se muestren y gestionen únicamente registros de tipo 'campo_dinamico'
 *   - El título sea "Campos Dinámicos"
 *   - Los grupos disponibles en el formulario sean solo de tipo 'grupo_campos_dinamicos'
 *   - Al crear/editar, se guarde tipoDePropiedad="campo_dinamico" en la BD
 *
 * Reutiliza exactamente el mismo código que la página de Atributos;
 * la diferencia es únicamente el parámetro tipoDePropiedad.
 */
import PropiedadCrud from "../propiedades/PropiedadCrud";

const CamposDinamicosPage = () => {
    return <PropiedadCrud tipoDePropiedad="campo_dinamico" />;
};

export default CamposDinamicosPage;
