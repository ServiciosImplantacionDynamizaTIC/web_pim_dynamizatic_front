import { TipoProductoAtributoDetalleControllerApi, settings } from "@/app/api-programa";

const apiTipoProductoAtributoDetalle = new TipoProductoAtributoDetalleControllerApi(settings)

export const getTipoProductoAtributoDetalles = async (filtro) => {
    const { data: dataTipoProductoAtributoDetalles } = await apiTipoProductoAtributoDetalle.tipoProductoAtributoDetalleControllerFind(filtro)
    return dataTipoProductoAtributoDetalles
}

export const getTipoProductoAtributoDetallesCount = async (filtro) => {
    const { data: dataTipoProductoAtributoDetalles } = await apiTipoProductoAtributoDetalle.tipoProductoAtributoDetalleControllerCount(filtro)
    return dataTipoProductoAtributoDetalles
}

export const getTipoProductoAtributoDetalle = async (id) => {
    const { data: dataTipoProductoAtributoDetalle } = await apiTipoProductoAtributoDetalle.tipoProductoAtributoDetalleControllerFindById(id)
    return dataTipoProductoAtributoDetalle
}

export const postTipoProductoAtributoDetalle = async (objTipoProductoAtributoDetalle) => {
    const { data: dataTipoProductoAtributoDetalle } = await apiTipoProductoAtributoDetalle.tipoProductoAtributoDetalleControllerCreate(objTipoProductoAtributoDetalle)
    return dataTipoProductoAtributoDetalle
}

export const deleteTipoProductoAtributoDetalle = async (idTipoProductoAtributoDetalle) => {
    const { data: dataTipoProductoAtributoDetalle } = await apiTipoProductoAtributoDetalle.tipoProductoAtributoDetalleControllerDeleteById(idTipoProductoAtributoDetalle)
    return dataTipoProductoAtributoDetalle
}

export const patchTipoProductoAtributoDetalle = async (idTipoProductoAtributoDetalle, objTipoProductoAtributoDetalle) => {
    const { data: dataTipoProductoAtributoDetalle } = await apiTipoProductoAtributoDetalle.tipoProductoAtributoDetalleControllerUpdateById(idTipoProductoAtributoDetalle, objTipoProductoAtributoDetalle)
    return dataTipoProductoAtributoDetalle
}
