import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { useIntl } from 'react-intl';
import { getEmpresasActivas, getUsuariosActivos } from "@/app/api-endpoints/log_acciones";

const EditarDatosLogAcciones = ({ logAccion, setLogAccion, estadoGuardando, opcionesResultado, opcionesTipo, editable }) => {
    const intl = useIntl();
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [empresasData, usuariosData] = await Promise.all([
                    getEmpresasActivas(),
                    getUsuariosActivos()
                ]);
                setEmpresas(empresasData);
                setUsuarios(usuariosData);
            } catch (error) {
                console.error('Error al cargar datos:', error);
            }
        };

        cargarDatos();
    }, []);

    const manejarCambio = (campo, valor) => {
        setLogAccion({ ...logAccion, [campo]: valor });
    };

    return (
        <Fieldset legend={intl.formatMessage({ id: 'Datos del log de acciones' })}>
            <div className="formgrid grid">
                
                {/* Usuario */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="usuarioId">{intl.formatMessage({ id: 'Usuario' })}</label>
                    <Dropdown
                        id="usuarioId"
                        value={logAccion.usuarioId}
                        options={usuarios}
                        optionLabel="nombre"
                        optionValue="id"
                        placeholder={intl.formatMessage({ id: 'Seleccione un usuario' })}
                        onChange={(e) => manejarCambio('usuarioId', e.value)}
                        disabled={!editable || estadoGuardando}
                        filter
                        showClear
                    />
                </div>

                {/* Tipo */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="tipo">{intl.formatMessage({ id: 'Tipo' })}</label>
                    <Dropdown
                        id="tipo"
                        value={logAccion.tipo}
                        options={opcionesTipo}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={intl.formatMessage({ id: 'Seleccione un tipo' })}
                        onChange={(e) => manejarCambio('tipo', e.value)}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* Resultado */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="resultado">{intl.formatMessage({ id: 'Resultado' })}</label>
                    <InputText
                        id="resultado"
                        value={logAccion.resultado || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: exitoso, fallido, error' })}
                        onChange={(e) => manejarCambio('resultado', e.target.value)}
                        maxLength={100}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* EndPoint */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="endPoint">{intl.formatMessage({ id: 'EndPoint' })}</label>
                    <InputText
                        id="endPoint"
                        value={logAccion.endPoint || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: /usuarios/create' })}
                        onChange={(e) => manejarCambio('endPoint', e.target.value)}
                        maxLength={255}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* Controlador */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="controller">{intl.formatMessage({ id: 'Controlador' })}</label>
                    <InputText
                        id="controller"
                        value={logAccion.controller || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: UsuarioController' })}
                        onChange={(e) => manejarCambio('controller', e.target.value)}
                        maxLength={100}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* Función */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="funcion">{intl.formatMessage({ id: 'Función' })}</label>
                    <InputText
                        id="funcion"
                        value={logAccion.funcion || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: crear, actualizar, eliminar' })}
                        onChange={(e) => manejarCambio('funcion', e.target.value)}
                        maxLength={100}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* Segundos */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="segundos">{intl.formatMessage({ id: 'Segundos' })}</label>
                    <InputNumber
                        id="segundos"
                        value={logAccion.segundos}
                        onValueChange={(e) => manejarCambio('segundos', e.value)}
                        placeholder={intl.formatMessage({ id: 'Tiempo en segundos' })}
                        minFractionDigits={2}
                        maxFractionDigits={3}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* Fecha Inicio */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="fechaInicio">{intl.formatMessage({ id: 'Fecha Inicio' })}</label>
                    <Calendar
                        id="fechaInicio"
                        value={logAccion.fechaInicio ? new Date(logAccion.fechaInicio) : null}
                        onChange={(e) => manejarCambio('fechaInicio', e.value)}
                        showTime
                        hourFormat="24"
                        placeholder={intl.formatMessage({ id: 'dd/mm/yyyy hh:mm:ss' })}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* Fecha Fin */}
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                    <label htmlFor="fechaFin">{intl.formatMessage({ id: 'Fecha Fin' })}</label>
                    <Calendar
                        id="fechaFin"
                        value={logAccion.fechaFin ? new Date(logAccion.fechaFin) : null}
                        onChange={(e) => manejarCambio('fechaFin', e.value)}
                        showTime
                        hourFormat="24"
                        placeholder={intl.formatMessage({ id: 'dd/mm/yyyy hh:mm:ss' })}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

                {/* URL */}
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label htmlFor="url">{intl.formatMessage({ id: 'URL' })}</label>
                    <InputText
                        id="url"
                        value={logAccion.url || ''}
                        placeholder={intl.formatMessage({ id: 'Ej: /api/usuarios' })}
                        onChange={(e) => manejarCambio('url', e.target.value)}
                        maxLength={500}
                        disabled={!editable || estadoGuardando}
                    />
                </div>

            </div>
        </Fieldset>
    );
};

export default EditarDatosLogAcciones;