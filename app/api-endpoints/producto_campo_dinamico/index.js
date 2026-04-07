import { ProductoCampoDinamicoValorControllerApi, settings } from "@/app/api-programa";

const apiProductoCampoDinamico = new ProductoCampoDinamicoValorControllerApi(settings);

export const getProductoCampoDinamicos = async (filtro) => {
    const { data: dataRegistros } = await apiProductoCampoDinamico.productoCampoDinamicoValorControllerFind(filtro);
    return dataRegistros;
};

export const postProductoCampoDinamico = async (objRegistro) => {
    const { data: dataRegistro } = await apiProductoCampoDinamico.productoCampoDinamicoValorControllerCreate(objRegistro);
    return dataRegistro;
};

export const patchProductoCampoDinamico = async (idRegistro, objRegistro) => {
    const { data: dataRegistro } = await apiProductoCampoDinamico.productoCampoDinamicoValorControllerUpdateById(idRegistro, objRegistro);
    return dataRegistro;
};

export const deleteProductoCampoDinamico = async (idRegistro) => {
    const { data: dataRegistro } = await apiProductoCampoDinamico.productoCampoDinamicoValorControllerDeleteById(idRegistro);
    return dataRegistro;
};
