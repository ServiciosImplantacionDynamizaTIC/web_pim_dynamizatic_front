import { ProductoIconoControllerApi, settings } from "@/app/api-programa";

const apiProductoIcono = new ProductoIconoControllerApi(settings)

export const getProductosIcono = async (filtro) => {
    const { data: dataProductosIcono } = await apiProductoIcono.productoIconoControllerFind(filtro)
    return dataProductosIcono
}

export const getProductosIconoCount = async (filtro) => {
    const { data: dataProductosIcono } = await apiProductoIcono.productoIconoControllerCount(filtro)
    return dataProductosIcono
}

export const getProductoIcono = async (id) => {
    const { data: dataProductoIcono } = await apiProductoIcono.productoIconoControllerFindById(id)
    return dataProductoIcono
}

export const postProductoIcono = async (objProductoIcono) => {
    const { data: dataProductoIcono } = await apiProductoIcono.productoIconoControllerCreate(objProductoIcono)
    return dataProductoIcono
}

export const deleteProductoIcono = async (idProductoIcono) => {
    const { data: dataProductoIcono } = await apiProductoIcono.productoIconoControllerDeleteById(idProductoIcono)
    return dataProductoIcono
}

export const patchProductoIcono = async (idProductoIcono, objProductoIcono) => {
    const { data: dataProductoIcono } = await apiProductoIcono.productoIconoControllerUpdateById(idProductoIcono, objProductoIcono)
    return dataProductoIcono
}