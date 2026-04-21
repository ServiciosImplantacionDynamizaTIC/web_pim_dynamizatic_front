import { PlanificadorEstadoControllerApi, settings } from "@/app/api-programa";

const apiPlanificadorEstado = new PlanificadorEstadoControllerApi(settings);

export const getPlanificadorEstados = async (filtro) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerFind(filtro);
    return data;
};

export const getPlanificadorEstadosCount = async (filtro) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerCount(filtro);
    return data;
};

export const getVistaPlanificadorEstadoEmpresa = async (filtro) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerVistaPlanificadorEstadoEmpresa(filtro);
    return data;
};

export const getVistaPlanificadorEstadoEmpresaCount = async (filtro) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerVistaPlanificadorEstadoEmpresaCount(filtro);
    return data;
};

export const postPlanificadorEstado = async (objPlanificadorEstado) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerCreate(objPlanificadorEstado);
    return data;
};

export const patchPlanificadorEstado = async (idPlanificadorEstado, objPlanificadorEstado) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerUpdateById(idPlanificadorEstado, objPlanificadorEstado);
    return data;
};

export const deletePlanificadorEstado = async (idPlanificadorEstado) => {
    const { data } = await apiPlanificadorEstado.planificadorEstadoControllerDeleteById(idPlanificadorEstado);
    return data;
};
