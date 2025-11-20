import { settings, ConfiguracionLimpiezaLogsControllerApi } from "@/app/api-programa";

const apiConfiguracionLogs = new ConfiguracionLimpiezaLogsControllerApi(settings)

export const getConfiguracionLimpiezaLogs = async (filtros) => {
    const { data: dataConfig } = await apiConfiguracionLogs.configuracionLimpiezaLogsControllerFind(filtros)
    return dataConfig
}

export const postConfiguracionLimpiezaLogs = async (objConfig) => {
    const { data: dataConfig } = await apiConfiguracionLogs.configuracionLimpiezaLogsControllerCreate(objConfig)
    return dataConfig
}

export const patchConfiguracionLimpiezaLogs = async (idConfig, objConfig) => {
    const { data: dataConfig } = await apiConfiguracionLogs.configuracionLimpiezaLogsControllerUpdateById(idConfig, objConfig)
    return dataConfig
}

export const patchConfiguracionLimpiezaLogsByFilter = async (filtro, objConfig) => {
    // Esta función actualiza usando un filtro en lugar de ID
    // Primero obtiene el registro que cumple el filtro, luego hace PATCH con su ID
    const registros = await getConfiguracionLimpiezaLogs(filtro);
    if (registros && registros.length > 0) {
        const id = registros[0].id || registros[0]._id;
        if (id) {
            return await patchConfiguracionLimpiezaLogs(id, objConfig);
        }
    }
    throw new Error('No se encontró el registro con el filtro especificado');
}


