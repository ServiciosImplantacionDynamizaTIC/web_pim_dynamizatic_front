import { PlanificadorCategoriaControllerApi, settings } from "@/app/api-programa";

const apiPlanificadorCategoria = new PlanificadorCategoriaControllerApi(settings);

export const getPlanificadorCategorias = async (filtro) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerFind(filtro);
    return data;
};

export const getPlanificadorCategoriasCount = async (filtro) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerCount(filtro);
    return data;
};

export const getVistaPlanificadorCategoriaEmpresas = async (filtro) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerVistaPlanificadorCategoriaEmpresa(filtro);
    return data;
};

export const getVistaPlanificadorCategoriaEmpresasCount = async (filtro) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerVistaPlanificadorCategoriaEmpresaCount(filtro);
    return data;
};

export const postPlanificadorCategoria = async (objPlanificadorCategoria) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerCreate(objPlanificadorCategoria);
    return data;
};

export const patchPlanificadorCategoria = async (idPlanificadorCategoria, objPlanificadorCategoria) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerUpdateById(idPlanificadorCategoria, objPlanificadorCategoria);
    return data;
};

export const deletePlanificadorCategoria = async (idPlanificadorCategoria) => {
    const { data } = await apiPlanificadorCategoria.planificadorCategoriaControllerDeleteById(idPlanificadorCategoria);
    return data;
};
