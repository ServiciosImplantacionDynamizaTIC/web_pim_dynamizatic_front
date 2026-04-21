import { PlanificadorControllerApi, settings } from "@/app/api-programa";

const apiPlanificador = new PlanificadorControllerApi(settings);

export const getPlanificadores = async (filtro) => {
    const { data } = await apiPlanificador.planificadorControllerFind(filtro);
    return data;
};

export const getPlanificadoresCount = async (filtro) => {
    const { data } = await apiPlanificador.planificadorControllerCount(filtro);
    return data;
};

export const postPlanificador = async (objPlanificador) => {
    const { data } = await apiPlanificador.planificadorControllerCreate(objPlanificador);
    return data;
};

export const putPlanificador = async (idPlanificador, objPlanificador) => {
    const { data } = await apiPlanificador.planificadorControllerReplaceById(idPlanificador, objPlanificador);
    return data;
};

export const patchPlanificador = async (idPlanificador, objPlanificador) => {
    const { data } = await apiPlanificador.planificadorControllerUpdateById(idPlanificador, objPlanificador);
    return data;
};

export const deletePlanificador = async (idPlanificador) => {
    const { data } = await apiPlanificador.planificadorControllerDeleteById(idPlanificador);
    return data;
};
