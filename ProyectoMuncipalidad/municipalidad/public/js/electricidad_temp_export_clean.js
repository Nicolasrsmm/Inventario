async function exportarHistorialReportesElectricidadPDF() {
    try {
        // Recopilar filtros actuales
        const filtros = {
            usuario: document.getElementById('filtro_historial_reporte_usuario_electricidad')?.value || '',
            oficina: document.getElementById('filtro_historial_reporte_oficina_electricidad')?.value || '',
            fecha_reporte: document.getElementById('filtro_historial_reporte_fecha_electricidad')?.value || '',
            fecha_solucion: document.getElementById('filtro_historial_reporte_fecha_solucion_electricidad')?.value || ''
        };

        // Obtener todos los reportes sin paginación (respetando los filtros aplicados)
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_reportes_recibidos',
                tipo_incidencia: 'Electricidad',
                filtro_estado: 'resuelto',
                filtros: filtros,
                pagina: 1,
                limite: 10000 // Número muy alto para obtener todos
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            mostrarCardEmergente(false, 'No hay reportes para exportar');
            return;
        }
        
        // Crear PDF usando jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        // Configuración de colores
        const colorAzul = [25, 118, 210];
        const colorGris = [128, 128, 128];
        
        // Agregar logo en la esquina superior derecha
        const logoPath = getAppBasePath() + '/images/muni.png';
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = logoPath;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => resolve();
                setTimeout(resolve, 1000);
            });
            
            if (img.complete && img.naturalWidth > 0) {
                const logoWidth = 30;
                const logoHeight = (img.naturalHeight / img.naturalWidth) * logoWidth;
                doc.addImage(img, 'PNG', doc.internal.pageSize.getWidth() - 40, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            console.warn('No se pudo cargar el logo:', e);
        }
        
        // Título del documento
        doc.setFontSize(18);
        doc.setTextColor(...colorAzul);
        doc.setFont('helvetica', 'bold');
        doc.text('HISTORIAL DE REPORTES', 20, 20);
        
        // Fecha
        const fecha = new Date();
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.setFontSize(10);
        doc.setTextColor(...colorGris);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de generación: ${fechaFormateada}`, 20, 30);
        
        // Total de reportes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorAzul);
        doc.text(`Total de reportes: ${result.data.length}`, 20, 37);
        
        let yPos = 50;
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginBottom = 20;
        const maxY = pageHeight - marginBottom;
        
        // Función auxiliar para verificar y agregar nueva página si es necesario
        const checkPageBreak = (requiredSpace) => {
            if (yPos + requiredSpace > maxY) {
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        };
        
        // Procesar cada reporte
        result.data.forEach((reporte, index) => {
            // Tipo de reporte
            const tipoIncidencia = reporte.tipo_incidencia || reporte.tipo_nombre || 'No especificado';
            
            // Usuario que envió el reporte
            const usuarioReporta = reporte.usuario_reporta_nombres && reporte.usuario_reporta_apellidos
                ? `${reporte.usuario_reporta_nombres} ${reporte.usuario_reporta_apellidos}${reporte.usuario_reporta_cargo ? ' - ' + reporte.usuario_reporta_cargo : ''}`
                : 'Usuario desconocido';
            
            // Usuario que respondió el reporte
            const tecnicoInfo = reporte.tecnico_nombres && reporte.tecnico_apellidos
                ? `${reporte.tecnico_nombres} ${reporte.tecnico_apellidos}${reporte.tecnico_cargo ? ' - ' + reporte.tecnico_cargo : ''}`
                : 'No asignado';
            
            // Fechas
            const fechaReporte = new Date(reporte.fecha_reporte);
            const fechaReporteFormateada = fechaReporte.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const fechaSolucionFormateada = reporte.fecha_solucion 
                ? new Date(reporte.fecha_solucion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'No especificada';
            
            // Descripción y respuesta
            const descripcion = reporte.descripcion_reporte || 'Sin descripción';
            const respuesta = reporte.descripcion_solucion || 'Sin respuesta';
            
            // Verificar espacio para el título del reporte
            checkPageBreak(10);
            
            // Título del reporte
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colorAzul);
            doc.text(`Reporte #${reporte.id_incidencia}`, 20, yPos);
            yPos += 7;
            
            // Tipo de reporte
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Tipo de reporte:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const tipoLines = doc.splitTextToSize(tipoIncidencia, 160);
            tipoLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 60, yPos);
                yPos += 5;
            });
            yPos += 2;
            
            // Usuario que envió
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Usuario que envió:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const usuarioReportaLines = doc.splitTextToSize(usuarioReporta, 160);
            usuarioReportaLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 65, yPos);
                yPos += 5;
            });
            yPos += 2;
            
            // Usuario que respondió
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Usuario que respondió:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const tecnicoLines = doc.splitTextToSize(tecnicoInfo, 160);
            tecnicoLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 75, yPos);
                yPos += 5;
            });
            yPos += 2;
            
            // Fecha de reporte
            checkPageBreak(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Fecha de reporte:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            doc.text(fechaReporteFormateada, 70, yPos);
            yPos += 6;
            
            // Fecha de solución
            checkPageBreak(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Fecha de solución:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            doc.text(fechaSolucionFormateada, 70, yPos);
            yPos += 6;
            
            // Descripción del reporte
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Descripción del reporte:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const descripcionLines = doc.splitTextToSize(descripcion, 170);
            descripcionLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 20, yPos);
                yPos += 5;
            });
            yPos += 3;
            
            // Respuesta
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Respuesta:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const respuestaLines = doc.splitTextToSize(respuesta, 170);
            respuestaLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 20, yPos);
                yPos += 5;
            });
            yPos += 5;
            
            // Línea separadora
            if (index < result.data.length - 1) {
                checkPageBreak(5);
                doc.setDrawColor(200, 200, 200);
                doc.line(20, yPos, 190, yPos);
                yPos += 5;
            }
        });
        
        // Guardar PDF
        doc.save(`Historial_Reportes_${fecha.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error al exportar historial de reportes:', error);
        mostrarCardEmergente(false, 'Error al exportar el historial. Por favor, intente nuevamente.');
    }
}
