import { FileUploadControllerApi, settings } from "@/app/api-programa";

const apiFileUpload = new FileUploadControllerApi(settings)

export const postSubirImagen = async (ruta, nombre, imagen) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerImageUpload(ruta, nombre, imagen)
    return dataFichero
}

export const postSubirAvatar = async (ruta, nombre, imagen) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerAvatarUpload(ruta, nombre, imagen)
    return dataFichero
}

export const postSubirFichero = async (ruta, nombre, imagen) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerFileUpload(ruta, nombre, imagen)
    return dataFichero
}

export const borrarFichero = async (imagenUrl) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerDeleteFileByName(imagenUrl)
    return dataFichero
}

export const borrarCarpeta = async (carpetaUrl) => {
    const { data: dataFichero } = await apiFileUpload.fileUploadControllerDeleteFolderByName(carpetaUrl)
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