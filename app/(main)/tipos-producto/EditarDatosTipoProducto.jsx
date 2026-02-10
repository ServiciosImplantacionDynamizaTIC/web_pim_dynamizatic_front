import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useIntl } from 'react-intl';

const EditarDatosTipoProducto = ({ tipoProducto, setTipoProducto, estadoGuardando, editable }) => {
    const intl = useIntl();

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setTipoProducto(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Tipo de Producto' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })} *</b></label>
                        <InputText
                            inputId="nombre"
                            value={tipoProducto?.nombre || ''}
                            onChange={(e) => manejarCambioInput(e, 'nombre')}
                            disabled={!editable || estadoGuardando}
                            maxLength={50}
                            placeholder={intl.formatMessage({ id: 'Nombre del tipo de producto' })}
                            className={(!tipoProducto?.nombre || tipoProducto?.nombre.trim() === '') ? 'p-invalid' : ''}
                        />
                        <small className="p-text-secondary">
                            {intl.formatMessage({ id: 'Máximo 50 caracteres' })}
                        </small>
                    </div>
                </div>
                
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea
                            inputId="descripcion"
                            value={tipoProducto?.descripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'descripcion')}
                            disabled={!editable || estadoGuardando}
                            rows={4}
                            cols={30}
                            maxLength={500}
                            autoResize
                            placeholder={intl.formatMessage({ id: 'Descripción detallada del tipo de producto' })}
                        />
                        <small className="p-text-secondary">
                            {intl.formatMessage({ id: 'Máximo 500 caracteres' })}
                            {tipoProducto?.descripcion && ` - ${tipoProducto.descripcion.length}/500`}
                        </small>
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosTipoProducto;