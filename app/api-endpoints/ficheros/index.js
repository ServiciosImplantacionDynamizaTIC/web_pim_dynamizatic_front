import { FileUploadControllerApi, settings } from "@/app/api-programa";

const apiFileUpload = new FileUploadControllerApi(settings)

// Las rutas con '/' se sustituyen por '|' para evitar que el router del back
// las interprete como segmentos de URL distintos (Express decodifica %2F → /)
const codificarRuta = (ruta) => ruta.replace(/\//g, '|');

export const postSubirImagen = async (ruta, nombre, imagen) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerImageUpload(codificarRuta(ruta), nombre, imagen)
    return dataFichero
}

export const postSubirAvatar = async (ruta, nombre, imagen) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerAvatarUpload(codificarRuta(ruta), nombre, imagen)
    return dataFichero
}

export const postSubirFichero = async (ruta, nombre, imagen) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerFileUpload(codificarRuta(ruta), nombre, imagen)
    return dataFichero
}

export const borrarFichero = async (imagenUrl) => {
    //
    //Evito que se borre el fichero de imagen-no-disponible
    //
    if(imagenUrl.indexOf('imagen-no-disponible') === -1){
        const { data: dataFichero } = await apiFileUpload.fileUploadControllerDeleteFileByName(codificarRuta(imagenUrl))
        return dataFichero
    }
}

export const borrarCarpeta = async (carpetaUrl) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerDeleteFolderByName(codificarRuta(carpetaUrl))
    return dataFichero
}

export const deleteArchivoEmpresaPorTablaId = async (parametrosArchivo) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerDeleteFileByTableId(
        parametrosArchivo.empresaId, 
        parametrosArchivo.tabla, 
        parametrosArchivo.tablaId
    )
    return dataFichero
}