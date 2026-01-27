import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { getProductos } from "@/app/api-endpoints/producto";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoSeo = ({ productoSeo, setProductoSeo, estadoGuardando, editable }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);

    // Cargar productos para el dropdown
    useEffect(() => {
        const cargarProductos = async () => {
            setCargandoProductos(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S' 
                        }
                    }
                });
                const data = await getProductos(filtro);
                const productosFormateados = data.map(prod => ({
                    label: `${prod.sku} - ${prod.nombre}`,
                    value: prod.id
                }));
                setProductos(productosFormateados);
            } catch (error) {
                console.error('Error cargando productos:', error);
            } finally {
                setCargandoProductos(false);
            }
        };

        cargarProductos();
    }, []);

    // Opciones predefinidas para meta_robots
    const opcionesMetaRobots = [
        { label: 'index, follow', value: 'index, follow' },
        { label: 'noindex, follow', value: 'noindex, follow' },
        { label: 'index, nofollow', value: 'index, nofollow' },
        { label: 'noindex, nofollow', value: 'noindex, nofollow' },
        { label: 'noarchive', value: 'noarchive' },
        { label: 'nosnippet', value: 'nosnippet' },
        { label: 'noimageindex', value: 'noimageindex' }
    ];

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setProductoSeo({ ...productoSeo, [nombreCampo]: valor });
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            id="productoId"
                            value={productoSeo.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioInput(e, 'productoId')}
                            placeholder={intl.formatMessage({ id: 'Selecciona un producto' })}
                            disabled={estadoGuardando || !editable}
                            loading={cargandoProductos}
                            filter
                            showClear
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Metadatos SEO' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="meta_titulo">{intl.formatMessage({ id: 'Meta Título' })}</label>
                        <InputText
                            id="meta_titulo"
                            value={productoSeo.meta_titulo || ''}
                            onChange={(e) => manejarCambioInput(e, 'meta_titulo')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="slug">{intl.formatMessage({ id: 'Slug/URL amigable' })}</label>
                        <InputText
                            id="slug"
                            value={productoSeo.slug || ''}
                            onChange={(e) => manejarCambioInput(e, 'slug')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="meta_descripcion">{intl.formatMessage({ id: 'Meta Descripción' })}</label>
                        <InputTextarea
                            id="meta_descripcion"
                            value={productoSeo.meta_descripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'meta_descripcion')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={320}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 320 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="meta_robots">{intl.formatMessage({ id: 'Meta Robots' })}</label>
                        <Dropdown
                            id="meta_robots"
                            value={productoSeo.meta_robots}
                            options={opcionesMetaRobots}
                            onChange={(e) => manejarCambioInput(e, 'meta_robots')}
                            placeholder={intl.formatMessage({ id: 'Selecciona directiva robots' })}
                            disabled={estadoGuardando || !editable}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="url_canoncia">{intl.formatMessage({ id: 'URL Canónica' })}</label>
                        <InputText
                            id="url_canoncia"
                            value={productoSeo.url_canoncia || ''}
                            onChange={(e) => manejarCambioInput(e, 'url_canoncia')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Open Graph (Facebook)' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="og_titulo">{intl.formatMessage({ id: 'OG Título' })}</label>
                        <InputText
                            id="og_titulo"
                            value={productoSeo.og_titulo || ''}
                            onChange={(e) => manejarCambioInput(e, 'og_titulo')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="og_imagen_url">{intl.formatMessage({ id: 'OG Imagen URL' })}</label>
                        <InputText
                            id="og_imagen_url"
                            value={productoSeo.og_imagen_url || ''}
                            onChange={(e) => manejarCambioInput(e, 'og_imagen_url')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">URL completa de la imagen</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="og_descripcion">{intl.formatMessage({ id: 'OG Descripción' })}</label>
                        <InputTextarea
                            id="og_descripcion"
                            value={productoSeo.og_descripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'og_descripcion')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={320}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 320 caracteres</small>
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Twitter Cards' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="twitter_titulo">{intl.formatMessage({ id: 'Twitter Título' })}</label>
                        <InputText
                            id="twitter_titulo"
                            value={productoSeo.twitter_titulo || ''}
                            onChange={(e) => manejarCambioInput(e, 'twitter_titulo')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="twitter_imagen_url">{intl.formatMessage({ id: 'Twitter Imagen URL' })}</label>
                        <InputText
                            id="twitter_imagen_url"
                            value={productoSeo.twitter_imagen_url || ''}
                            onChange={(e) => manejarCambioInput(e, 'twitter_imagen_url')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">URL completa de la imagen</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="twitter_descripcion">{intl.formatMessage({ id: 'Twitter Descripción' })}</label>
                        <InputTextarea
                            id="twitter_descripcion"
                            value={productoSeo.twitter_descripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'twitter_descripcion')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={320}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 320 caracteres</small>
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Palabras Clave' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="palabras_clave">{intl.formatMessage({ id: 'Palabras Clave Principales' })}</label>
                        <InputTextarea
                            id="palabras_clave"
                            value={productoSeo.palabras_clave || ''}
                            onChange={(e) => manejarCambioInput(e, 'palabras_clave')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={1000}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 1000 caracteres. Separa con comas</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="palabras_clave_dos">{intl.formatMessage({ id: 'Palabras Clave Secundarias' })}</label>
                        <InputTextarea
                            id="palabras_clave_dos"
                            value={productoSeo.palabras_clave_dos || ''}
                            onChange={(e) => manejarCambioInput(e, 'palabras_clave_dos')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={1000}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 1000 caracteres. Separa con comas</small>
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoSeo;