"use client";
/**
 * page.jsx /propiedades
 *
 * Redirige al componente genérico
 * PropiedadCrud con tipoDePropiedad="atributo".
 * Los nuevos puntos de menú usan /atributos y /campos-dinamicos en su lugar.
 */
import PropiedadCrud from "./PropiedadCrud";

const Propiedad = () => {
    return <PropiedadCrud tipoDePropiedad="atributo" />;
};
export default Propiedad;