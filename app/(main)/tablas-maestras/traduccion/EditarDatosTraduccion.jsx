import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';
import { getIdiomas } from "@/app/api-endpoints/idioma";

const EditarDatosTraduccionLiteral = ({ traduccion, setTraduccion, estadoGuardando, idiomas }) => {
    const intl = useIntl();
    return (
        <Fieldset legend={intl.formatMessage({ id: 'Datos para la traduccion' })}>	
            <div className="formgrid grid">
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-12">
                    <label htmlFor="clave"> <b>{intl.formatMessage({ id: 'Clave' })}*</b> </label>
                    <InputText value={traduccion.clave}
                        placeholder={intl.formatMessage({ id: 'Clave de la traduccion' })}
                        onChange={(e) => setTraduccion({ ...traduccion, clave: e.target.value })}
                        className={`${(estadoGuardando && traduccion.clave === "") ? "p-invalid" : ""}`}
                        rows={5} cols={30} />
                </div>

                {idiomas.map(idioma => (
                    <div key={idioma.id} className="flex flex-column field gap-2 mt-2 col-12 lg:col-12">
                        <label htmlFor={`valor-${idioma.nombre}`}>{idioma.nombre}</label>
                        <InputText 
                            value={traduccion[idioma.nombre.toLowerCase()] || ''}
                            placeholder={intl.formatMessage({ id: 'Valor de la traduccion en' }) + ' ' + idioma.nombre}
                            onChange={(e) => setTraduccion({ 
                                ...traduccion, 
                                [idioma.nombre.toLowerCase()]: e.target.value 
                            })}
                            rows={5} 
                            cols={30} 
                        />
                    </div>
                ))}
            </div>
        </Fieldset>
    );
};

export default EditarDatosTraduccionLiteral;