"use client";

import { Dialog } from 'primereact/dialog';
import { devuelveBasePath } from "@/app/utility/Utils";

/**
 * Componente para visualizar imágenes en tamaño completo
 * @param {boolean} visible - Controla si el diálogo es visible
 * @param {function} onHide - Función para cerrar el diálogo
 * @param {string} imageUrl - URL de la imagen a mostrar
 * @param {string} altText - Texto alternativo para la imagen
 */
const VisualizadorDeImagen = ({ visible, onHide, imageUrl, altText = "Imagen" }) => {
    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            style={{ width: '90vw', maxWidth: '1400px' }}
            modal
            dismissableMask
            closable
            header={altText}
        >
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <img 
                    src={`${devuelveBasePath()}${imageUrl}`}
                    alt={altText}
                    style={{ 
                        maxWidth: '100%', 
                        maxHeight: '80vh',
                        objectFit: 'contain'
                    }}
                />
            </div>
        </Dialog>
    );
};

export default VisualizadorDeImagen;
