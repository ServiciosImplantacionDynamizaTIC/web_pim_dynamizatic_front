"use client";
import { deleteProductoSeo, getProductosSeo, getProductosSeoCount } from "@/app/api-endpoints/producto_seo";
import Crud from "../../components/shared/crud";
import EditarProductoSeo from "./editar";
import { useIntl } from 'react-intl'

const ProductoSeo = ({ idProducto }) => {
    const intl = useIntl();

    const columnas = [
        { campo: 'metaTitulo', header: intl.formatMessage({ id: 'Meta Título' }), tipo: 'string' },
        { campo: 'slug', header: intl.formatMessage({ id: 'Slug' }), tipo: 'string' },
   ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'SEO de Productos' })}
                getRegistros={() => getProductosSeo(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                getRegistrosCount={() => getProductosSeoCount(JSON.stringify(({ where: {and: { productoId: idProducto }}})))}
                deleteRegistro={deleteProductoSeo}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"ProductoSeo"}
                filtradoBase={idProducto ?  { productoId: idProducto } : {}}
                editarComponente={<EditarProductoSeo 
                    idProducto={idProducto}
                    emptyRegistro={{
                        productoId: idProducto,
                        metaTitulo: "",
                        metaDescripcion: "",
                        metaRobots: "",
                        slug: "",
                        urlCanonica: "",
                        ogTitulo: "",
                        ogDescripcion: "",
                        ogImagenUrl: "",
                        twitterTitulo: "",
                        twitterDescripcion: "",
                        twitterImagenUrl: "",
                        palabrasClave: "",
                        palabrasClaveDos: ""
                    }} />}
                columnas={columnas}
            />
        </div>
    );
};

export default ProductoSeo;