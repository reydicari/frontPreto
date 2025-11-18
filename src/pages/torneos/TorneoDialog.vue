<template>
  <q-card style="min-width: 420px; max-width: 720px;">
    <q-card-section>
      <div class="text-h6">{{ isEdit ? 'Editar torneo' : 'Nuevo torneo' }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form @submit.prevent="submit" ref="formRef">
        <q-input dense v-model="form.nombre" label="Nombre" :rules="[val => !!val || 'Requerido']" autofocus />

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6">
            <q-input dense v-model="form.fecha_inicio" label="Fecha inicio" type="date" />
          </div>
          <div class="col-6">
            <q-input dense v-model="form.fecha_fin" label="Fecha fin" type="date" :min="minFechaFin" />
            <div class="text-caption q-mt-xs">Mínimo permitido: {{ minFechaFin }}</div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6">
            <q-select dense v-model="form.id_tipo" :options="tiposOptions" label="Tipo de torneo" emit-value map-options
              clearable />
          </div>
          <div class="col-6">
            <q-select dense v-model="form.id_ubicacion" :options="ubicacionOptions" label="Ubicación" emit-value
              map-options clearable />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12">
            <q-select dense v-model="form.id_nivel" :options="nivelOptions" label="Nivel" emit-value map-options
              clearable />
          </div>
        </div>

        <div class="row q-mt-md">
          <q-space />
          <q-btn flat label="Cancelar" color="secondary" @click="$emit('cancel')" />
          <q-btn flat label="Asignar encargados" color="secondary" @click="showAssignDialog = true" />
          <q-btn label="Guardar" color="primary" :disable="!canSave" @click="submit" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>

  <AsignarEncargadoDialog v-model="showAssignDialog" :torneo="props.initial" :torneo-id="props.initial?.id"
    @assigned="handleAssigned" />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { listarTiposTorneo } from 'src/stores/torneo-store'
import { listarUbicaciones } from 'src/stores/ubicacion-store'
import { listarNiveles } from 'src/stores/nivel'
import AsignarEncargadoDialog from './AsignarEncargadoDialog.vue'
import { Notify } from 'quasar'

const props = defineProps({ initial: { type: [Object, null], default: null } })
const emit = defineEmits(['save', 'cancel'])

const isEdit = computed(() => !!props.initial)

const formRef = ref(null)


const tipos = ref([])
const ubicaciones = ref([])

// helpers de fechas
function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
function addMonthsStr(isoDateStr, months) {
  const d = new Date(isoDateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

const form = reactive({ nombre: '', fecha_inicio: '', fecha_fin: '', id_tipo: null, id_ubicacion: null, id_nivel: null, tipo_nombre: '', ubicacion_nombre: '', nivel_nombre: '' })

// encargados seleccionados (array de {id_torneo,id_persona})
form.encargados = []

const showAssignDialog = ref(false)

function handleAssigned(payload) {
  // payload: array of { id_torneo, id_persona }
  form.encargados = Array.isArray(payload) ? payload : []
  Notify.create({ type: 'positive', message: `${form.encargados.length} encargado(s) asignado(s)` })
  console.log('encargados: ', payload);
}

// si viene initial, cargar; si no, establecer por defecto: inicio hoy, fin hoy+1 mes
if (props.initial) {
  form.nombre = props.initial.nombre || ''
  form.fecha_inicio = props.initial.fecha_inicio || todayStr()
  form.fecha_fin = props.initial.fecha_fin || addMonthsStr(form.fecha_inicio || todayStr(), 1)
  form.id_tipo = props.initial.id_tipo_torneo || props.initial.tipo_torneo?.id || null
  form.id_ubicacion = props.initial.id_ubicacion || props.initial.ubicacion?.id || null
  form.id_nivel = props.initial.id_nivel || props.initial.nivel?.id || null
  form.tipo_nombre = props.initial.tipo_torneo?.nombre || ''
  form.ubicacion_nombre = props.initial.ubicacion?.nombre || ''
  form.nivel_nombre = props.initial.nivel?.nombre_nivel || ''
} else {
  form.fecha_inicio = todayStr()
  form.fecha_fin = addMonthsStr(form.fecha_inicio, 1)
}

// regla: fecha_fin no puede ser menor que fecha_inicio + 1 mes
const minFechaFin = computed(() => addMonthsStr(form.fecha_inicio || todayStr(), 1))
const fechaFinValida = computed(() => {
  try {
    return new Date(form.fecha_fin) >= new Date(minFechaFin.value)
  } catch {
    return false
  }
})

const canSave = computed(() => !!form.nombre && !!form.fecha_inicio && !!form.fecha_fin && !!form.id_tipo && !!form.id_ubicacion && !!form.id_nivel && fechaFinValida.value)

const tiposOptions = computed(() => tipos.value.map(t => ({ label: t.nombre, value: t.id })))
const ubicacionOptions = computed(() => ubicaciones.value.map(u => ({ label: u.nombre, value: u.id })))
const nivelOptions = computed(() => niveles.value.map(n => ({ label: n.nombre_nivel || n.nombre || n.label || 'N/A', value: n.id })))

const niveles = ref([])

onMounted(async () => {
  try {
    const [tList, uList, nivelesList] = await Promise.all([listarTiposTorneo().catch(() => []), listarUbicaciones().catch(() => []), listarNiveles().catch(() => [])])
    tipos.value = Array.isArray(tList) ? tList : (tList?.data || [])
    ubicaciones.value = Array.isArray(uList) ? uList : (uList?.data || [])
    niveles.value = Array.isArray(nivelesList) ? nivelesList : (nivelesList?.data || [])

    // Si no viene seleccionado y existe PETROAMBIENTAL, seleccionar por defecto
    if (!form.id_ubicacion) {
      const petro = ubicaciones.value.find(u => String(u.nombre).toLowerCase().includes('petroambiental'))
      if (petro) form.id_ubicacion = petro.id
    }

    // Si no viene tipo seleccionado y hay al menos uno, seleccionar el primero
    if (!form.id_tipo && tipos.value.length) {
      form.id_tipo = tipos.value[0].id
    }
    // Si no viene nivel seleccionado y hay al menos uno, seleccionar el primero
    if (!form.id_nivel && niveles.value.length) {
      form.id_nivel = niveles.value[0].id
    }
  } catch (err) {
    console.error('Error cargando tipos/ubicaciones', err)
  }
})

function submit() {
  if (!canSave.value) return

  // construir payload con ids seleccionados y objetos embebidos cuando estén disponibles
  const payload = {
    id: props.initial?.id || null,
    nombre: form.nombre,
    fecha_inicio: form.fecha_inicio,
    fecha_fin: form.fecha_fin,
    id_ubicacion: form.id_ubicacion,
    id_nivel: form.id_nivel,
    estado: 1,
    id_tipo_torneo: form.id_tipo,
    tipo_torneo: tipos.value.find(t => t.id === form.id_tipo) || { id: form.id_tipo || Date.now(), nombre: form.tipo_nombre || 'Desconocido', fases: props.initial?.tipo_torneo?.fases || [] },
    ubicacion: ubicaciones.value.find(u => u.id === form.id_ubicacion) || { id: form.id_ubicacion || Date.now(), nombre: form.ubicacion_nombre }
  }
  // attach nivel object if available
  payload.nivel = niveles.value.find(n => n.id === form.id_nivel) || { id: form.id_nivel, nombre_nivel: form.nivel_nombre }

  // No modificamos aquí el atributo `estado` del torneo: lo calcula el backend o se mantiene como está.
  console.log('nuevo torneo: ', payload);

  // attach encargados if any
  if (form.encargados && form.encargados.length) payload.encargados = form.encargados
  console.log('antes del amit del', payload);

  emit('save', payload)
}
</script>

<style scoped>
.q-card {
  overflow: visible
}
</style>
