import { PlanificadorDetalleControllerApi, settings } from "@/app/api-programa";

const apiPlanificadorDetalle = new PlanificadorDetalleControllerApi(settings);

export const getPlanificadorDetalles = async (filtro) => {
    const { data } = await apiPlanificadorDetalle.planificadorDetalleControllerFind(filtro);
    return data;
};

export const getPlanificadorDetallesCount = async (filtro) => {
    const { data } = await apiPlanificadorDetalle.planificadorDetalleControllerCount(filtro);
    return data;
};

export const postPlanificadorDetalle = async (objPlanificadorDetalle) => {
    const { data } = await apiPlanificadorDetalle.planificadorDetalleControllerCreate(objPlanificadorDetalle);
    return data;
};

export const patchPlanificadorDetalle = async (idPlanificadorDetalle, objPlanificadorDetalle) => {
    const { data } = await apiPlanificadorDetalle.planificadorDetalleControllerUpdateById(idPlanificadorDetalle, objPlanificadorDetalle);
    return data;
};

export const deletePlanificadorDetalle = async (idPlanificadorDetalle) => {
    const { data } = await apiPlanificadorDetalle.planificadorDetalleControllerDeleteById(idPlanificadorDetalle);
    return data;
};
