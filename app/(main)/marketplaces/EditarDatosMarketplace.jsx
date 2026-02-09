import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import { getMarketplaces } from "@/app/api-endpoints/marketplace";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosMarketplace = ({ marketplace, setMarketplace, estadoGuardando, isEdit, editable }) => {
    const intl = useIntl();
    
    const [marketplacesExistentes, setMarketplacesExistentes] = useState([]);
    const [opcionesTipoDisponibles, setOpcionesTipoDisponibles] = useState([]);
    const [cargandoTipos, setCargandoTipos] = useState(false);
    
    const opcionesTipoCompletas = [
        { label: 'WooCommerce', value: 'woocommerce' },
        { label: 'PrestaShop', value: 'prestashop' },
        { label: 'Shopify', value: 'shopify' },
        { label: 'Magento', value: 'magento' },
        { label: intl.formatMessage({ id: 'Otros' }), value: 'otros' }
    ];

    useEffect(() => {
        const cargarMarketplacesExistentes = async () => {
            setCargandoTipos(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S'
                        }
                    }
                });
                
                const data = await getMarketplaces(filtro);
                setMarketplacesExistentes(data);
                
                // Filtrar tipos ya utilizados (excepto si estamos editando y es el tipo actual)
                const tiposUtilizados = data
                    .filter(m => !isEdit || m.id !== marketplace.id)
                    .map(m => m.tipo);
                
                const tiposDisponibles = opcionesTipoCompletas.filter(
                    opcion => !tiposUtilizados.includes(opcion.value)
                );
                
                setOpcionesTipoDisponibles(tiposDisponibles);
                
            } catch (error) {
                console.error('Error cargando marketplaces existentes:', error);
            } finally {
                setCargandoTipos(false);
            }
        };

        cargarMarketplacesExistentes();
    }, [isEdit, marketplace.id]);

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setMarketplace({ ...marketplace, [nombreCampo]: valor });
    };

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setMarketplace({ ...marketplace, [nombreCampo]: valor });
    };

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _marketplace = { ...marketplace };
        const esTrue = valor === true ? 'S' : 'N';
        _marketplace[`${nombreInputSwitch}`] = esTrue;
        setMarketplace(_marketplace);
    };

    const manejarCambioFecha = (e, nombreCampo) => {
        const valor = e.value;
        setMarketplace({ ...marketplace, [nombreCampo]: valor });
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del marketplace' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={marketplace.nombre || ''}
                            placeholder={intl.formatMessage({ id: 'Nombre del marketplace' })}
                            onChange={(e) => manejarCambioInput(e, 'nombre')}
                            className={`${(estadoGuardando && marketplace.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="tipo"><b>{intl.formatMessage({ id: 'Tipo' })}*</b></label>
                        <Dropdown
                            id="tipo"
                            value={marketplace.tipo}
                            options={opcionesTipoDisponibles}
                            onChange={(e) => manejarCambioDropdown(e, 'tipo')}
                            placeholder={cargandoTipos ? intl.formatMessage({ id: 'Cargando tipos...' }) : intl.formatMessage({ id: 'Seleccione el tipo de marketplace' })}
                            disabled={!editable || estadoGuardando || cargandoTipos}
                            loading={cargandoTipos}
                            className={`${(estadoGuardando && !marketplace.tipo) ? "p-invalid" : ""}`}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="urlApi">{intl.formatMessage({ id: 'URL de la API' })}</label>
                        <InputText 
                            id="urlApi"
                            value={marketplace.urlApi || ''}
                            placeholder={intl.formatMessage({ id: 'URL de conexión a la API del marketplace' })}
                            onChange={(e) => manejarCambioInput(e, 'urlApi')}
                            maxLength={500}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="credencialesApi">{intl.formatMessage({ id: 'Credenciales de la API' })}</label>
                        <InputTextarea 
                            id="credencialesApi"
                            value={marketplace.credencialesApi || ''}
                            placeholder={intl.formatMessage({ id: 'Credenciales en formato JSON (API keys, tokens, etc.)' })}
                            onChange={(e) => manejarCambioInput(e, 'credencialesApi')}
                            rows={4}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="configuracion">{intl.formatMessage({ id: 'Configuración' })}</label>
                        <InputTextarea 
                            id="configuracion"
                            value={marketplace.configuracion || ''}
                            placeholder={intl.formatMessage({ id: 'Configuración adicional en formato JSON' })}
                            onChange={(e) => manejarCambioInput(e, 'configuracion')}
                            rows={4}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={marketplace.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-8">
                        <label htmlFor="ultimaSincronizacion">{intl.formatMessage({ id: 'Última Sincronización' })}</label>
                        <Calendar
                            id="ultimaSincronizacion"
                            value={marketplace.ultimaSincronizacion ? new Date(marketplace.ultimaSincronizacion) : null}
                            onChange={(e) => manejarCambioFecha(e, 'ultimaSincronizacion')}
                            disabled={!editable || estadoGuardando}
                            showTime
                            showSeconds
                            dateFormat="dd/mm/yy"
                            placeholder={intl.formatMessage({ id: 'Fecha y hora de la última sincronización' })}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosMarketplace;