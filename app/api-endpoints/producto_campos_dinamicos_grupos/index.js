import { ProductoCamposDinamicosGruposControllerApi, settings } from "@/app/api-programa";

const apiProductoCamposDinamicosGrupos = new ProductoCamposDinamicosGruposControllerApi(settings);

export const getCamposDinamicosPorGruposProductoAgrupado = async (productoId, idsGrupos = []) => {
    const idsNormalizados = Array.from(
        new Set(
            (idsGrupos || [])
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0)
        )
    );

    const grupos = idsNormalizados.length ? idsNormalizados.join(",") : undefined;
    const { data: dataCamposAgrupados } =
        await apiProductoCamposDinamicosGrupos.productoCamposDinamicosGruposControllerFindByProductoIdAgrupado(
            productoId,
            grupos
        );
    return dataCamposAgrupados;
};
