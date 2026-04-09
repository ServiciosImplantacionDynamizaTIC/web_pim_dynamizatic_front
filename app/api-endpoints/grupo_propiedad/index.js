import { GrupoPropiedadControllerApi, settings } from "@/app/api-programa";

const apiGrupoPropiedad = new GrupoPropiedadControllerApi(settings)

export const getGrupoPropiedades = async (filtro) => {
    const { data: dataGrupoPropiedades } = await apiGrupoPropiedad.grupoPropiedadControllerFind(filtro)
    return dataGrupoPropiedades
}

export const getGrupoPropiedadesCount = async (filtro) => {
    const { data: dataGrupoPropiedades } = await apiGrupoPropiedad.grupoPropiedadControllerCount(filtro)
    return dataGrupoPropiedades
}

export const getGrupoPropiedad = async (id) => {
    const { data: dataGrupoPropiedad } = await apiGrupoPropiedad.grupoPropiedadControllerFindById(id)
    return dataGrupoPropiedad
}

export const postGrupoPropiedad = async (objGrupoPropiedad) => {
    try {
        const { data: dataGrupoPropiedad } = await apiGrupoPropiedad.grupoPropiedadControllerCreate(objGrupoPropiedad)
        return dataGrupoPropiedad
    } catch (error) {
        console.error('Error en postGrupoPropiedad:', error);
        throw error;
    }
}

export const deleteGrupoPropiedad = async (idGrupoPropiedad) => {
    const { data: dataGrupoPropiedad } = await apiGrupoPropiedad.grupoPropiedadControllerDeleteById(idGrupoPropiedad)
    return dataGrupoPropiedad
}

export const patchGrupoPropiedad = async (idGrupoPropiedad, objGrupoPropiedad) => {
    const { data: dataGrupoPropiedad } = await apiGrupoPropiedad.grupoPropiedadControllerUpdateById(idGrupoPropiedad, objGrupoPropiedad)
    return dataGrupoPropiedad
}