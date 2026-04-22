import { MarketplaceControllerApi, settings } from "@/app/api-programa";

const apiMarketplace = new MarketplaceControllerApi(settings)

export const getMarketplaces = async (filtro) => {
    const { data: dataMarketplaces } = await apiMarketplace.marketplaceControllerFind(filtro)
    return dataMarketplaces
}

export const getMarketplacesCount = async (filtro) => {
    const { data: dataMarketplaces } = await apiMarketplace.marketplaceControllerCount(filtro)
    return dataMarketplaces
}

export const getMarketplace = async (id) => {
    const { data: dataMarketplace } = await apiMarketplace.marketplaceControllerFindById(id)
    return dataMarketplace
}

export const postMarketplace = async (objMarketplace) => {
    const { data: dataMarketplace } = await apiMarketplace.marketplaceControllerCreate(objMarketplace)
    return dataMarketplace
}

export const deleteMarketplace = async (idMarketplace) => {
    const { data: dataMarketplace } = await apiMarketplace.marketplaceControllerDeleteById(idMarketplace)
    return dataMarketplace
}

export const patchMarketplace = async (idMarketplace, objMarketplace) => {
    const { data: dataMarketplace } = await apiMarketplace.marketplaceControllerUpdateById(idMarketplace, objMarketplace)
    return dataMarketplace
}