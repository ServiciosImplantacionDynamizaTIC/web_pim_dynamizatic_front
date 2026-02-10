import { ProductoMarketplaceSincronizacionControllerApi, settings } from "@/app/api-programa";

const apiProductoMarketplaceSincronizacion = new ProductoMarketplaceSincronizacionControllerApi(settings)

export const getProductosMarketplaceSincronizacion = async (filtro) => {
    const { data: dataProductosMarketplaceSincronizacion } = await apiProductoMarketplaceSincronizacion.productoMarketplaceSincronizacionControllerFind(filtro)
    return dataProductosMarketplaceSincronizacion
}

export const getProductosMarketplaceSincronizacionCount = async (filtro) => {
    const { data: dataProductosMarketplaceSincronizacion } = await apiProductoMarketplaceSincronizacion.productoMarketplaceSincronizacionControllerCount(filtro)
    return dataProductosMarketplaceSincronizacion
}

export const getProductoMarketplaceSincronizacion = async (id) => {
    const { data: dataProductoMarketplaceSincronizacion } = await apiProductoMarketplaceSincronizacion.productoMarketplaceSincronizacionControllerFindById(id)
    return dataProductoMarketplaceSincronizacion
}

export const postProductoMarketplaceSincronizacion = async (objProductoMarketplaceSincronizacion) => {
    const { data: dataProductoMarketplaceSincronizacion } = await apiProductoMarketplaceSincronizacion.productoMarketplaceSincronizacionControllerCreate(objProductoMarketplaceSincronizacion)
    return dataProductoMarketplaceSincronizacion
}

export const deleteProductoMarketplaceSincronizacion = async (idProductoMarketplaceSincronizacion) => {
    const { data: dataProductoMarketplaceSincronizacion } = await apiProductoMarketplaceSincronizacion.productoMarketplaceSincronizacionControllerDeleteById(idProductoMarketplaceSincronizacion)
    return dataProductoMarketplaceSincronizacion
}

export const patchProductoMarketplaceSincronizacion = async (idProductoMarketplaceSincronizacion, objProductoMarketplaceSincronizacion) => {
    const { data: dataProductoMarketplaceSincronizacion } = await apiProductoMarketplaceSincronizacion.productoMarketplaceSincronizacionControllerUpdateById(idProductoMarketplaceSincronizacion, objProductoMarketplaceSincronizacion)
    return dataProductoMarketplaceSincronizacion
}