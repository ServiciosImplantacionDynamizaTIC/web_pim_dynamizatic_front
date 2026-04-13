import { ImportacionExportacionControllerApi, settings } from "@/app/api-programa";

const apiImportacion = new ImportacionExportacionControllerApi(settings);

// Pide al backend los desplegables que necesita esa tabla.
export const getForeignKeysImportacion = async (tabla) => {
    const { data } = await apiImportacion.importacionExportacionControllerObtenerForeignKeysTabla(tabla);
    return data;
};

// Manda el fichero completo y las respuestas del formulario al backend.
export const postImportarTabla = async (tabla, file, respuestas = {}) => {
    // Las respuestas viajan como JSON para no depender de campos fijos por tabla.
    const respuestasSerializadas = JSON.stringify(respuestas);
    const { data } = await apiImportacion.importacionExportacionControllerImportarTabla(tabla, file, respuestasSerializadas);
    return data;
};

// Descarga la plantilla para insertar o actualizar sin montar columnas en frontend.
export const descargarPlantillaImportacion = async (tabla, tipo) => {
    const { data } = await apiImportacion.importacionExportacionControllerDescargarPlantillaTabla(tabla, tipo, {
        responseType: 'blob',
    });

    descargarArchivo(data, `${tabla}_${tipo}.csv`);
};

// Descarga todos los registros exportables de la tabla.
export const descargarTodoImportacion = async (tabla) => {
    const { data } = await apiImportacion.importacionExportacionControllerDescargarTodoTabla(tabla, {
        responseType: 'blob',
    });

    descargarArchivo(data, `${tabla}_todo.csv`);
};


const descargarArchivo = (blob, nombreArchivo) => {
    // Se crea un enlace temporal para disparar la descarga del fichero.
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
