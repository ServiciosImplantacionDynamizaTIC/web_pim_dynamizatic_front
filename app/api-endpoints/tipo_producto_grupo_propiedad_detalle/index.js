import { TipoProductoGrupoPropiedadDetalleControllerApi, settings } from "@/app/api-programa";

const apiTipoProductoGrupoPropiedadDetalle = new TipoProductoGrupoPropiedadDetalleControllerApi(settings)

export const getTipoProductoGrupoPropiedadDetalles = async (filtro) => {
    const { data: dataTipoProductoGrupoPropiedadDetalles } = await apiTipoProductoGrupoPropiedadDetalle.tipoProductoGrupoPropiedadDetalleControllerFind(filtro)
    return dataTipoProductoGrupoPropiedadDetalles
}

export const getTipoProductoGrupoPropiedadDetallesCount = async (filtro) => {
    const { data: dataTipoProductoGrupoPropiedadDetalles } = await apiTipoProductoGrupoPropiedadDetalle.tipoProductoGrupoPropiedadDetalleControllerCount(filtro)
    return dataTipoProductoGrupoPropiedadDetalles
}

export const getTipoProductoGrupoPropiedadDetalle = async (id) => {
    const { data: dataTipoProductoGrupoPropiedadDetalle } = await apiTipoProductoGrupoPropiedadDetalle.tipoProductoGrupoPropiedadDetalleControllerFindById(id)
    return dataTipoProductoGrupoPropiedadDetalle
}

export const postTipoProductoGrupoPropiedadDetalle = async (objTipoProductoGrupoPropiedadDetalle) => {
    const { data: dataTipoProductoGrupoPropiedadDetalle } = await apiTipoProductoGrupoPropiedadDetalle.tipoProductoGrupoPropiedadDetalleControllerCreate(objTipoProductoGrupoPropiedadDetalle)
    return dataTipoProductoGrupoPropiedadDetalle
}

export const deleteTipoProductoGrupoPropiedadDetalle = async (idTipoProductoGrupoPropiedadDetalle) => {
    const { data: dataTipoProductoGrupoPropiedadDetalle } = await apiTipoProductoGrupoPropiedadDetalle.tipoProductoGrupoPropiedadDetalleControllerDeleteById(idTipoProductoGrupoPropiedadDetalle)
    return dataTipoProductoGrupoPropiedadDetalle
}

export const patchTipoProductoGrupoPropiedadDetalle = async (idTipoProductoGrupoPropiedadDetalle, objTipoProductoGrupoPropiedadDetalle) => {
    const { data: dataTipoProductoGrupoPropiedadDetalle } = await apiTipoProductoGrupoPropiedadDetalle.tipoProductoGrupoPropiedadDetalleControllerUpdateById(idTipoProductoGrupoPropiedadDetalle, objTipoProductoGrupoPropiedadDetalle)
    return dataTipoProductoGrupoPropiedadDetalle
}
