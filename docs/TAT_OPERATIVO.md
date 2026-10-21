# TAT total y por etapa

Disponible en el editor de un caso guardado, dentro de **Registro operativo de etapas**, con `enableOperationalWorkflow` activado y permisos `cases.read` + `processing.read`. Usa el mismo historial que DEMO, producción local y Supabase ya proporcionan. No requiere SQL nuevo ni cambia los permisos, las transiciones o la firma del informe.

## Definiciones

- **TAT total:** recepción (`receivedAt`) → validación del informe (`validatedAt`). Si falta una recepción con hora y zona, se usa la entrada operativa a Recepción. No se usa la fecha de creación, recolección ni una finalización histórica como recepción.
- **En curso:** hasta el momento actual. La finalización operativa de Validación Final no cierra el TAT; lo cierra la validación del informe.
- **Espera de etapa:** entrada → inicio. Mientras no se inicie, avanza con el reloj.
- **Trabajo de etapa:** inicio → finalización. Mientras no se finalice, avanza con el reloj. Es tiempo transcurrido; no garantiza actividad continua de una persona o equipo.
- **TAT de etapa:** entrada → finalización, o hasta el momento actual si está abierta.
- **Espera y trabajo registrados del caso:** sumas de los intervalos medibles dentro de su período total.
- **Tiempo sin clasificar:** total menos espera y trabajo medidos. Incluye transferencias entre etapas, espera de validación del informe y períodos sin eventos. Evita atribuir esos huecos a trabajo o espera de una estación sin evidencia.

Todas las duraciones son calendario continuo, incluidos noches, festivos y fines de semana. Se calculan en milisegundos y se muestran en días de 24 horas, horas y minutos completos; menos de un minuto se muestra como `< 1 min`. El reloj visual se actualiza cada 30 segundos. **Actualizar registro** consulta los eventos guardados por otras terminales; el temporizador no hace consultas ni escribe datos.

## Calidad y alcance

Los eventos de Supabase conservan su hora del servidor. Los eventos locales y las fechas de recepción/validación conservan el origen de reloj existente. No se introducen nuevas marcas de tiempo ni se modifica el historial.

Una etapa histórica sin entrada/inicio muestra **Sin datos**, sin inventar el desglose. Fechas incompletas, inválidas, futuras o invertidas tampoco producen duraciones negativas. Etapas superpuestas o fuera del período del caso impiden conciliar las sumas: la pantalla pide revisar las fechas y conserva el TAT total si es calculable. Los huecos de etapas sin datos permanecen sin clasificar.

Los casos cerrados o cancelados sin una fecha válida de validación no siguen acumulando tiempo: el total y los intervalos abiertos quedan sin datos, manteniendo las duraciones de etapas completadas. No se toma la fecha de entrega como validación. Si se reabre un informe, el flujo existente limpia `validatedAt`: el total vuelve a avanzar desde la recepción original hasta la nueva validación, manteniendo los eventos operativos existentes. No hay ciclos independientes de retrabajo.

Este cambio ofrece el desglose por caso. No añade promedios entre casos, metas/SLA, calendarios laborables, alertas, ranking de responsables ni tableros de carga por estación.

## Verificación

`node --test tests/*.test.js` incluye pruebas de cierre real, espera/trabajo en curso, transferencias, datos históricos, reapertura, cancelación, fechas inválidas, aislamiento por caso, zonas horarias y solapamientos. La comprobación de navegador en DEMO y producción local verifica valores conocidos, recarga, cierre sin fecha y compatibilidad al desactivar el registro operativo.
