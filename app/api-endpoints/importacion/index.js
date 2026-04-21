import { ImportacionExportacionControllerApi, settings } from "@/app/api-programa";

const apiImportacion = new ImportacionExportacionControllerApi(settings);

// Pide al backend los desplegables que necesita esa tabla.
export const getForeignKeysImportacion = async (tabla) => {
    const { data } = await apiImportacion.importacionExportacionControllerObtenerForeignKeysTabla(tabla);
    return data;
};

// Manda el fichero completo y las respuestas del formulario al backend.
export const postImportarTabla = async (
    tabla,
    file,
    respuestas = {},
    tipoImportacion = 'insertar',
    fechaInicioImportacion
) => {
    const { data } = await apiImportacion.importacionExportacionControllerImportarTabla(
        tabla,
        file,
        JSON.stringify(respuestas),
        tipoImportacion,
        fechaInicioImportacion,
    );

    return data;
};

// Pide al backend la fecha de inicio que se usará como marca de la importación.
export const getInicioImportacion = async (tabla) => {
    // Backend genera la fecha exacta que luego se guardará en fechaCreacion o fechaModificacion.
    const { data } = await apiImportacion.importacionExportacionControllerObtenerInicioImportacion(tabla);
    return data;
};

// Consulta cuántos registros lleva ya guardados el backend para calcular el progreso real.
export const getProgresoImportacion = async (tabla, fechaInicioImportacion, tipoImportacion) => {
    // Backend cuenta los registros ya guardados por ese usuario con esa fecha de inicio.
    const { data } = await apiImportacion.importacionExportacionControllerObtenerProgresoImportacion(
        tabla,
        fechaInicioImportacion,
        tipoImportacion,
    );

    return data;
};

// Descarga la plantilla de inserción sin montar columnas en frontend.
export const descargarPlantillaInsertarImportacion = async (tabla) => {
    const { data } = await apiImportacion.importacionExportacionControllerDescargarPlantillaInsertarTabla(tabla, {
        responseType: 'blob',
    });

    descargarArchivo(data, `${tabla}_insertar.csv`);
};

// Descarga todos los registros exportables de la tabla.
export const descargarTodoImportacion = async (tabla) => {
    const { data } = await apiImportacion.importacionExportacionControllerDescargarTodoTabla(tabla, {
        responseType: 'blob',
    });

    descargarArchivo(data, `${tabla}_todo.csv`);
};

// Descarga un CSV construido en frontend a partir del contenido que devuelve backend.
export const descargarErroresImportacion = (contenido, nombreArchivo = 'errores_importacion.csv') => {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    descargarArchivo(blob, nombreArchivo);
};

// Crea un enlace temporal para disparar la descarga del fichero.
const descargarArchivo = (blob, nombreArchivo) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
