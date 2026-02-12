import { TipoProductoControllerApi, settings } from "@/app/api-programa";

const apiTipoProducto = new TipoProductoControllerApi(settings)

export const getTiposProducto = async (filtro) => {
    const { data: dataTiposProducto } = await apiTipoProducto.tipoProductoControllerFind(filtro)
    return dataTiposProducto
}

export const getTiposProductoCount = async (filtro) => {
    const { data: dataTiposProducto } = await apiTipoProducto.tipoProductoControllerCount(filtro)
    return dataTiposProducto
}

export const getTipoProducto = async (id) => {
    const { data: dataTipoProducto } = await apiTipoProducto.tipoProductoControllerFindById(id)
    return dataTipoProducto
}

export const postTipoProducto = async (objTipoProducto) => {
    const { data: dataTipoProducto } = await apiTipoProducto.tipoProductoControllerCreate(objTipoProducto)
    return dataTipoProducto
}

export const deleteTipoProducto = async (idTipoProducto) => {
    try {
        const { data: dataTipoProducto } = await apiTipoProducto.tipoProductoControllerDeleteById(idTipoProducto)
        console.log('Respuesta deleteTipoProducto:', dataTipoProducto);
        
        // Verificar si la respuesta contiene un error (cuando el backend devuelve 200 con error)
        if (dataTipoProducto && dataTipoProducto.error) {
            throw new Error(dataTipoProducto.error.message || 'Error al eliminar el registro');
        }
        
        return dataTipoProducto
    } catch (error) {
        // Propagar el error para que el CRUD lo pueda capturar
        console.error('Error en deleteTipoProducto:', error);
        throw error;
    }
}

export const patchTipoProducto = async (idTipoProducto, objTipoProducto) => {
    const { data: dataTipoProducto } = await apiTipoProducto.tipoProductoControllerUpdateById(idTipoProducto, objTipoProducto)
    return dataTipoProducto
}