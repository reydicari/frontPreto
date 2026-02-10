<template>
  <div>
    <q-select v-model="rangoSeleccionado" clearable :options="opcionesRango" :label="label" outlined dense emit-value
      map-options @update:model-value="onRangoChange" @click="onSelectClick">
      <template v-slot:prepend>
        <q-icon name="event" />
      </template>
    </q-select>

    <!-- Dialog para rango personalizado -->
    <q-dialog v-model="dialogPersonalizado">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Seleccionar Rango de Fechas</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-date v-model="rangoPersonalizado" range mask="YYYY-MM-DD" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" @click="cancelarPersonalizado" />
          <q-btn flat label="Aplicar" color="primary" @click="aplicarPersonalizado" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: 'Filtro de Fecha'
  },
  allowIndefinida: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const rangoSeleccionado = ref(null)
const rangoAnterior = ref(null)
const dialogPersonalizado = ref(false)
const rangoPersonalizado = ref(null)

const opcionesRango = computed(() => {
  const base = [
    { label: 'Esta Semana', value: 'esta-semana' },
    { label: 'Mes Actual', value: 'mes-actual' },
    { label: 'Proximo Mes', value: 'proximo-mes' },
    { label: 'Mes Anterior', value: 'mes-anterior' },
    { label: 'Este Año', value: 'este-ano' },
    { label: 'Año Anterior', value: 'ano-anterior' },
    { label: 'Personalizar', value: 'personalizar' }
  ]

  if (props.allowIndefinida) {
    return [{ label: 'Indefinida', value: 'indefinida' }, ...base]
  }

  return base
})

const formatearFecha = (fecha) => {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const calcularRango = (opcion) => {
  const hoy = new Date()
  let desde
  let hasta

  switch (opcion) {
    case 'indefinida':
      return null
    case 'esta-semana': {
      const diaSemana = hoy.getDay()
      const lunes = new Date(hoy)
      lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)
      desde = formatearFecha(lunes)
      hasta = formatearFecha(domingo)
      break
    }
    case 'mes-actual': {
      desde = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
      hasta = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))
      break
    }
    case 'proximo-mes': {
      desde = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1))
      hasta = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0))
      break
    }
    case 'mes-anterior': {
      desde = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1))
      hasta = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 0))
      break
    }
    case 'este-ano': {
      desde = formatearFecha(new Date(hoy.getFullYear(), 0, 1))
      hasta = formatearFecha(new Date(hoy.getFullYear(), 11, 31))
      break
    }
    case 'ano-anterior': {
      desde = formatearFecha(new Date(hoy.getFullYear() - 1, 0, 1))
      hasta = formatearFecha(new Date(hoy.getFullYear() - 1, 11, 31))
      break
    }
    default:
      return null
  }

  return `${desde}/${hasta}`
}

const onRangoChange = (valor) => {
  if (valor === 'personalizar') {
    rangoPersonalizado.value = null
    dialogPersonalizado.value = true
    return
  }

  rangoAnterior.value = valor

  if (valor === 'indefinida') {
    emit('update:modelValue', 'indefinido')
    return
  }

  const rango = calcularRango(valor)
  emit('update:modelValue', rango)
}

const onSelectClick = () => {
  if (rangoSeleccionado.value === 'personalizar') {
    dialogPersonalizado.value = true
  }
}

const aplicarPersonalizado = () => {
  if (!rangoPersonalizado.value) return

  let rango
  if (typeof rangoPersonalizado.value === 'string') {
    rango = rangoPersonalizado.value
  } else if (rangoPersonalizado.value.from && rangoPersonalizado.value.to) {
    rango = `${rangoPersonalizado.value.from}/${rangoPersonalizado.value.to}`
  }

  if (rango) {
    rangoAnterior.value = 'personalizar'
    emit('update:modelValue', rango)
    dialogPersonalizado.value = false
  }
}

const cancelarPersonalizado = () => {
  rangoSeleccionado.value = rangoAnterior.value || null
  dialogPersonalizado.value = false
}

onMounted(() => {
  emit('update:modelValue', null)
})
</script>
