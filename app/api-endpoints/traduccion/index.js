import { TraduccionLiteralControllerApi, IdiomaControllerApi, settings } from "@/app/api-programa";

const apiTraduccion = new TraduccionLiteralControllerApi(settings)
const apiIdioma = new IdiomaControllerApi(settings)

export const getTraduccionLiterales = async (filtrar) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerFind(filtrar)
    return dataTraduccionLiterales
}

export const getTraduccionLiteralesCount = async (filtrar) => {
    const { data: dataTraduccionLiteralesCount } = await apiTraduccion.traduccionLiteralControllerCount(filtrar)
    return dataTraduccionLiteralesCount
}

export const postTraduccionLiteral = async (objTraduccion) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerCreate(objTraduccion)
    return dataTraduccionLiterales
}

export const patchTraduccionLiteral = async (idTraduccion, objTraduccion) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerUpdateById(idTraduccion, objTraduccion)
    return dataTraduccionLiterales
}

export const deleteTraduccionLiteral = async (idTraduccion) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerDeleteById(idTraduccion)
    return dataTraduccionLiterales
}

// export const getVistaTraduccionLiteralIdioma = async (filtrar) => {
//     const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerVistaTraduccionLiteralIdioma(filtrar)
//     return dataTraduccionLiterales
// }

// export const getVistaTraduccionLiteralIdiomaCount = async (filtrar) => {
//     const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerVistaTraduccionLiteralIdiomaCount(filtrar)
//     return dataTraduccionLiterales
// }

export const buscaTraduccionLiteral = async (iso) => {
    try {
        const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerBuscarTraduccionLiteral(iso);
        const newLanguageObj = {}; // {"Announcements": "Comunicados"}

        dataTraduccionLiterales?.forEach(traduccion => {
            if (traduccion?.valor?.length) {
                newLanguageObj[`${traduccion.clave}`] = traduccion.valor;
            }
        });

        return newLanguageObj;
    } catch (error) {
        console.log(error);
    }
};

export const getIdiomas = async () => {
    const { data: dataTraducciones } = await apiIdioma.idiomaControllerFind()
    return dataTraducciones
}

export const crearVistaTraduccionesDinamica = async () => {
    try {
        // Obtener todos los idiomas activos
        const idiomas = await getIdiomas();
        
        // Crear la consulta dinámica
        let query = `
            CREATE OR REPLACE VIEW vista_traducciones_dinamica AS
            SELECT 
                t.clave,
                ${idiomas.map(idioma => `
                    MAX(CASE WHEN t.idiomaId = ${idioma.id} THEN t.valor END) as ${idioma.iso.toLowerCase()}
                `).join(',\n')}
            FROM traduccion t
            GROUP BY t.clave
        `;

        // Ejecutar la consulta
        const { data } = await apiTraduccion.traduccionControllerExecuteQuery(query);
        return data;
    } catch (error) {
        console.error('Error al crear la vista dinámica:', error);
        throw error;
    }
}

export const getVistaTraduccionesDinamica = async (filtro) => {
    try {
        const { data } = await apiTraduccion.traduccionControllerVistaTraduccionesDinamica(filtro);
        return data;
    } catch (error) {
        console.error('Error al obtener la vista dinámica:', error);
        throw error;
    }
}