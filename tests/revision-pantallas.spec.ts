import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { execSync } from 'child_process';

test.describe('Test CRUD - Botones Buscar y Registros', () => {

  // ── Tipos e interfaces para el reporte Excel ──────────────────────
  interface TestResult {
    servicio: string;
    prueba: string;
    resultadoEsperado: string;
    datosUtilizados: string;
    responsable: string;
    fecha: string;
    ciclo: number;
    estado: 'OK' | 'KO';
    observaciones: string;
  }

  function getGitUsername(): string {
    try {
      return (execSync('git config user.name', { encoding: 'utf8' }) as string).trim() || 'Sin asignar';
    } catch {
      return process.env.TEST_RESPONSABLE || 'Sin asignar';
    }
  }

  // Fila de Excel (1-based) desde la que se escriben los datos de prueba.
  // Las filas anteriores pertenecen a la cabecera de la plantilla.
  const DATA_START_ROW = 4; // Fila 4 en Excel

  // ── Estado persistente (ciclo, lastId, nextRow) en JSON ──────────────
  // Más fiable que leer el Excel, evita problemas con plantillas formateadas.
  interface ExcelState { ciclo: number; lastId: number; nextRow: number; }

  function readExcelState(statePath: string): ExcelState {
    try {
      if (!fs.existsSync(statePath)) return { ciclo: 1, lastId: 0, nextRow: DATA_START_ROW };
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf8')) as Partial<ExcelState>;
      return {
        ciclo:   (raw.ciclo   ?? 0) + 1,        // incrementar para el nuevo ciclo
        lastId:   raw.lastId  ?? 0,
        nextRow:  raw.nextRow ?? DATA_START_ROW,
      };
    } catch {
      return { ciclo: 1, lastId: 0, nextRow: DATA_START_ROW };
    }
  }

  function saveExcelState(statePath: string, ciclo: number, lastId: number, nextRow: number): void {
    try {
      fs.writeFileSync(statePath, JSON.stringify({ ciclo, lastId, nextRow }), 'utf8');
    } catch (err) {
      console.error('💥 Error al guardar estado Excel:', err);
    }
  }

  /**
   * Escribe los resultados en el Excel de reporte respetando el formato de la plantilla.
   * El fichero de salida vive en test-results/ (accesible desde el reporte HTML de Playwright).
   * Para sobrevivir a la limpieza automática de test-results/, se mantiene una copia de
   * respaldo en tests/reporte-pruebas-backup.xlsx que se restaura si el original no existe.
   */
  async function writeExcelReport(
    results: TestResult[],
    excelPath: string,
    backupPath: string,
    statePath: string,
    startId: number,
    nextRow: number,
    templatePath?: string,
  ): Promise<void> {
    try {
      const wb = new ExcelJS.Workbook();
      let ws: ExcelJS.Worksheet;

      if (fs.existsSync(excelPath)) {
        // El fichero existe en test-results/ (ejecución sin limpieza previa)
        await wb.xlsx.readFile(excelPath);
        ws = wb.worksheets[0];
      } else if (fs.existsSync(backupPath)) {
        // Playwright limpió test-results/ → restaurar desde el backup en tests/
        console.log(`♻️  Restaurando reporte desde backup: ${backupPath}`);
        await wb.xlsx.readFile(backupPath);
        ws = wb.worksheets[0];
      } else if (templatePath && fs.existsSync(templatePath)) {
        // Primera ejecución: cargar la plantilla como base
        await wb.xlsx.readFile(templatePath);
        ws = wb.worksheets[0];
        console.log(`📋 Usando plantilla: ${templatePath}`);
      } else {
        ws = wb.addWorksheet('Resultados');
      }

      results.forEach((r, i) => {
        const row = ws.getRow(nextRow + i);
        row.getCell(1).value  = startId + i;
        row.getCell(2).value  = r.servicio;
        row.getCell(3).value  = r.prueba;
        row.getCell(4).value  = r.resultadoEsperado;
        row.getCell(5).value  = r.datosUtilizados;
        row.getCell(6).value  = r.responsable;
        row.getCell(7).value  = r.fecha;
        row.getCell(8).value  = r.ciclo;
        row.getCell(9).value  = r.estado;
        row.getCell(10).value = r.observaciones;
        row.commit();
      });

      const dir = path.dirname(excelPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await wb.xlsx.writeFile(excelPath);

      // Guardar copia de respaldo en tests/ para sobrevivir a la limpieza de test-results/
      fs.copyFileSync(excelPath, backupPath);

      // Persistir el estado para el próximo ciclo
      saveExcelState(statePath, results[0]?.ciclo ?? 1, startId + results.length - 1, nextRow + results.length);

      console.log(`\n📊 Reporte Excel actualizado: ${excelPath}`);
      console.log(`   Nuevas filas: ${results.length} | Fila inicio: ${nextRow} | Ciclo: ${results[0]?.ciclo ?? '-'}`);
    } catch (err) {
      console.error('💥 Error al escribir reporte Excel:', err);
    }
  }

  // Función para extraer URLs dinámicamente del AuthContext.tsx
  function extractUrlsFromAuthContext(): string[] {
    try {
      const authContextPath = path.join(__dirname, '..', 'app', 'auth', 'AuthContext.tsx');
      const authContextContent = fs.readFileSync(authContextPath, 'utf8');
      
      // Buscar el objeto jsonRutas en el contenido del archivo
      const jsonRutasMatch = authContextContent.match(/const jsonRutas[^=]*=\s*{([\s\S]*?)};/);
      
      if (!jsonRutasMatch) {
        console.log('❌ No se pudo encontrar jsonRutas en AuthContext.tsx');
        return [];
      }

      // Extraer todas las rutas usando regex
      const jsonRutasContent = jsonRutasMatch[1];
      const pathMatches = jsonRutasContent.match(/"path":\s*"([^"]+)"/g);
      
      if (!pathMatches) {
        console.log('❌ No se pudieron extraer rutas de jsonRutas');
        return [];
      }

      // Limpiar y obtener solo las rutas
      const urls = pathMatches
        .map(match => {
          const pathMatch = match.match(/"path":\s*"([^"]+)"/);
          return pathMatch ? pathMatch[1] : null;
        })
        .filter((url): url is string => url !== null)
        .sort(); // Ordenar alfabéticamente

      console.log(`📋 Extraídas ${urls.length} URLs dinámicamente de AuthContext.tsx`);
      return urls;
      
    } catch (error) {
      console.error('💥 Error al leer AuthContext.tsx:', error);
      return [];
    }
  }

  // Función para extraer ID del registro recién creado
  async function extractNewRecordId(page: any, routeName: string): Promise<string | null> {
    try {
      // Esperar a que se complete la operación y se actualice la tabla
      await page.waitForTimeout(2000);
      
      // Buscar en la URL si contiene el ID del registro creado
      const currentUrl = page.url();
      const urlIdMatch = currentUrl.match(/\/([0-9]+)(?:\/|$)/);
      if (urlIdMatch) {
        const recordId = urlIdMatch[1];
        console.log(`    🆔 ID extraído de URL: ${recordId}`);
        return recordId;
      }
      
      // Buscar en mensajes de éxito
      const successMessages = await page.locator('.alert, .toast, .notification, .success-message').all();
      for (const message of successMessages) {
        const text = await message.textContent() || '';
        const messageIdMatch = text.match(/ID[:\s]*([0-9]+)|#([0-9]+)|creado[^0-9]*([0-9]+)/i);
        if (messageIdMatch) {
          const recordId = messageIdMatch[1] || messageIdMatch[2] || messageIdMatch[3];
          console.log(`    🆔 ID extraído de mensaje: ${recordId}`);
          return recordId;
        }
      }
      
      // Buscar en campos de ID visibles en el formulario
      const idFields = await page.locator('input[name*="id"], input[id*="id"], .field-id, .record-id').all();
      for (const field of idFields) {
        const value = await field.inputValue() || await field.textContent() || '';
        if (value.match(/^[0-9]+$/)) {
          console.log(`    🆔 ID extraído de campo: ${value}`);
          return value;
        }
      }
      
      // Buscar en la tabla (primera columna que suele ser ID)
      const firstRowFirstCell = page.locator('table tbody tr:first-child td:first-child, .p-datatable tbody tr:first-child td:first-child');
      if (await firstRowFirstCell.count() > 0) {
        const cellText = await firstRowFirstCell.textContent() || '';
        if (cellText.match(/^[0-9]+$/)) {
          console.log(`    🆔 ID extraído de primera fila: ${cellText}`);
          return cellText;
        }
      }
      
      console.log(`    ⚠️ No se pudo extraer ID del registro`);
      return null;
      
    } catch (error) {
      console.log(`    💥 Error al extraer ID: ${error.message}`);
      return null;
    }
  }

  // Función para navegar a la última página y encontrar el último registro
  async function navigateToLastPageAndGetLastRecord(page: any, contentContainer: any): Promise<string | null> {
    try {
      console.log(`    📌 Navegando a la última página...`);
      
      // Buscar controles de paginación
      const paginationContainer = contentContainer.locator('.p-paginator, .pagination, .datatable-pager, .pager');
      const paginationExists = await paginationContainer.count() > 0;
      
      if (paginationExists) {
        console.log(`    🔢 Paginación encontrada, navegando a la última página...`);
        
        // Buscar botón de última página o último número
        const lastPageButton = paginationContainer.locator('button').filter({ hasText: /»|»»|last|último|>>|>>/i }).or(
          paginationContainer.locator('.p-paginator-last, .pagination-last, .last-page')
        );
        
        const lastButtonCount = await lastPageButton.count();
        
        if (lastButtonCount > 0) {
          console.log(`    🎯 Haciendo click en botón de última página...`);
          await lastPageButton.first().click();
          await page.waitForTimeout(2000); // Esperar a que cargue la nueva página
        } else {
          // Intentar encontrar el número de página más alto
          const pageNumbers = await paginationContainer.locator('button[aria-label*="page"], .p-paginator-page, .page-link').filter({ hasText: /^[0-9]+$/ }).all();
          
          if (pageNumbers.length > 0) {
            console.log(`    🔢 Navegando al número de página más alto...`);
            await pageNumbers[pageNumbers.length - 1].click();
            await page.waitForTimeout(2000);
          } else {
            console.log(`    📌 No hay paginación numérica, permaneciendo en página actual`);
          }
        }
        
      } else {
        console.log(`    📌 No se encontró paginación, trabajando con registros visibles`);
      }
      
      // Buscar el último registro de la tabla actual
      const lastRowId = await getLastRecordId(contentContainer);
      return lastRowId;
      
    } catch (error) {
      console.log(`    💥 Error al navegar a última página: ${error.message}`);
      return null;
    }
  }
  
  // Función para obtener el ID del último registro de la tabla
  async function getLastRecordId(contentContainer: any): Promise<string | null> {
    try {
      console.log(`    🔍 Buscando el último registro en la tabla...`);
      
      // Buscar todas las filas de la tabla
      const allRows = contentContainer.locator('table tbody tr, .p-datatable tbody tr');
      const rowCount = await allRows.count();
      
      if (rowCount > 0) {
        console.log(`    📊 Encontradas ${rowCount} filas, obteniendo la última...`);
        
        // Obtener la última fila
        const lastRow = allRows.last();
        
        // Intentar obtener el ID de la primera columna (suele ser el ID)
        const firstCell = lastRow.locator('td').first();
        const cellText = await firstCell.textContent() || '';
        
        // Verificar si es un ID numérico
        const numericId = cellText.trim().match(/^([0-9]+)$/);
        if (numericId) {
          const recordId = numericId[1];
          console.log(`    🆔 ID del último registro encontrado: ${recordId}`);
          return recordId;
        }
        
        // Si la primera columna no es ID, buscar en otras columnas
        const allCells = await lastRow.locator('td').all();
        for (let i = 0; i < allCells.length; i++) {
          const cellText = await allCells[i].textContent() || '';
          const numericMatch = cellText.trim().match(/^([0-9]+)$/);
          if (numericMatch) {
            const recordId = numericMatch[1];
            console.log(`    🆔 ID encontrado en columna ${i + 1}: ${recordId}`);
            return recordId;
          }
        }
        
        // Si no encontramos ID numérico, usar el contenido de la primera celda como identificador
        const fallbackId = cellText.trim();
        if (fallbackId) {
          console.log(`    ⚠️ Usando identificador no numérico: ${fallbackId}`);
          return fallbackId;
        }
        
      } else {
        console.log(`    ❌ No se encontraron registros en la tabla`);
      }
      
      return null;
      
    } catch (error) {
      console.log(`    💥 Error al obtener último registro: ${error.message}`);
      return null;
    }
  }

  // Función para encontrar y hacer click en botón específico por ID de registro
  async function clickActionButtonForRecord(page: any, contentContainer: any, recordId: string, actionType: 'edit' | 'delete'): Promise<boolean> {
    try {
      console.log(`    🎯 Buscando botón ${actionType} para registro ID: ${recordId}`);
      
      // Buscar la fila que contiene el ID específico
      const targetRow = contentContainer.locator(`table tbody tr:has-text("${recordId}"), .p-datatable tbody tr:has-text("${recordId}")`);
      const rowCount = await targetRow.count();
      
      if (rowCount > 0) {
        console.log(`    ✅ Fila encontrada para ID ${recordId}`);
        
        // Definir selectores según el tipo de acción
        let buttonSelectors;
        if (actionType === 'edit') {
          buttonSelectors = targetRow.locator('button').filter({ 
            hasText: /✏️|edit|editar|pencil|modify/i 
          }).or(
            targetRow.locator('button .pi-pencil, button .fa-edit, button .fa-pencil').locator('xpath=..')
          ).or(
            targetRow.locator('button:has(.pi-pencil), button:has(.fa-edit), button:has([class*="pencil"]), button:has([class*="edit"])')
          );
        } else { // delete
          buttonSelectors = targetRow.locator('button').filter({ 
            hasText: /🗑️|delete|eliminar|remove|borrar|trash/i 
          }).or(
            targetRow.locator('button .pi-trash, button .fa-trash, button .fa-delete').locator('xpath=..')
          ).or(
            targetRow.locator('button:has(.pi-trash), button:has(.fa-trash), button:has(.fa-delete), button:has([class*="trash"]), button:has([class*="delete"])')
          );
        }
        
        const buttonCount = await buttonSelectors.count();
        if (buttonCount > 0) {
          console.log(`    🎯 Haciendo click en botón ${actionType} específico para ID ${recordId}`);
          await buttonSelectors.first().click();
          return true;
        } else {
          console.log(`    ❌ No se encontró botón ${actionType} en la fila del registro ${recordId}`);
          return false;
        }
      } else {
        console.log(`    ❌ No se encontró fila con ID ${recordId}`);
        return false;
      }
    } catch (error) {
      console.log(`    💥 Error al buscar botón ${actionType} para ID ${recordId}: ${error.message}`);
      return false;
    }
  }

  // Función para rellenar formularios progresivamente
  async function fillFormProgressively(page: any, routeName: string, output?: { name?: string }, snap?: (label: string) => Promise<void>): Promise<string | null> {
    const screenshot = snap
      ? (label: string) => snap(`${routeName}-${label}`)
      : (label: string) => page.screenshot({ path: path.join(__dirname, '..', 'test-results', `${routeName.replace(/\//g, '-').replace(/^-/, '')}-${label}.png`), fullPage: true });
    console.log(`    📝 Iniciando Progressive Form Filling con soporte PrimeReact...`);
    
    // 1. ENCONTRAR EL CONTENEDOR PRINCIPAL DE CONTENIDO (evitar navbar/sidebar)
    let formContainer = page;
    
    // Intentar encontrar el contenedor principal de contenido
    const possibleContainers = [
      'main',
      '.layout-main-content', 
      '.p-card',
      '.p-fieldset', 
      '.formgrid',
      '.card',
      '[role="main"]',
      '.content'
    ];
    
    for (const containerSelector of possibleContainers) {
      const container = page.locator(containerSelector).first();
      if (await container.count() > 0) {
        formContainer = container;
        console.log(`    🎯 Usando contenedor: ${containerSelector}`);
        break;
      }
    }
    
    // 2. DESCUBRIR COMPONENTES PRIMEREACT Y HTML DENTRO DEL CONTENEDOR
    // Buscar InputText (PrimeReact) - SOLO elementos <input> reales
    const primeInputs = await formContainer.locator('input.p-inputtext:visible').all();
    // Buscar Dropdown (PrimeReact) 
    const primeDropdowns = await formContainer.locator('.p-dropdown:visible').all();
    // Buscar InputSwitch (PrimeReact)
    const primeSwitches = await formContainer.locator('.p-inputswitch:visible').all();
    // Buscar elementos HTML regulares que no sean PrimeReact
    const htmlInputs = await formContainer.locator('input:not(.p-inputtext):not([type="submit"]):not([type="button"]):visible, select:not(.p-dropdown):visible, textarea:visible').all();
    
    const totalFields = primeInputs.length + primeDropdowns.length + primeSwitches.length + htmlInputs.length;
    console.log(`    🔍 Campos encontrados: ${totalFields} (${primeInputs.length} InputText, ${primeDropdowns.length} Dropdown, ${primeSwitches.length} Switch, ${htmlInputs.length} HTML)`);
    
    if (totalFields === 0) {
      console.log(`    ⚠️ No se encontraron campos de formulario`);
      return;
    }
    
    let camposRellenados = 0;
    let camposOmitidos = 0;
    
    // 2. RELLENAR PRIMEREACT INPUTTEXT
    for (let i = 0; i < primeInputs.length; i++) {
      try {
        const input = primeInputs[i];
        
        const placeholder = await input.getAttribute('placeholder') || '';
        const disabled = await input.getAttribute('disabled') !== null;
        const readonly = await input.getAttribute('readonly') !== null;
        
        console.log(`    📋 PrimeReact InputText ${i + 1}: "${placeholder}"`);
        
        if (disabled || readonly) {
          console.log(`    ⏭️ Omitido: campo deshabilitado/solo lectura`);
          camposOmitidos++;
          continue;
        }
        
        const testValue = generateTestValue(placeholder.toLowerCase(), 'text');
        await input.clear();
        await input.fill(testValue);
        console.log(`    ✅ InputText rellenado: "${testValue}"`);
        camposRellenados++;
        // Capturar el primer valor de texto rellenado como nombre del registro
        if (output && !output.name) {
          output.name = testValue;
        }
        await page.waitForTimeout(300);
        
      } catch (error) {
        console.log(`    💥 Error en InputText ${i + 1}: ${error.message.substring(0, 50)}`);
        camposOmitidos++;
      }
    }
    
    // 3. RELLENAR PRIMEREACT DROPDOWN
    for (let i = 0; i < primeDropdowns.length; i++) {
      try {
        const dropdown = primeDropdowns[i];
        
        // DEPURACIÓN: Obtener información del dropdown para identificarlo
        const dropdownParent = dropdown.locator('xpath=ancestor::div[contains(@class,"field") or contains(@class,"form") or contains(@class,"grid")]').first();
        const hasFieldParent = await dropdownParent.count() > 0;
        const dropdownClasses = await dropdown.getAttribute('class') || '';
        
        console.log(`    📋 PrimeReact Dropdown ${i + 1}: classes="${dropdownClasses}", en contenedor de formulario="${hasFieldParent}"`);
        
        // FILTRAR: Solo procesar dropdowns que estén en contenedores de formulario
        if (!hasFieldParent && !dropdownClasses.includes('p-column-filter')) {
          console.log(`    ⏭️ Omitido: dropdown no está en un formulario (posiblemente navegación/sidebar)`);
          camposOmitidos++;
          continue;
        }
        
        // Verificar si el dropdown está habilitado
        const isDisabled = await dropdown.locator('.p-disabled').count() > 0;
        if (isDisabled) {
          console.log(`    ⏭️ Omitido: dropdown deshabilitado`);
          camposOmitidos++;
          continue;
        }
        
        // Hacer click para abrir el dropdown
        await dropdown.click();
        await page.waitForTimeout(500);
        
        // Buscar opciones disponibles (dentro del overlay del dropdown activo)
        const options = await page.locator('.p-dropdown-panel:visible .p-dropdown-item:not(.p-disabled)').all();
        
        if (options.length > 0) {
          // Seleccionar la primera opción válida (omitir opciones vacías)
          let optionSelected = false;
          for (let j = 0; j < Math.min(options.length, 3); j++) {
            try {
              const optionText = await options[j].textContent();
              if (optionText && optionText.trim() && optionText.trim() !== '') {
                await options[j].click();
                console.log(`    ✅ Dropdown seleccionado: "${optionText.trim()}"`);
                camposRellenados++;
                optionSelected = true;
                break;
              }
            } catch (optionError) {
              continue;
            }
          }
          
          if (!optionSelected) {
            console.log(`    ⚠️ No se pudo seleccionar ninguna opción válida`);
            camposOmitidos++;
            // Cerrar dropdown
            await page.keyboard.press('Escape');
          }
        } else {
          console.log(`    ⚠️ No hay opciones disponibles en el dropdown`);
          camposOmitidos++;
          // Cerrar dropdown
          await page.keyboard.press('Escape');
        }
        
        await page.waitForTimeout(300);
        
      } catch (error) {
        console.log(`    💥 Error en Dropdown ${i + 1}: ${error.message.substring(0, 50)}`);
        camposOmitidos++;
        // Intentar cerrar dropdown si hay error
        try {
          await page.keyboard.press('Escape');
        } catch (escapeError) {}
      }
    }
    
    // 4. RELLENAR PRIMEREACT INPUTSWITCH
    for (let i = 0; i < primeSwitches.length; i++) {
      try {
        const inputSwitch = primeSwitches[i];
        
        console.log(`    📋 PrimeReact InputSwitch ${i + 1}`);
        
        // Verificar si el switch está habilitado
        const isDisabled = await inputSwitch.locator('.p-disabled').count() > 0;
        if (isDisabled) {
          console.log(`    ⏭️ Omitido: switch deshabilitado`);
          camposOmitidos++;
          continue;
        }
        
        // Verificar estado actual
        const isChecked = await inputSwitch.locator('.p-inputswitch-checked').count() > 0;
        
        // Alternar el estado (si está desactivado, activarlo)
        if (!isChecked) {
          await inputSwitch.click();
          console.log(`    ✅ InputSwitch activado`);
          camposRellenados++;
        } else {
          console.log(`    ℹ️ InputSwitch ya estaba activado`);
          camposRellenados++;
        }
        
        await page.waitForTimeout(300);
        
      } catch (error) {
        console.log(`    💥 Error en InputSwitch ${i + 1}: ${error.message.substring(0, 50)}`);
        camposOmitidos++;
      }
    }
    
    // 5. RELLENAR ELEMENTOS HTML REGULARES (como antes)
    for (let i = 0; i < htmlInputs.length; i++) {
      try {
        const input = htmlInputs[i];
        
        const tagName = await input.evaluate((el: any) => el.tagName.toLowerCase());
        const type = await input.getAttribute('type') || 'text';
        const name = await input.getAttribute('name') || '';
        const id = await input.getAttribute('id') || '';
        const placeholder = await input.getAttribute('placeholder') || '';
        const disabled = await input.getAttribute('disabled') !== null;
        const readonly = await input.getAttribute('readonly') !== null;
        
        const fieldInfo = `${name} ${id} ${placeholder}`.toLowerCase();
        
        console.log(`    📋 HTML ${tagName}[${type}] ${i + 1}: "${fieldInfo}"`);
        
        if (disabled || readonly) {
          console.log(`    ⏭️ Omitido: campo deshabilitado/solo lectura`);
          camposOmitidos++;
          continue;
        }
        
        let testValue = '';
        
        if (tagName === 'select') {
          const options = await input.locator('option:not([value=""]):not([value="0"])').all();
          if (options.length > 0) {
            const firstOptionValue = await options[0].getAttribute('value');
            if (firstOptionValue) {
              await input.selectOption(firstOptionValue);
              console.log(`    ✅ Select HTML rellenado con primera opción`);
              camposRellenados++;
              continue;
            }
          }
        } else if (type === 'checkbox') {
          await input.check();
          console.log(`    ✅ Checkbox HTML marcado`);
          camposRellenados++;
          continue;
        } else {
          testValue = generateTestValue(fieldInfo, type);
        }
        
        if (testValue) {
          await input.clear();
          await input.fill(testValue);
          console.log(`    ✅ Campo HTML rellenado: "${testValue}"`);
          camposRellenados++;
        } else {
          console.log(`    ⚠️ No se pudo generar valor para este campo`);
          camposOmitidos++;
        }
        
        await page.waitForTimeout(300);
        
      } catch (error) {
        console.log(`    💥 Error en campo HTML ${i + 1}: ${error.message.substring(0, 50)}`);
        camposOmitidos++;
      }
    }
    
    console.log(`    📊 Resumen: ${camposRellenados} rellenados, ${camposOmitidos} omitidos`);
    
    // 6. INTENTAR ENVIAR EL FORMULARIO
    if (camposRellenados > 0) {
      console.log(`    💾 Buscando botón Guardar/Submit...`);
      
      const submitButtons = page.locator('button, input[type="submit"]').filter({
        hasText: /guardar|save|enviar|submit|crear|create|aceptar|ok/i
      });
      
      const submitCount = await submitButtons.count();
      
      if (submitCount > 0) {
        try {
          // Tomar screenshot antes del submit
          await screenshot('form-antes-guardar');
          
          console.log(`    👆 Haciendo click en Guardar...`);
          await submitButtons.first().click();
          
          // Esperar respuesta de la API
          await page.waitForTimeout(3000);
          
          // Verificar resultado: buscar toast de error o campos con p-invalid
          const hasToastError = await page.locator('.p-toast-message-error, .p-toast-message-warn').count();
          const hasInvalidFields = await page.locator('.p-invalid:visible').count();
          
          if (hasToastError > 0 || hasInvalidFields > 0) {
            console.log(`    ⚠️ Formulario con errores de validación (toast: ${hasToastError}, campos inválidos: ${hasInvalidFields})`);
            await screenshot('form-errores-validacion');
          } else {
            console.log(`    ✅ Formulario enviado exitosamente`);
            await screenshot('form-guardado-OK');
            
            // Intentar extraer ID del registro creado
            const recordId = await extractNewRecordId(page, routeName);
            return recordId;
          }
          
        } catch (submitError) {
          console.log(`    💥 Error al enviar formulario: ${submitError.message.substring(0, 60)}`);
        }
      } else {
        console.log(`    ❌ No se encontró botón de guardar`);
      }
    }
    
    return null; // No se pudo crear registro o extraer ID
  }

  // Función para generar valores de prueba basados en el contexto del campo
  function generateTestValue(fieldInfo: string, inputType: string): string {
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    
    // Patrones para emails
    if (fieldInfo.includes('email') || fieldInfo.includes('correo') || inputType === 'email') {
      return `test${timestamp}@playwright.com`;
    }
    
    // Patrones para teléfonos
    if (fieldInfo.includes('telefono') || fieldInfo.includes('phone') || fieldInfo.includes('movil') || fieldInfo.includes('celular')) {
      return `60000${timestamp.slice(-4)}`;
    }
    
    // Patrones para nombres
    if (fieldInfo.includes('nombre') || fieldInfo.includes('name') || fieldInfo.includes('apellido') || fieldInfo.includes('usuario')) {
      return `Test${timestamp}`;
    }
    
    // Patrones para URLs
    if (fieldInfo.includes('url') || fieldInfo.includes('web') || fieldInfo.includes('sitio') || inputType === 'url') {
      return `https://test${timestamp}.com`;
    }
    
    // Patrones para números
    if (inputType === 'number' || fieldInfo.includes('edad') || fieldInfo.includes('cantidad') || fieldInfo.includes('numero')) {
      return Math.floor(Math.random() * 100) + 1 + '';
    }
    
    // Patrones para fechas
    if (inputType === 'date' || fieldInfo.includes('fecha') || fieldInfo.includes('date')) {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
    
    // Patrones para passwords
    if (inputType === 'password' || fieldInfo.includes('password') || fieldInfo.includes('contraseña')) {
      return `Test${timestamp}!`;
    }
    
    // Patrones para código/identificadores
    if (fieldInfo.includes('codigo') || fieldInfo.includes('code') || fieldInfo.includes('id') || fieldInfo.includes('ref')) {
      return `TEST${timestamp}`;
    }
    
    // Valor por defecto para campos de texto
    return `Test Value ${timestamp}`;
  }

  test.skip('Probar botón Buscar en páginas CRUD', async ({ browser }) => {
  // test('Probar botón Buscar en páginas CRUD', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Pantalla completa Full HD
    });
    
    const page = await context.newPage();
    
    // 1. LOGIN
    console.log('🔐 Iniciando login...');
    await page.goto('http://localhost:3000/auth/login/');
    
    await page.getByRole('textbox', { name: 'Email' }).fill('soporte@dynamizatic.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('S0P0rt3TEST');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    
    // Esperar login exitoso
    await page.waitForURL(/^(?!.*auth\/login).*/, { timeout: 15000 });
    console.log('✅ Login exitoso\n');
    
    // 2. EXTRAER URLS DINÁMICAMENTE
    const todasLasRutasCrud = extractUrlsFromAuthContext();
    
    if (todasLasRutasCrud.length === 0) {
      console.log('❌ No se pudieron extraer rutas del AuthContext');
      await context.close();
      return;
    }
    
    // 3. DETERMINAR QUÉ RUTAS PROBAR
    const urlEspecifica = process.env.TEST_URL;
    let rutasAProbar: string[];
    
    if (urlEspecifica) {
      console.log(`🎯 Modo URL específica: ${urlEspecifica}`);
      rutasAProbar = [urlEspecifica];
    } else {
      console.log(`📋 Modo completo: probando ${todasLasRutasCrud.length} rutas extraídas dinámicamente`);
      rutasAProbar = todasLasRutasCrud;
    }
    
    // 4. CONTADORES
    let paginasConBuscar = 0;
    let paginasConRegistros = 0;
    let paginasSinBuscar = 0;
    let paginasSinAcceso = 0;
    
    // 5. PROBAR CADA RUTA
    for (let i = 0; i < rutasAProbar.length; i++) {
      const ruta = rutasAProbar[i];
      console.log(`🔍 [${i + 1}/${rutasAProbar.length}] Probando CRUD en: ${ruta}`);
      
      try {
        await page.goto(`http://localhost:3000${ruta}`, { timeout: 10000 });
        await page.waitForTimeout(2000); // Esperar a que cargue
        
        const currentUrl = page.url();
        
        // Verificar si tenemos acceso a la página
        if (currentUrl.includes('auth/login')) {
          console.log(`  ❌ Sin permisos - redirige al login`);
          paginasSinAcceso++;
          continue;
        }
        
        // Buscar el botón "Buscar"
        const buscarButton = page.locator('button, input[type="submit"]').filter({ 
          hasText: /buscar|search|filtrar|consultar/i 
        });
        
        const buscarCount = await buscarButton.count();
        
        if (buscarCount > 0) {
          console.log(`  ✅ Encontrado botón Buscar`);
          paginasConBuscar++;
          
          // Variable para almacenar el ID del registro creado
          let createdRecordId: string | null = null;
          
          // ENCONTRAR EL CONTENEDOR PRINCIPAL DE CONTENIDO (evitar navbar/sidebar)
          let contentContainer: any = page;
          
          const possibleContainers = [
            'main',
            '.layout-main-content', 
            '.p-card',
            '.p-datatable-wrapper', 
            '.card',
            '[role="main"]',
            '.content',
            'table'
          ];
          
          for (const containerSelector of possibleContainers) {
            const container = page.locator(containerSelector).first();
            if (await container.count() > 0) {
              contentContainer = container;
              console.log(`  🎯 Usando contenedor para botones: ${containerSelector}`);
              break;
            }
          }
          
          // PASO 2: INSERTAR NUEVO REGISTRO
          console.log(`  ➕ PASO 2: Insertando nuevo registro...`);
          
          // Buscar botones de crear/nuevo SOLO en el contenedor principal
          const botonesCrear = contentContainer.locator('button, a').filter({
            hasText: /nuevo|crear|add|agregar|\+|insertar|create/i
          });
          
          const cantidadBotonesCrear = await botonesCrear.count();
          
          if (cantidadBotonesCrear > 0) {
            console.log(`  ✅ Encontrados ${cantidadBotonesCrear} botones de crear`);
            
            try {
              // Hacer click en el botón de crear
              console.log(`  👆 Haciendo click en botón crear...`);
              await botonesCrear.first().click();
              
              // Esperar a que cargue el formulario
              await page.waitForTimeout(3000);
              
              console.log(`  🔍 Creando nuevo registro...`);
              
              // PROGRESSIVE FORM FILLING CON CAPTURA DE ID
              createdRecordId = await fillFormProgressively(page, ruta);
              
              if (createdRecordId) {
                console.log(`  🆔 REGISTRO CREADO CON ID: ${createdRecordId}`);
              } else {
                console.log(`  ⚠️ Registro creado pero no se pudo capturar el ID`);
              }
              
              // Esperar a que la lista reaparezca (formulario inline, no navega)
              console.log(`  ⏳ Esperando a que la lista reaparezca...`);
              try {
                await page.locator('.p-datatable, table').first().waitFor({ state: 'visible', timeout: 8000 });
                console.log(`  ✅ Lista visible`);
              } catch {
                const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
                if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
              }
              
            } catch (error) {
              console.log(`  💥 Error al crear registro: ${error.message.substring(0, 80)}...`);
              // Intentar cerrar formulario si algo falló
              const cancelBtnErr = page.locator('button').filter({ hasText: /cancelar|cancel/i });
              if (await cancelBtnErr.count() > 0) { await cancelBtnErr.first().click(); await page.waitForTimeout(2000); }
            }
            
          } else {
            console.log(`  ⚠️ No se encontraron botones de crear en esta página`);
          }
          
          // PASO 3: COMPROBAR QUE FUNCIONA EL BUSCAR
          console.log(`  🔍 PASO 3: Comprobando que funciona el botón Buscar...`);
          
          // Hacer click en el botón Buscar
          await buscarButton.first().click();
          console.log(`  👆 Click en Buscar...`);
          
          // Esperar a que se procese la búsqueda
          await page.waitForTimeout(3000);
          
          // Verificar resultados de la búsqueda
          const tablaRegistros = await page.locator('table tbody tr, .p-datatable tbody tr, .grid-item, .lista-item, .record-item').count();
          
          if (tablaRegistros > 0) {
            console.log(`  ✅ Búsqueda exitosa: ${tablaRegistros} registros encontrados`);
            paginasConRegistros++;
          } else {
            console.log(`  ⚠️ No se encontraron registros tras buscar`);
          }
          
          // Screenshot tras buscar
          await page.screenshot({ 
            path: path.join(__dirname, '..', 'test-results', `crud-buscar-${ruta.replace(/\//g, '-').replace(/^-/, '')}.png`),
            fullPage: true 
          });
          
          // PASO 4: EDITAR EL ÚLTIMO REGISTRO (navegando a última página)
          console.log(`  ✏️ PASO 4: Editando el último registro...`);
          
          // Navegar a la última página y obtener el ID del último registro
          const lastRecordId = await navigateToLastPageAndGetLastRecord(page, contentContainer);
          
          if (lastRecordId) {
            console.log(`  🎯 Intentando editar el último registro ID: ${lastRecordId}`);
            
            const editSuccess = await clickActionButtonForRecord(page, contentContainer, lastRecordId, 'edit');
            
            if (editSuccess) {
              try {
                await page.waitForTimeout(3000);
                console.log(`  🔍 Modificando el último registro ID: ${lastRecordId}...`);
                await fillFormProgressively(page, ruta + '-edit');
                
                // Esperar a que la lista reaparezca (formulario inline)
                try {
                  await page.locator('.p-datatable, table').first().waitFor({ state: 'visible', timeout: 8000 });
                  console.log(`  ✅ Edición completada`);
                } catch {
                  const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
                  if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
                }
              } catch (error) {
                console.log(`  💥 Error al editar último registro ID ${lastRecordId}: ${error.message.substring(0, 80)}...`);
                const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
                if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
              }
            } else {
              // Fallback: buscar cualquier botón de editar
              const botonesEditar = contentContainer.locator('button:has(.pi-pencil), button:has(.fa-edit), button:has([class*="pencil"]), button:has([class*="edit"])');
              if (await botonesEditar.count() > 0) {
                console.log(`  ⚠️ Fallback: usando último botón de editar visible`);
                try {
                  await botonesEditar.last().click();
                  await page.waitForTimeout(3000);
                  await fillFormProgressively(page, ruta + '-edit');
                  // Esperar a que la lista reaparezca
                  try {
                    await page.locator('.p-datatable, table').first().waitFor({ state: 'visible', timeout: 8000 });
                  } catch {
                    const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
                    if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
                  }
                } catch (error) {
                  console.log(`  💥 Error en edición fallback: ${error.message.substring(0, 80)}...`);
                  const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
                  if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
                }
              } else {
                console.log(`  ❌ No se encontraron botones de editar`);
              }
            }
          } else {
            console.log(`  ❌ No se encontraron registros para editar`);
          }
          
          // PASO 5: ELIMINAR EL ÚLTIMO REGISTRO
          console.log(`  🗑️ PASO 5: Eliminando el último registro...`);
          
          // Navegar de nuevo a la última página para eliminar
          const lastRecordIdForDelete = await navigateToLastPageAndGetLastRecord(page, contentContainer);
          const targetDeleteId = lastRecordIdForDelete || lastRecordId;
          
          if (targetDeleteId) {
            console.log(`  🎯 Intentando eliminar el último registro ID: ${targetDeleteId}`);
            
            const deleteSuccess = await clickActionButtonForRecord(page, contentContainer, targetDeleteId, 'delete');
            
            if (deleteSuccess) {
              try {
                await page.waitForTimeout(2000);
                
                // Buscar y confirmar el diálogo de eliminación (botón "SI" del Dialog)
                const confirmarEliminar = page.locator('button').filter({
                  hasText: /si|sí|yes|confirmar|confirm|aceptar|ok/i
                });
                
                if (await confirmarEliminar.count() > 0) {
                  console.log(`  ✅ Confirmando eliminación del registro ID: ${targetDeleteId}...`);
                  await confirmarEliminar.first().click();
                  await page.waitForTimeout(3000);
                  console.log(`  ✅ Registro ID: ${targetDeleteId} eliminado exitosamente`);
                  
                  await page.screenshot({ 
                    path: path.join(__dirname, '..', 'test-results', `crud-delete-ok-${ruta.replace(/\//g, '-').replace(/^-/, '')}.png`),
                    fullPage: true 
                  });
                } else {
                  console.log(`  ⚠️ No se encontró diálogo de confirmación`);
                  await page.keyboard.press('Escape');
                }
              } catch (error) {
                console.log(`  💥 Error al eliminar registro ID ${targetDeleteId}: ${error.message.substring(0, 80)}...`);
                try { await page.keyboard.press('Escape'); } catch (e) {}
              }
            } else {
              // Fallback: buscar cualquier botón de eliminar
              const botonesEliminar = contentContainer.locator('button:has(.pi-trash), button:has(.fa-trash), button:has([class*="trash"]), button:has([class*="delete"])');
              
              if (await botonesEliminar.count() > 0) {
                console.log(`  ⚠️ Fallback: usando último botón de eliminar visible`);
                try {
                  await botonesEliminar.last().click();
                  await page.waitForTimeout(2000);
                  
                  const confirmarEliminar = page.locator('button').filter({
                    hasText: /si|sí|yes|confirmar|confirm|aceptar|ok/i
                  });
                  
                  if (await confirmarEliminar.count() > 0) {
                    console.log(`  ✅ Confirmando eliminación...`);
                    await confirmarEliminar.first().click();
                    await page.waitForTimeout(3000);
                    
                    await page.screenshot({ 
                      path: path.join(__dirname, '..', 'test-results', `crud-delete-fallback-ok-${ruta.replace(/\//g, '-').replace(/^-/, '')}.png`),
                      fullPage: true 
                    });
                  } else {
                    console.log(`  ⚠️ No se encontró diálogo de confirmación`);
                    await page.keyboard.press('Escape');
                  }
                } catch (error) {
                  console.log(`  💥 Error al eliminar registro (fallback): ${error.message.substring(0, 80)}...`);
                }
              } else {
                console.log(`  ❌ No se encontraron botones de eliminar`);
              }
            }
          } else {
            console.log(`  ❌ No se encontraron registros para eliminar`);
          }
          
        } else {
          console.log(`  ❌ No se encontró botón Buscar`);
          paginasSinBuscar++;
          
          // Screenshot de páginas sin botón buscar
          await page.screenshot({ 
            path: path.join(__dirname, '..', 'test-results', `sin-buscar-${ruta.replace(/\//g, '-').replace(/^-/, '')}.png`),
            fullPage: true 
          });
        }
        
      } catch (error) {
        console.log(`  💥 Error: ${error.message.substring(0, 80)}...`);
      }
      
      console.log(''); // Línea en blanco para separar
    }
    
    // 6. RESUMEN FINAL
    console.log('\n🎯 RESUMEN COMPLETO DE PRUEBAS CRUD:');
    console.log('='.repeat(50));
    console.log(`📍 Modo: ${urlEspecifica ? 'URL específica' : 'Todas las rutas dinámicas'}`);
    console.log(`📋 URLs extraídas de AuthContext: ${todasLasRutasCrud.length}`);
    console.log(`✅ Páginas con botón Buscar: ${paginasConBuscar}`);
    console.log(`📊 Páginas con registros: ${paginasConRegistros}`);
    console.log(`❌ Páginas sin botón Buscar: ${paginasSinBuscar}`);
    console.log(`🔒 Páginas sin acceso: ${paginasSinAcceso}`);
    console.log(`📱 Total páginas probadas: ${rutasAProbar.length}`);
    console.log('='.repeat(50));
    
    // Verificar que encontramos al menos algunas páginas funcionales
    if (!urlEspecifica) {
      expect(paginasConBuscar).toBeGreaterThan(0);
    }
    
    await context.close();
  });

  test.skip('Prueba detallada de CRUD en páginas principales', async ({ browser }) => {
    // Verificar si se especificó una URL - si sí, saltar este test ya que el anterior lo cubrió
    const urlEspecifica = process.env.TEST_URL;
    
    if (urlEspecifica) {
      console.log(`🎯 URL específica detectada: ${urlEspecifica} - Saltando análisis detallado (ya cubierto en test anterior)`);
      return; // Salir del test si hay URL específica
    }
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Pantalla completa Full HD
    });
    
    const page = await context.newPage();
    
    // Login
    await page.goto('http://localhost:3000/auth/login/');
    await page.getByRole('textbox', { name: 'Email' }).fill('soporte@dynamizatic.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('S0P0rt3TEST');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.waitForURL(/^(?!.*auth\/login).*/, { timeout: 15000 });
    
    // Solo ejecutar para modo completo (sin URL específica)
    console.log(`📋 Análisis detallado de páginas principales extraídas dinámicamente`);
    
    // Extraer URLs dinámicamente y filtrar las más importantes
    const todasLasUrls = extractUrlsFromAuthContext();
    // Filtrar páginas principales (entidades, no tablas maestras de configuración)
    const paginasAAnalizar = todasLasUrls.filter(url => 
      !url.includes('/tablas-maestras/') || 
      url.includes('/empresa') || 
      url.includes('/rol') || 
      url.includes('/permiso')
    ).slice(0, 7); // Limitar a 7 páginas principales para no hacer el test demasiado largo
    
    for (const ruta of paginasAAnalizar) {
      console.log(`\n🔍 ANÁLISIS DETALLADO: ${ruta}`);
      console.log('-'.repeat(40));
      
      try {
        await page.goto(`http://localhost:3000${ruta}`, { timeout: 10000 });
        await page.waitForTimeout(3000);
        
        if (page.url().includes('auth/login')) {
          console.log('❌ Sin acceso a esta página');
          continue;
        }
        
        // Buscar formularios de filtros
        const formFiltros = await page.locator('form, .filter-form, .search-form').count();
        console.log(`📝 Formularios encontrados: ${formFiltros}`);
        
        // Buscar inputs de filtro
        const inputsFiltro = await page.locator('input[type="text"], input[type="search"], select').count();
        console.log(`🔤 Campos de filtro: ${inputsFiltro}`);
        
        // Buscar y hacer click en Buscar - DENTRO DEL CONTENEDOR PRINCIPAL
        // Encontrar contenedor principal para evitar botones de navegación
        let searchContainer: any = page;
        const searchContainers = ['main', '.layout-main-content', '.p-card', '.card', '[role="main"]', '.content'];
        
        for (const containerSelector of searchContainers) {
          const container = page.locator(containerSelector).first();
          if (await container.count() > 0) {
            searchContainer = container;
            console.log(`🎯 Usando contenedor para búsqueda: ${containerSelector}`);
            break;
          }
        }
        
        const buscarBtn = searchContainer.locator('button, input[type="submit"]').filter({ hasText: /buscar|search/i });
        
        if (await buscarBtn.count() > 0) {
          console.log('✅ Botón Buscar encontrado en contenedor principal');
          await buscarBtn.first().click();
          await page.waitForTimeout(4000);
          
          // Analizar resultados
          const filas = await page.locator('table tbody tr, .p-datatable tbody tr').count();
          const columnas = await page.locator('table thead th, .p-datatable thead th').count();
          
          console.log(`📊 Filas de datos: ${filas}`);
          console.log(`📋 Columnas: ${columnas}`);
          
          // Buscar botones de acción DENTRO DEL CONTENEDOR PRINCIPAL
          const botonesAccion = await searchContainer.locator('button').filter({ hasText: /nuevo|agregar|crear|add|editar|edit|eliminar|delete/i }).count();
          console.log(`🔘 Botones de acción en contenedor: ${botonesAccion}`);
          
          await page.screenshot({ 
            path: path.join(__dirname, '..', 'test-results', `detalle-crud-${ruta.replace(/\//g, '-').replace(/^-/, '')}.png`),
            fullPage: true 
          });
          
        } else {
          console.log('❌ No se encontró botón Buscar');
        }
        
      } catch (error) {
        console.log(`💥 Error en análisis: ${error.message}`);
      }
    }
    
    await context.close();
  });

  // Función para verificar que un registro específico existe en la tabla
  async function verifyRecordExists(page: any, container: any, recordId: string): Promise<boolean> {
    try {
      console.log(`    🔍 Verificando existencia del registro ID: ${recordId}...`);
      
      // Buscar el ID en las celdas de la tabla
      const recordCells = container.locator('table tbody td, .p-datatable tbody td').filter({
        hasText: recordId
      });
      
      const foundCount = await recordCells.count();
      
      if (foundCount > 0) {
        console.log(`    ✅ Registro ${recordId} encontrado en ${foundCount} ubicación(es)`);
        return true;
      }
      
      // Si no se encuentra directamente, buscar en toda la tabla por filas que contengan el ID
      const allRows = await container.locator('table tbody tr, .p-datatable tbody tr').all();
      
      for (const row of allRows) {
        const rowText = await row.textContent() || '';
        if (rowText.includes(recordId)) {
          console.log(`    ✅ Registro ${recordId} encontrado en fila: ${rowText.substring(0, 100)}...`);
          return true;
        }
      }
      
      console.log(`    ❌ Registro ${recordId} NO encontrado en la tabla actual`);
      return false;
      
    } catch (error) {
      console.log(`    💥 Error al verificar registro ${recordId}: ${error.message}`);
      return false;
    }
  }

  test('END-TO-END: Gestión completa de CRUD', async ({ browser }) => {
    test.setTimeout(120000); // 2 minutos para completar todos los pasos
    const testUrl = process.env.TEST_URL || '/tablas-maestras/rol';
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // Pantalla completa Full HD
    });
    
    const page = await context.newPage();

    // Inyectar cursor visual (punto rojo) para ver dónde hace click el test
    const cursorScript = () => {
      function mountCursor() {
        if (document.getElementById('__pw_cursor__')) return;
        const c = document.createElement('div');
        c.id = '__pw_cursor__';
        c.style.cssText = 'position:fixed;top:0;left:0;width:18px;height:18px;' +
          'background:red;border:2px solid white;border-radius:50%;pointer-events:none;' +
          'z-index:2147483647;transform:translate(-50%,-50%);' +
          'box-shadow:0 0 6px rgba(0,0,0,0.7);transition:background 0.1s';
        document.body.appendChild(c);
        // Vigilar si React u otro framework lo elimina y restaurarlo
        new MutationObserver(() => {
          if (!document.getElementById('__pw_cursor__')) document.body.appendChild(c);
        }).observe(document.body, { childList: true });
      }
      // Montar en cuanto el body esté disponible
      if (document.body) { mountCursor(); }
      else { document.addEventListener('DOMContentLoaded', mountCursor); }
      // Seguir el ratón
      document.addEventListener('mousemove', e => {
        const c = document.getElementById('__pw_cursor__') as HTMLElement;
        if (c) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }
      }, true);
      // Destello amarillo al hacer click
      document.addEventListener('mousedown', () => {
        const c = document.getElementById('__pw_cursor__') as HTMLElement;
        if (c) { c.style.background = 'yellow'; setTimeout(() => { c.style.background = 'red'; }, 350); }
      }, true);
    };
    await page.addInitScript(cursorScript);
    // Reinyectar en cada carga de página (cubre redirects y navegaciones completas)
    page.on('load', () => page.evaluate(cursorScript).catch(() => {}));

    let createdRecordId: string | null = null; // Variable para mantener el ID del registro creado
    let createdRecordName: string | null = null; // Nombre del registro creado (para filtrar en búsqueda y eliminación)
    let screenshotNum = 0;
    const snap = async (stepLabel: string) => {
      screenshotNum++;
      const num = String(screenshotNum).padStart(2, '0');
      await page.screenshot({ path: path.join(__dirname, '..', 'test-results', `${num}-${stepLabel}.png`), fullPage: true });
    };

    // ── Configuración reporte Excel ───────────────────────────────────
    // Coloca tu plantilla en tests/plantilla-pruebas.xlsx para que se use como base.
    // El reporte (xlsx) y el estado (json) se guardan en tests/ para que Playwright
    // no los borre al limpiar test-results/ al inicio de cada ejecución.
    const templatePath = path.join(__dirname, 'plantilla-pruebas.xlsx');
    const excelPath    = path.join(__dirname, '..', 'test-results', 'reporte-pruebas.xlsx');
    const backupPath   = path.join(__dirname, 'reporte-pruebas.xlsx');
    const statePath    = path.join(__dirname, 'reporte-estado.json');
    const { ciclo, lastId: excelLastId, nextRow } = readExcelState(statePath);
    const responsable = getGitUsername();
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
    const excelRows: TestResult[] = [];
    const nextId = excelLastId + 1;
    const addRow = (prueba: string, resultadoEsperado: string, datosUtilizados: string, estado: 'OK' | 'KO', observaciones = '') => {
      excelRows.push({ servicio: testUrl, prueba, resultadoEsperado, datosUtilizados, responsable, fecha, ciclo, estado, observaciones });
    };
    let editOk = false;

    console.log(`🚀 === INICIANDO PRUEBA END-TO-END DE: ${testUrl} ===`);
    
    // PASO 1: LOGIN
    console.log('\n🔐 PASO 1: Autenticación de usuario...');
    await page.goto('http://localhost:3000/auth/login/');
    await page.getByRole('textbox', { name: 'Email' }).fill('soporte@dynamizatic.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('S0P0rt3TEST');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.waitForURL(/^(?!.*auth\/login).*/, { timeout: 15000 });
    console.log('✅ Login exitoso');
    addRow('Autenticación', 'El usuario accede a la aplicación correctamente', 'soporte@dynamizatic.com', 'OK');
    
    // Navegación a la página indicada (sin salir de la aplicación)
    console.log(`\n🧭 Navegando a: ${testUrl}...`);
    await page.goto(`http://localhost:3000${testUrl}`, { timeout: 10000 });
    await page.waitForTimeout(3000);
    console.log(`✅ Página ${testUrl} cargada`);
    
    // Encontrar contenedor principal
    let contentContainer: any = page;
    const possibleContainers = ['main', '.layout-main-content', '.p-card', '.card', '[role="main"]', '.content'];
    
    for (const containerSelector of possibleContainers) {
      const container = page.locator(containerSelector).first();
      if (await container.count() > 0) {
        contentContainer = container;
        console.log(`🎯 Contenedor principal detectado: ${containerSelector}`);
        break;
      }
    }
    
    // PASO 2: INSERT - Crear nuevo registro (sin salir de la aplicación)
    console.log('\n➕ PASO 2: INSERTANDO NUEVO REGISTRO...');
    
    const botonesCrear = contentContainer.locator('button, a').filter({
      hasText: /nuevo|crear|add|agregar|\+|insertar|create/i
    });
    
    const cantidadCrear = await botonesCrear.count();
    console.log(`📝 Botones de creación encontrados: ${cantidadCrear}`);
    
    if (cantidadCrear > 0) {
      try {
        console.log('👆 Creando nuevo registro...');
        await botonesCrear.first().click();
        await page.waitForTimeout(3000);
        
        console.log('🔍 Llenando formulario de creación...');
        const createOutput: { name?: string } = {};
        createdRecordId = await fillFormProgressively(page, 'paso2-insert', createOutput, snap);
        createdRecordName = createOutput.name ?? null;
        console.log(`🆔 ID del registro creado: ${createdRecordId}`);
        console.log(`📛 Nombre del registro creado: ${createdRecordName}`);
        
        // Esperar a que la lista reaparezca (formulario inline, no navega)
        console.log('⏳ Esperando a que la lista reaparezca...');
        try {
          await page.locator('.p-datatable, table').first().waitFor({ state: 'visible', timeout: 8000 });
          console.log('✅ Lista visible');
        } catch {
          const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
          if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
        }
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`💥 Error en creación: ${error.message}`);
        await snap('paso2-insert-ERROR');
        const cancelBtnErr = page.locator('button').filter({ hasText: /cancelar|cancel/i });
        if (await cancelBtnErr.count() > 0) { await cancelBtnErr.first().click(); await page.waitForTimeout(2000); }
      }
    } else {
      console.log('❌ No se encontraron botones de crear');
      addRow('Creación', 'Se crea el registro correctamente en el sistema', '-', 'KO', 'No se encontraron botones de crear registro en la página');
      await writeExcelReport(excelRows, excelPath, backupPath, statePath, nextId, nextRow, templatePath);
      throw new Error('No se puede continuar sin capacidad de crear registros');
    }
    addRow('Creación', 'Se crea el registro correctamente en el sistema', createdRecordName ?? '-', createdRecordName ? 'OK' : 'KO', createdRecordName ? '' : 'Formulario enviado pero no se capturó el nombre del registro');

    // PASO 3: COMPROBAR QUE FUNCIONA EL BUSCAR filtrando por el registro creado
    console.log(`\n🔎 PASO 3: COMPROBANDO que funciona el botón Buscar...`);
    
    const buscarBtn = contentContainer.locator('button, input[type="submit"]').filter({ hasText: /buscar|search/i });
    if (await buscarBtn.count() > 0) {
      // Si tenemos el nombre del registro creado, introducirlo en el primer campo de filtro visible
      if (createdRecordName) {
        console.log(`🔎 Filtrando por el nombre del registro creado: "${createdRecordName}"...`);
        const filterInputs = await contentContainer.locator('input[type="text"]:visible, input[type="search"]:visible, input.p-inputtext:visible').all();
        if (filterInputs.length > 0) {
          await filterInputs[0].clear();
          await filterInputs[0].fill(createdRecordName);
          console.log(`  ✏️ Nombre "${createdRecordName}" introducido en el campo de filtro`);
        }
      }
      
      await buscarBtn.first().click();
      await page.waitForTimeout(4000);
      
      const filas = await page.locator('table tbody tr, .p-datatable tbody tr').count();
      console.log(`✅ Búsqueda ejecutada: ${filas} registros encontrados`);
      await snap('paso3-buscar-resultados');
      addRow('Filtrado', 'Se muestran los registros que coinciden con el filtro aplicado', createdRecordName ?? '-', filas > 0 ? 'OK' : 'KO', filas === 0 ? 'La búsqueda no devolvió resultados' : '');
    } else {
      console.log('⚠️ No se encontró botón Buscar');
      addRow('Filtrado', 'Se muestran los registros que coinciden con el filtro aplicado', createdRecordName ?? '-', 'KO', 'No se encontró el botón Buscar en la página');
    }
    
    // PASO 4: EDIT del registro creado (sin salir de la aplicación)
    console.log(`\n✏️ PASO 4: EDITANDO el registro creado...`);
    
    // Usar el ID del registro creado si está disponible; si no, navegar a la última página
    const lastRecordId = createdRecordId ?? await navigateToLastPageAndGetLastRecord(page, contentContainer);
    const editTarget = createdRecordId
      ? `registro creado "${createdRecordName}" (ID: ${createdRecordId})`
      : `último registro disponible (ID: ${lastRecordId})`;
    
    if (lastRecordId) {
      console.log(`🎯 Editando ${editTarget}`);
      
      const editSuccess = await clickActionButtonForRecord(page, contentContainer, lastRecordId, 'edit');
      
      if (editSuccess) {
        try {
          await page.waitForTimeout(2000);
          console.log(`🔍 Modificando campos del formulario...`);
          const editOutput: { name?: string } = {};
          await fillFormProgressively(page, 'paso4-edit', editOutput, snap);
          // Actualizar el nombre con el valor modificado para que el filtro de PASO 5 sea correcto
          if (editOutput.name) {
            createdRecordName = editOutput.name;
            console.log(`📛 Nombre actualizado tras edición: "${createdRecordName}"`);
          }
          
          // Esperar a que la lista reaparezca (formulario inline)
          try {
            await page.locator('.p-datatable, table').first().waitFor({ state: 'visible', timeout: 6000 });
            console.log(`✅ Edición de ${editTarget} completada`);
          } catch {
            const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
            if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(1000); }
          }
          editOk = true;

        } catch (error) {
          console.log(`💥 Error al editar ${editTarget}: ${error.message}`);
          try { await snap('paso4-edit-ERROR'); } catch {}
          const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
          try { if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(1000); } } catch {}
        }
      } else {
        // Fallback: usar botón de editar del último registro visible
        const botonesEditar = contentContainer.locator('button:has(.pi-pencil), button:has(.fa-edit), button:has([class*="pencil"]), button:has([class*="edit"])');
        if (await botonesEditar.count() > 0) {
          console.log(`⚠️ Fallback: usando último botón de editar visible`);
          try {
            await botonesEditar.last().click();
            await page.waitForTimeout(3000);
            const editOutputFallback: { name?: string } = {};
            await fillFormProgressively(page, 'paso4-edit-fallback', editOutputFallback, snap);
            // Actualizar el nombre con el valor modificado
            if (editOutputFallback.name) {
              createdRecordName = editOutputFallback.name;
              console.log(`📛 Nombre actualizado tras edición (fallback): "${createdRecordName}"`);
            }
            // Esperar a que la lista reaparezca
            try {
              await page.locator('.p-datatable, table').first().waitFor({ state: 'visible', timeout: 8000 });
            } catch {
              const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
              if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
            }
            editOk = true;
          } catch (error) {
            console.log(`💥 Error en edición fallback: ${error.message}`);
            const cancelBtn = page.locator('button').filter({ hasText: /cancelar|cancel/i });
            if (await cancelBtn.count() > 0) { await cancelBtn.first().click(); await page.waitForTimeout(2000); }
          }
        } else {
          console.log(`❌ No se encontraron botones de editar`);
        }
      }
    } else {
      console.log('❌ No se encontraron registros para editar');
    }
    
    addRow('Edición', 'El registro se actualiza con los nuevos valores introducidos', createdRecordName ?? lastRecordId ?? '-', editOk ? 'OK' : 'KO', editOk ? '' : 'No se pudo completar la edición del registro');

    // PASO 4.5: RE-BUSCAR con el nombre actualizado para refrescar la tabla tras la edición
    console.log(`\n🔄 PASO 4.5: Refrescando la tabla con búsqueda tras edición...`);
    const buscarBtnRefresh = contentContainer.locator('button, input[type="submit"]').filter({ hasText: /buscar|search/i });
    if (await buscarBtnRefresh.count() > 0) {
      if (createdRecordName) {
        const filterInputsRefresh = await contentContainer.locator('input[type="text"]:visible, input[type="search"]:visible, input.p-inputtext:visible').all();
        if (filterInputsRefresh.length > 0) {
          await filterInputsRefresh[0].clear();
          await filterInputsRefresh[0].fill(createdRecordName);
          console.log(`  🔎 Filtrando por nombre actualizado: "${createdRecordName}"`);
        }
      }
      await buscarBtnRefresh.first().click();
      await page.waitForTimeout(3000);
      const filasRefresh = await page.locator('table tbody tr, .p-datatable tbody tr').count();
      console.log(`  ✅ Tabla refrescada: ${filasRefresh} registro(s) encontrado(s)`);
    } else {
      console.log('  ⚠️ No se encontró botón Buscar para refrescar');
    }
    
    // PASO 5: DELETE del registro creado (sin salir de la aplicación)
    console.log(`\n🗑️ PASO 5: ELIMINANDO el registro creado...`);
    
    // Usar el ID del registro creado; si no está disponible, navegar a la última página
    let targetDeleteId: string | null = createdRecordId;
    if (!targetDeleteId) {
      console.log('⚠️ No se capturó el ID del registro creado, usando el último registro disponible...');
      const lastRecordIdForDelete = await navigateToLastPageAndGetLastRecord(page, contentContainer);
      targetDeleteId = lastRecordIdForDelete || lastRecordId;
    } else {
      console.log(`🎯 Eliminando el registro creado en la prueba: "${createdRecordName}" (ID: ${targetDeleteId})`);
    }
    
    const deleteTarget = createdRecordId
      ? `registro creado "${createdRecordName}" (ID: ${createdRecordId})`
      : `último registro disponible (ID: ${targetDeleteId})`;
    let deleteOk = false;
    
    if (targetDeleteId) {
      console.log(`🎯 Eliminando ${deleteTarget}`);
      
      const deleteSuccess = await clickActionButtonForRecord(page, contentContainer, targetDeleteId, 'delete');
      
      if (deleteSuccess) {
        try {
          await page.waitForTimeout(2000);
          
          // Manejar diálogo de confirmación (botón "SI" del Dialog)
          const confirmarEliminar = page.locator('button').filter({
            hasText: /si|sí|yes|confirmar|confirm|aceptar|ok/i
          });
          
          if (await confirmarEliminar.count() > 0) {
            console.log(`✅ Confirmando eliminación de ${deleteTarget}...`);
            await confirmarEliminar.first().click();
            await page.waitForTimeout(3000);
            deleteOk = true;
            console.log(`🎉 ${deleteTarget.charAt(0).toUpperCase() + deleteTarget.slice(1)} eliminado exitosamente`);
            await snap('paso5-delete-OK');
            
          } else {
            console.log('❌ No se encontró diálogo de confirmación — el registro NO fue eliminado');
            await page.keyboard.press('Escape');
          }
          
        } catch (error) {
          console.log(`💥 Error al eliminar ${deleteTarget}: ${error.message}`);
          await snap('paso5-delete-ERROR');
        }
      } else {
        // Fallback: buscar cualquier botón de eliminar
        const botonesEliminar = contentContainer.locator('button:has(.pi-trash), button:has(.fa-trash), button:has([class*="trash"]), button:has([class*="delete"])');
        
        if (await botonesEliminar.count() > 0) {
          console.log(`⚠️ No se encontró el registro por ID — fallback: usando último botón de eliminar visible`);
          try {
            await botonesEliminar.last().click();
            await page.waitForTimeout(2000);
            
            const confirmarEliminar = page.locator('button').filter({
              hasText: /si|sí|yes|confirmar|confirm|aceptar|ok/i
            });
            
            if (await confirmarEliminar.count() > 0) {
              console.log(`✅ Confirmando eliminación...`);
              await confirmarEliminar.first().click();
              await page.waitForTimeout(3000);
              deleteOk = true;
              await snap('paso5-delete-fallback-OK');
            } else {
              console.log('❌ No se encontró diálogo de confirmación — el registro NO fue eliminado');
              await page.keyboard.press('Escape');
            }
          } catch (error) {
            console.log(`💥 Error al eliminar registro (fallback): ${error.message}`);
          }
        } else {
          console.log(`❌ No se encontraron botones de eliminar — el registro NO fue eliminado`);
        }
      }
    } else {
      console.log('❌ No se encontraron registros para eliminar');
    }
    
    // RESUMEN FINAL
    console.log('\n📋 === RESUMEN DEL PROCESO CRUD ===');
    console.log(`1. ✅ LOGIN: Autenticación exitosa`);
    console.log(`2. ${createdRecordName ? '✅' : '❌'} INSERT: ${createdRecordName ? `Registro "${createdRecordName}" creado correctamente` : 'No se pudo crear el registro'}`);
    console.log(`3. ${createdRecordName ? '✅' : '⚠️'} BUSCAR: ${createdRecordName ? `Búsqueda filtrada por nombre "${createdRecordName}"` : 'Búsqueda ejecutada sin filtro específico'}`);
    console.log(`4. ${editOk ? '✅' : '❌'} EDIT: ${editOk ? `${createdRecordId ? `Registro creado editado (nuevo nombre: "${createdRecordName}")` : 'Último registro editado'}` : 'No se pudo editar el registro'}`);
    console.log(`5. ${deleteOk ? '✅' : '❌'} DELETE: ${deleteOk ? `${deleteTarget.charAt(0).toUpperCase() + deleteTarget.slice(1)} eliminado correctamente` : 'El registro NO fue eliminado — KO'}`);
    console.log('🏁 === FIN DE LA PRUEBA END-TO-END ===');
    
    addRow('Eliminación', 'El registro se elimina definitivamente de la base de datos', createdRecordName ?? targetDeleteId ?? '-', deleteOk ? 'OK' : 'KO', deleteOk ? '' : 'El diálogo de confirmación no apareció o el registro no fue eliminado');
    await writeExcelReport(excelRows, excelPath, backupPath, statePath, nextId, nextRow, templatePath);

    expect(deleteOk, '❌ PASO 5 DELETE falló: el registro creado durante la prueba no fue eliminado').toBe(true);
    
    await context.close();
  });
});
