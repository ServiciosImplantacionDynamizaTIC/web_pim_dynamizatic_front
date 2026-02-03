import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { getProductos } from "@/app/api-endpoints/producto";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoSeo = ({ productoSeo, setProductoSeo, estadoGuardando, editable, idProducto }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);

    // Cargar productos para el dropdown
    useEffect(() => {
        const cargarProductos = async () => {
            setCargandoProductos(true);
            try {
                let filtro;
                if (idProducto) {
                    // Si tenemos un idProducto específico, filtrar solo ese producto
                    filtro = JSON.stringify({
                        where: {
                            and: {
                                id: idProducto,
                                empresaId: getUsuarioSesion()?.empresaId,
                                activoSn: 'S' 
                            }
                        }
                    });
                } else {
                    // Si no hay idProducto específico, cargar todos los productos activos
                    filtro = JSON.stringify({
                        where: {
                            and: {
                                empresaId: getUsuarioSesion()?.empresaId,
                                activoSn: 'S' 
                            }
                        }
                    });
                }
                
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
    }, [idProducto]);
    //
    // Efecto separado para auto-seleccionar el producto cuando está disponible
    //
    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoSeo(prev => {
                //
                // Solo actualizar si no tiene productoId o es diferente
                //
                if (!prev.productoId || prev.productoId !== idProducto) {
                    return { ...prev, productoId: idProducto };
                }
                return prev;
            });
        }
    }, [idProducto, productos]);

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
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable style={{display: idProducto ? 'none' : 'block'}}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            id="productoId"
                            value={productoSeo.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioInput(e, 'productoId')}
                            placeholder={intl.formatMessage({ id: 'Selecciona un producto' })}
                            disabled={estadoGuardando || !editable || !!idProducto} // Deshabilitar si hay idProducto específico
                            loading={cargandoProductos}
                            filter={!idProducto} // Solo permitir filtro si no hay idProducto específico
                            showClear={!idProducto} // Solo mostrar limpiar si no hay idProducto específico
                        />
                    </div>
                </div>
            </Fieldset>
            <br/>
            <Fieldset legend={intl.formatMessage({ id: 'Metadatos SEO' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="metaTitulo">{intl.formatMessage({ id: 'Meta Título' })}</label>
                        <InputText
                            id="metaTitulo"
                            value={productoSeo.metaTitulo || ''}
                            onChange={(e) => manejarCambioInput(e, 'metaTitulo')}
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
                        <label htmlFor="metaDescripcion">{intl.formatMessage({ id: 'Meta Descripción' })}</label>
                        <InputTextarea
                            id="metaDescripcion"
                            value={productoSeo.metaDescripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'metaDescripcion')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={320}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 320 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="metaRobots">{intl.formatMessage({ id: 'Meta Robots' })}</label>
                        <Dropdown
                            id="metaRobots"
                            value={productoSeo.metaRobots || ''}
                            options={opcionesMetaRobots}
                            onChange={(e) => manejarCambioInput(e, 'metaRobots')}
                            placeholder={intl.formatMessage({ id: 'Selecciona directiva robots' })}
                            disabled={estadoGuardando || !editable}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="urlCanonica">{intl.formatMessage({ id: 'URL Canónica' })}</label>
                        <InputText
                            id="urlCanonica"
                            value={productoSeo.urlCanonica || ''}
                            onChange={(e) => manejarCambioInput(e, 'urlCanonica')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>
                </div>
            </Fieldset>
            <br/>
            <Fieldset legend={intl.formatMessage({ id: 'Open Graph (Facebook)' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="ogTitulo">{intl.formatMessage({ id: 'OG Título' })}</label>
                        <InputText
                            id="ogTitulo"
                            value={productoSeo.ogTitulo || ''}
                            onChange={(e) => manejarCambioInput(e, 'ogTitulo')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="ogImagenUrl">{intl.formatMessage({ id: 'OG Imagen URL' })}</label>
                        <InputText
                            id="ogImagenUrl"
                            value={productoSeo.ogImagenUrl || ''}
                            onChange={(e) => manejarCambioInput(e, 'ogImagenUrl')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">URL completa de la imagen</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="ogDescripcion">{intl.formatMessage({ id: 'OG Descripción' })}</label>
                        <InputTextarea
                            id="ogDescripcion"
                            value={productoSeo.ogDescripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'ogDescripcion')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={320}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 320 caracteres</small>
                    </div>
                </div>
            </Fieldset>
            <br/>
            <Fieldset legend={intl.formatMessage({ id: 'Twitter Cards' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="twitterTitulo">{intl.formatMessage({ id: 'Twitter Título' })}</label>
                        <InputText
                            id="twitterTitulo"
                            value={productoSeo.twitterTitulo || ''}
                            onChange={(e) => manejarCambioInput(e, 'twitterTitulo')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">Máximo 255 caracteres</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="twitterImagenUrl">{intl.formatMessage({ id: 'Twitter Imagen URL' })}</label>
                        <InputText
                            id="twitterImagenUrl"
                            value={productoSeo.twitterImagenUrl || ''}
                            onChange={(e) => manejarCambioInput(e, 'twitterImagenUrl')}
                            disabled={estadoGuardando || !editable}
                            maxLength={255}
                        />
                        <small className="p-text-secondary">URL completa de la imagen</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="twitterDescripcion">{intl.formatMessage({ id: 'Twitter Descripción' })}</label>
                        <InputTextarea
                            id="twitterDescripcion"
                            value={productoSeo.twitterDescripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'twitterDescripcion')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={320}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 320 caracteres</small>
                    </div>
                </div>
            </Fieldset>
            <br/>
            <Fieldset legend={intl.formatMessage({ id: 'Palabras Clave' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="palabrasClave">{intl.formatMessage({ id: 'Palabras Clave Principales' })}</label>
                        <InputTextarea
                            id="palabrasClave"
                            value={productoSeo.palabrasClave || ''}
                            onChange={(e) => manejarCambioInput(e, 'palabrasClave')}
                            disabled={estadoGuardando || !editable}
                            rows={3}
                            maxLength={1000}
                            autoResize
                        />
                        <small className="p-text-secondary">Máximo 1000 caracteres. Separa con comas</small>
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="palabrasClaveDos">{intl.formatMessage({ id: 'Palabras Clave Secundarias' })}</label>
                        <InputTextarea
                            id="palabrasClaveDos"
                            value={productoSeo.palabrasClaveDos || ''}
                            onChange={(e) => manejarCambioInput(e, 'palabrasClaveDos')}
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