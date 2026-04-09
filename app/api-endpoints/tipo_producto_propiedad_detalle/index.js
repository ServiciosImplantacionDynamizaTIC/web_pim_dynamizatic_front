import { TipoProductoPropiedadDetalleControllerApi, settings } from "@/app/api-programa";

const apiTipoProductoPropiedadDetalle = new TipoProductoPropiedadDetalleControllerApi(settings)

export const getTipoProductoPropiedadDetalles = async (filtro) => {
    const { data: dataTipoProductoPropiedadDetalles } = await apiTipoProductoPropiedadDetalle.tipoProductoPropiedadDetalleControllerFind(filtro)
    return dataTipoProductoPropiedadDetalles
}

export const getTipoProductoPropiedadDetallesCount = async (filtro) => {
    const { data: dataTipoProductoPropiedadDetalles } = await apiTipoProductoPropiedadDetalle.tipoProductoPropiedadDetalleControllerCount(filtro)
    return dataTipoProductoPropiedadDetalles
}

export const getTipoProductoPropiedadDetalle = async (id) => {
    const { data: dataTipoProductoPropiedadDetalle } = await apiTipoProductoPropiedadDetalle.tipoProductoPropiedadDetalleControllerFindById(id)
    return dataTipoProductoPropiedadDetalle
}

export const postTipoProductoPropiedadDetalle = async (objTipoProductoPropiedadDetalle) => {
    const { data: dataTipoProductoPropiedadDetalle } = await apiTipoProductoPropiedadDetalle.tipoProductoPropiedadDetalleControllerCreate(objTipoProductoPropiedadDetalle)
    return dataTipoProductoPropiedadDetalle
}

export const deleteTipoProductoPropiedadDetalle = async (idTipoProductoPropiedadDetalle) => {
    const { data: dataTipoProductoPropiedadDetalle } = await apiTipoProductoPropiedadDetalle.tipoProductoPropiedadDetalleControllerDeleteById(idTipoProductoPropiedadDetalle)
    return dataTipoProductoPropiedadDetalle
}

export const patchTipoProductoPropiedadDetalle = async (idTipoProductoPropiedadDetalle, objTipoProductoPropiedadDetalle) => {
    const { data: dataTipoProductoPropiedadDetalle } = await apiTipoProductoPropiedadDetalle.tipoProductoPropiedadDetalleControllerUpdateById(idTipoProductoPropiedadDetalle, objTipoProductoPropiedadDetalle)
    return dataTipoProductoPropiedadDetalle
}
