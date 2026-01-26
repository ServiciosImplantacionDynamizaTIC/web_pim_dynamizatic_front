import React, { useState } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useIntl } from 'react-intl';

const EditarDatosEstado = ({ estado, setEstado, estadoGuardando, isEdit }) => {
    const intl = useIntl();

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del estado' })}>
                <div className="formgrid grid">
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={estado.nombre || ''}
                            placeholder={intl.formatMessage({ id: 'Nombre del estado' })}
                            onChange={(e) => setEstado({ ...estado, nombre: e.target.value })}
                            className={`${(estadoGuardando && !estado.nombre) ? "p-invalid" : ""}`}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea 
                            id="descripcion"
                            value={estado.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del estado' })}
                            onChange={(e) => setEstado({ ...estado, descripcion: e.target.value })}
                            rows={3}
                            maxLength={500}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosEstado;