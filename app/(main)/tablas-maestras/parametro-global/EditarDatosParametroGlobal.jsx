import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { useIntl } from 'react-intl';

const EditarDatosParametroGlobal = ({ parametroGlobal, setParametroGlobal, estadoGuardando, opcionesTipoDato, editable }) => {
    const intl = useIntl();

    const manejarCambio = (campo, valor) => {
        setParametroGlobal({ ...parametroGlobal, [campo]: valor });
    };

    return (
        <Fieldset legend={intl.formatMessage({ id: 'Datos del Parámetro Global' })}>
            <div className="formgrid grid">
                
                {/* Clave */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="clave">{intl.formatMessage({ id: 'Clave' })} *</label>
                    <InputText
                        id="clave"
                        value={parametroGlobal.clave || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: correosEnvioLogSincro' })}
                        onChange={(e) => manejarCambio('clave', e.target.value)}
                        maxLength={100}
                        disabled={parametroGlobal.id}
                        className={estadoGuardando && (!parametroGlobal.clave || parametroGlobal.clave.trim() === '') ? 'p-invalid' : ''}
                    />
                </div>

                {/* Valor */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="valor">{intl.formatMessage({ id: 'Valor' })} *</label>
                    <InputText
                        id="valor"
                        value={parametroGlobal.valor || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: admin@empresa.com' })}
                        onChange={(e) => manejarCambio('valor', e.target.value)}
                        maxLength={500}
                        disabled={!editable || estadoGuardando}
                        className={estadoGuardando && (!parametroGlobal.valor || parametroGlobal.valor.trim() === '') ? 'p-invalid' : ''}
                    />
                </div>

                {/* Tipo de Dato */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="tipoDato">{intl.formatMessage({ id: 'Tipo de Dato' })} *</label>
                    <Dropdown
                        id="tipoDato"
                        value={parametroGlobal.tipoDato}
                        options={opcionesTipoDato}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={intl.formatMessage({ id: 'Seleccione un tipo' })}
                        onChange={(e) => manejarCambio('tipoDato', e.value)}
                        disabled={!editable || estadoGuardando}
                        className={estadoGuardando && !parametroGlobal.tipoDato ? 'p-invalid' : ''}
                    />
                </div>

                {/* Descripción */}
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                    <InputTextarea
                        id="descripcion"
                        value={parametroGlobal.descripcion || ''}
                        placeholder={intl.formatMessage({ id: 'Descripción del parámetro (opcional)' })}
                        onChange={(e) => manejarCambio('descripcion', e.target.value)}
                        rows={3}
                        maxLength={500}
                        disabled={!editable || estadoGuardando}
                    />
                </div>
                
            </div>
        </Fieldset>
    );
};

export default EditarDatosParametroGlobal;