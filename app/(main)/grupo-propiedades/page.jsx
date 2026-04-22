"use client";
/**
 * page.jsx /grupo-propiedades
 *
 * Redirige al componente genérico
 * GrupoPropiedadCrud con tipoDeGrupoPropiedad="grupo_atributos".
 * Los nuevos puntos de menú usan /grupos-atributos y /grupos-campos-dinamicos en su lugar.
 */
import GrupoPropiedadCrud from "./GrupoPropiedadCrud";

const GrupoPropiedad = () => {
    return <GrupoPropiedadCrud tipoDeGrupoPropiedad="grupo_atributos" />;
};
export default GrupoPropiedad;