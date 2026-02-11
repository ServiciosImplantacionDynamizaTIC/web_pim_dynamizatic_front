import { TipoProductoMultimediaDetalleControllerApi, settings } from "@/app/api-programa";

const apiTipoProductoMultimediaDetalle = new TipoProductoMultimediaDetalleControllerApi(settings)

export const getTipoProductoMultimediaDetalles = async (filtro) => {
    const { data: dataTipoProductoMultimediaDetalles } = await apiTipoProductoMultimediaDetalle.tipoProductoMultimediaDetalleControllerFind(filtro)
    return dataTipoProductoMultimediaDetalles
}

export const getTipoProductoMultimediaDetallesCount = async (filtro) => {
    const { data: dataTipoProductoMultimediaDetalles } = await apiTipoProductoMultimediaDetalle.tipoProductoMultimediaDetalleControllerCount(filtro)
    return dataTipoProductoMultimediaDetalles
}

export const getTipoProductoMultimediaDetalle = async (id) => {
    const { data: dataTipoProductoMultimediaDetalle } = await apiTipoProductoMultimediaDetalle.tipoProductoMultimediaDetalleControllerFindById(id)
    return dataTipoProductoMultimediaDetalle
}

export const postTipoProductoMultimediaDetalle = async (objTipoProductoMultimediaDetalle) => {
    const { data: dataTipoProductoMultimediaDetalle } = await apiTipoProductoMultimediaDetalle.tipoProductoMultimediaDetalleControllerCreate(objTipoProductoMultimediaDetalle)
    return dataTipoProductoMultimediaDetalle
}

export const deleteTipoProductoMultimediaDetalle = async (idTipoProductoMultimediaDetalle) => {
    const { data: dataTipoProductoMultimediaDetalle } = await apiTipoProductoMultimediaDetalle.tipoProductoMultimediaDetalleControllerDeleteById(idTipoProductoMultimediaDetalle)
    return dataTipoProductoMultimediaDetalle
}

export const patchTipoProductoMultimediaDetalle = async (idTipoProductoMultimediaDetalle, objTipoProductoMultimediaDetalle) => {
    const { data: dataTipoProductoMultimediaDetalle } = await apiTipoProductoMultimediaDetalle.tipoProductoMultimediaDetalleControllerUpdateById(idTipoProductoMultimediaDetalle, objTipoProductoMultimediaDetalle)
    return dataTipoProductoMultimediaDetalle
}
