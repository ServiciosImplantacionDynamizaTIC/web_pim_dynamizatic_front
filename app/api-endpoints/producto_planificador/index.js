import { ProductoPlanificadorControllerApi, settings } from "@/app/api-programa";

const apiProductoPlanificador = new ProductoPlanificadorControllerApi(settings);

export const getProductoPlanificadores = async (filtro) => {
    const { data } = await apiProductoPlanificador.productoPlanificadorControllerFind(filtro);
    return data;
};

export const getProductoPlanificadoresCount = async (filtro) => {
    const { data } = await apiProductoPlanificador.productoPlanificadorControllerCount(filtro);
    return data;
};

export const postProductoPlanificador = async (objProductoPlanificador) => {
    const { data } = await apiProductoPlanificador.productoPlanificadorControllerCreate(objProductoPlanificador);
    return data;
};

export const patchProductoPlanificador = async (idProductoPlanificador, objProductoPlanificador) => {
    const { data } = await apiProductoPlanificador.productoPlanificadorControllerUpdateById(idProductoPlanificador, objProductoPlanificador);
    return data;
};

export const deleteProductoPlanificador = async (idProductoPlanificador) => {
    const { data } = await apiProductoPlanificador.productoPlanificadorControllerDeleteById(idProductoPlanificador);
    return data;
};
