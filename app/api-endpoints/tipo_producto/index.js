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
    const { data: dataTipoProducto } = await apiTipoProducto.tipoProductoControllerDeleteById(idTipoProducto)
    return dataTipoProducto
}

export const patchTipoProducto = async (idTipoProducto, objTipoProducto) => {
    const { data: dataTipoProducto } = await apiTipoProducto.tipoProductoControllerUpdateById(idTipoProducto, objTipoProducto)
    return dataTipoProducto
}