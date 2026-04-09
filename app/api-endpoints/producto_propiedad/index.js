import { ProductoPropiedadControllerApi, settings } from "@/app/api-programa";

const apiProductoPropiedad = new ProductoPropiedadControllerApi(settings)

export const getProductosPropiedad = async (filtro) => {
    const { data: dataProductosPropiedad } = await apiProductoPropiedad.productoPropiedadControllerFind(filtro)
    return dataProductosPropiedad
}

export const getProductosPropiedadCount = async (filtro) => {
    const { data: dataProductosPropiedad } = await apiProductoPropiedad.productoPropiedadControllerCount(filtro)
    return dataProductosPropiedad
}

export const getProductoPropiedad = async (id) => {
    const { data: dataProductoPropiedad } = await apiProductoPropiedad.productoPropiedadControllerFindById(id)
    return dataProductoPropiedad
}

export const postProductoPropiedad = async (objProductoPropiedad) => {
    const { data: dataProductoPropiedad } = await apiProductoPropiedad.productoPropiedadControllerCreate(objProductoPropiedad)
    return dataProductoPropiedad
}

export const deleteProductoPropiedad = async (idProductoPropiedad) => {
    const { data: dataProductoPropiedad } = await apiProductoPropiedad.productoPropiedadControllerDeleteById(idProductoPropiedad)
    return dataProductoPropiedad
}

export const patchProductoPropiedad = async (idProductoPropiedad, objProductoPropiedad) => {
    const { data: dataProductoPropiedad } = await apiProductoPropiedad.productoPropiedadControllerUpdateById(idProductoPropiedad, objProductoPropiedad)
    return dataProductoPropiedad
}