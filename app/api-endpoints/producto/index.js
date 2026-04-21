import { ProductoControllerApi, settings } from "@/app/api-programa";

const apiProducto = new ProductoControllerApi(settings)

export const getProductos = async (filtro) => {
    const { data: dataProductos } = await apiProducto.productoControllerFind(filtro)
    return dataProductos
}

export const getProductosCount = async (filtro) => {
    const { data: dataProductos } = await apiProducto.productoControllerCount(filtro)
    return dataProductos
}

export const getProducto = async (id) => {
    const { data: dataProducto } = await apiProducto.productoControllerFindById(id)
    return dataProducto
}

export const postProducto = async (objProducto) => {
    const { data: dataProducto } = await apiProducto.productoControllerCreate(objProducto)
    return dataProducto
}

export const deleteProducto = async (idProducto) => {
    const { data: dataProducto } = await apiProducto.productoControllerDeleteById(idProducto)
    return dataProducto
}

export const patchProducto = async (idProducto, objProducto) => {
    const { data: dataProducto } = await apiProducto.productoControllerUpdateById(idProducto, objProducto)
    return dataProducto
}