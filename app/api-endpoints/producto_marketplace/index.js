import { ProductoMarketplaceControllerApi, settings } from "@/app/api-programa";

const apiProductoMarketplace = new ProductoMarketplaceControllerApi(settings)

export const getProductosMarketplace = async (filtro) => {
    const { data: dataProductosMarketplace } = await apiProductoMarketplace.productoMarketplaceControllerFind(filtro)
    return dataProductosMarketplace
}

export const getProductosMarketplaceCount = async (filtro) => {
    const { data: dataProductosMarketplace } = await apiProductoMarketplace.productoMarketplaceControllerCount(filtro)
    return dataProductosMarketplace
}

export const getProductoMarketplace = async (id) => {
    const { data: dataProductoMarketplace } = await apiProductoMarketplace.productoMarketplaceControllerFindById(id)
    return dataProductoMarketplace
}

export const postProductoMarketplace = async (objProductoMarketplace) => {
    const { data: dataProductoMarketplace } = await apiProductoMarketplace.productoMarketplaceControllerCreate(objProductoMarketplace)
    return dataProductoMarketplace
}

export const deleteProductoMarketplace = async (idProductoMarketplace) => {
    const { data: dataProductoMarketplace } = await apiProductoMarketplace.productoMarketplaceControllerDeleteById(idProductoMarketplace)
    return dataProductoMarketplace
}

export const patchProductoMarketplace = async (idProductoMarketplace, objProductoMarketplace) => {
    const { data: dataProductoMarketplace } = await apiProductoMarketplace.productoMarketplaceControllerUpdateById(idProductoMarketplace, objProductoMarketplace)
    return dataProductoMarketplace
}