import { GrupoCampoDinamicoControllerApi, settings } from "@/app/api-programa";

const apiGrupoCampoDinamico = new GrupoCampoDinamicoControllerApi(settings);

export const getGruposCampoDinamicos = async (filtro) => {
    const { data: dataRegistros } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerFind(filtro);
    return dataRegistros;
};

export const getGruposCampoDinamicosCount = async (filtro) => {
    const { data: dataRegistros } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerCount(filtro);
    return dataRegistros;
};

export const getGrupoCampoDinamico = async (idRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerFindById(idRegistro);
    return dataRegistro;
};

export const postGrupoCampoDinamico = async (objRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerCreate(objRegistro);
    return dataRegistro;
};

export const patchGrupoCampoDinamico = async (idRegistro, objRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerUpdateById(idRegistro, objRegistro);
    return dataRegistro;
};

export const deleteGrupoCampoDinamico = async (idRegistro) => {
    const { data: estadoEliminacion } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerPuedeEliminar(idRegistro);

    if (!estadoEliminacion?.puedeEliminar) {
        throw new Error(estadoEliminacion?.motivo || "No se puede eliminar el grupo de campos dinámicos.");
    }

    const { data: dataRegistro } = await apiGrupoCampoDinamico.grupoCampoDinamicoControllerDeleteById(idRegistro);
    return dataRegistro;
};
