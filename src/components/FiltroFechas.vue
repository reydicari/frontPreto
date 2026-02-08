<template>
  <q-select dense outlined v-model="rangoSeleccionado" :options="opcionesRango" label="Rango de Fechas" emit-value
    map-options clearable @update:model-value="onRangoChange" class="filter-input">
    <template v-slot:prepend>
      <q-icon name="date_range" color="green-7" />
    </template>

    <template v-slot:append v-if="rangoSeleccionado === 'personalizar'">
      <q-icon name="edit_calendar" color="primary" />
    </template>
  </q-select>

  <!-- Dialog para selección personalizada de fechas -->
  <q-dialog v-model="dialogPersonalizado" persistent>
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Seleccionar Rango de Fechas</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-date v-model="rangoPersonalizado" range mask="YYYY-MM-DD" color="primary" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="negative" v-close-popup @click="cancelarPersonalizado" />
        <q-btn flat label="Aceptar" color="primary" @click="aplicarPersonalizado" :disable="!rangoValido" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const emit = defineEmits(['update:desde', 'update:hasta'])

// Estado
const rangoSeleccionado = ref('este-año')
const rangoAnterior = ref('este-año')
const dialogPersonalizado = ref(false)
const rangoPersonalizado = ref(null)

// Opciones de rango
const opcionesRango = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Ayer', value: 'ayer' },
  { label: 'Mes Actual', value: 'mes-actual' },
  { label: 'Mes Anterior', value: 'mes-anterior' },
  { label: 'Este Año', value: 'este-año' },
  { label: 'Personalizar...', value: 'personalizar' }
]

// Validar que el rango personalizado tenga dos fechas
const rangoValido = computed(() => {
  if (!rangoPersonalizado.value) return false
  if (typeof rangoPersonalizado.value === 'string') return false
  return rangoPersonalizado.value.from && rangoPersonalizado.value.to
})

// Calcular fechas iniciales al montar el componente
onMounted(() => {
  calcularFechas('este-año')
})
// Función para obtener fechas según el rango seleccionado
function calcularFechas(rango) {
  const hoy = new Date()
  let desde = null
  let hasta = null

  switch (rango) {
    case 'hoy':
      desde = formatearFecha(hoy)
      hasta = formatearFecha(hoy)
      break

    case 'ayer':
      {
        const ayer = new Date(hoy)
        ayer.setDate(hoy.getDate() - 1)
        desde = formatearFecha(ayer)
        hasta = formatearFecha(ayer)
        break
      }

    case 'mes-actual':
      {
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        desde = formatearFecha(primerDiaMes)
        hasta = formatearFecha(ultimoDiaMes)
        break
      }

    case 'mes-anterior':
      {
        const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        desde = formatearFecha(primerDiaMesAnterior)
        hasta = formatearFecha(ultimoDiaMesAnterior)
        break
      }

    case 'este-año':
      {
        const primerDiaAño = new Date(hoy.getFullYear(), 0, 1)
        const ultimoDiaAño = new Date(hoy.getFullYear(), 11, 31)
        desde = formatearFecha(primerDiaAño)
        hasta = formatearFecha(ultimoDiaAño)
        break
      }

    case 'personalizar':
      dialogPersonalizado.value = true
      return

    default:
      // Si algo falla, usar "este-año"
      {
        const primerDiaAño = new Date(hoy.getFullYear(), 0, 1)
        const ultimoDiaAño = new Date(hoy.getFullYear(), 11, 31)
        desde = formatearFecha(primerDiaAño)
        hasta = formatearFecha(ultimoDiaAño)
      }
  }

  emit('update:desde', desde)
  emit('update:hasta', hasta)
}

// Formatear fecha a YYYY-MM-DD
function formatearFecha(fecha) {
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${año}-${mes}-${dia}`
}

// Manejar cambio de rango
function onRangoChange(valor) {
  if (!valor) {
    // Si se limpia el select, volver a establecer "este año"
    rangoSeleccionado.value = 'este-año'
    rangoAnterior.value = 'este-año'
    calcularFechas('este-año')
  } else if (valor === 'personalizar') {
    // Guardar el rango anterior antes de abrir el dialog
    if (rangoSeleccionado.value !== 'personalizar') {
      rangoAnterior.value = rangoSeleccionado.value
    }
    calcularFechas(valor)
  } else {
    // Actualizar el rango anterior cuando se selecciona una opción válida
    rangoAnterior.value = valor
    calcularFechas(valor)
  }
}

// Aplicar rango personalizado
function aplicarPersonalizado() {
  if (!rangoValido.value) return

  const { from, to } = rangoPersonalizado.value
  emit('update:desde', from)
  emit('update:hasta', to)
  dialogPersonalizado.value = false
}

// Cancelar personalización
function cancelarPersonalizado() {
  // Restaurar el rango anterior en lugar de limpiar
  const valorRestaurar = rangoAnterior.value || 'este-año'
  rangoSeleccionado.value = valorRestaurar
  rangoPersonalizado.value = null
  calcularFechas(valorRestaurar)
}

// Watch para cerrar dialog si se limpia el select
watch(rangoSeleccionado, (newVal) => {
  if (!newVal) {
    dialogPersonalizado.value = false
    rangoPersonalizado.value = null
  }
})
</script>

<style scoped lang="scss"></style>
