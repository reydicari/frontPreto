<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width:520px; max-width:900px">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Asistencias del entrenamiento</div>
          <div class="text-caption text-grey">Total: {{ asistencias.length }}</div>
        </div>
        <div class="row items-center">
          <q-btn dense flat color="primary" icon="close" v-close-popup @click="closeDialog" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list bordered padding>
          <q-item v-for="a in asistencias" :key="a.id || `${a.id_persona}-${a.fecha}`">
            <q-item-section>
              <q-item-label>
                <strong>{{ personaLabel(a) }}</strong>
              </q-item-label>
              <q-item-label caption>{{ a.fecha }} • {{ a.es_entrenador ? 'Entrenador' : 'Estudiante' }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn dense flat color="secondary" label="Progreso" @click="openProgressDialog(a)" />
            </q-item-section>
          </q-item>
          <q-item v-if="!asistencias.length">
            <q-item-section>
              <q-item-label caption>No hay registros de asistencia para este entrenamiento.</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Lista de progresos locales -->
        <div class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">Progresos agregados </div>
          <q-list bordered>
            <q-item v-for="p in progresos" :key="p.id_persona + '-' + p.id_cualidad + '-' + p.fecha">
              <q-item-section>
                <q-item-label>{{ personaNameById(p.id_persona) }}</q-item-label>
                <q-item-label caption> Cualidad: {{ cualidadNameById(p.id_cualidad) }} • Valor: {{ p.valor }} • {{
                  p.fecha }}</q-item-label>
                <q-item-label caption>{{ p.comentario }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn dense flat color="negative" icon="close" @click="removeProgreso(p)" />
              </q-item-section>
            </q-item>
            <q-item v-if="!progresos.length">
              <q-item-section>
                <q-item-label caption>No hay progresos agregados.</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Generar progresos" color="primary" @click="generateProgresos" />
        <q-btn flat label="Cerrar" v-close-popup @click="closeDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog para capturar progreso por estudiante -->
  <q-dialog v-model="progressDialog">
    <q-card style="min-width:420px">
      <q-card-section>
        <div class="text-h6">Agregar progreso para: {{ personaLabel(selectedAsistencia) }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-select v-model="selectedCualidad" :options="cualidades" option-value="id" option-label="nombre"
          label="Cualidad" outlined dense />
        <div class="q-mt-md">
          <q-rating v-model="progresoValor" max="5" color="amber" />
        </div>
        <q-input v-model="progresoComentario" type="textarea" rows="3" label="Comentario (opcional)" outlined dense
          class="q-mt-md" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="progressDialog = false" />
        <q-btn flat label="Agregar" color="primary" @click="addProgreso" :disable="!canAddProgreso" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { listarAsistenciasPorEntrenamiento } from 'stores/asistencia-store.js'
import { listar as listarCualidades } from 'stores/cualidad-store.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entrenamientoId: { type: [Number, String], required: true }
})
const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const show = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const asistencias = ref([])

// progresos locales antes de persistir en store
const progresos = ref([])

// dialog y campos para agregar progreso
const progressDialog = ref(false)
const selectedAsistencia = ref(null)
const selectedCualidad = ref(null)
const progresoValor = ref(3)
const progresoComentario = ref('')
const cualidades = ref([])

const fetchAsistencias = async () => {
  try {
    const resp = await listarAsistenciasPorEntrenamiento(props.entrenamientoId)
    asistencias.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.error('Error cargando asistencias:', e)
    asistencias.value = []
  }
}

const loadCualidades = async () => {
  try {
    const resp = await listarCualidades()
    cualidades.value = Array.isArray(resp) ? resp : (resp?.data || [])
  } catch (e) {
    console.error('Error cargando cualidades:', e)
    cualidades.value = []
  }
}

watch(() => show.value, (v) => { if (v) { fetchAsistencias(); loadCualidades() } })

const personaLabel = (a) => {
  if (!a) return ''
  if (a.persona && (a.persona.nombre || a.persona.nombres)) return a.persona.nombre || a.persona.nombres
  if (a.nombre_persona) return a.nombre_persona
  if (a.id_persona) return `Persona ${a.id_persona}`
  return ''
}

const openProgressDialog = (a) => {
  selectedAsistencia.value = a
  selectedCualidad.value = null
  progresoValor.value = 3
  progresoComentario.value = ''
  progressDialog.value = true
}

const canAddProgreso = computed(() => !!selectedCualidad.value && selectedAsistencia.value)

const getBoliviaNowString = () => {
  const d = new Date()
  // convertir a UTC y luego aplicar -4 horas (Bolivia UTC-4)
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000)
  const boliviaMs = utcMs - (4 * 60 * 60 * 1000)
  const bd = new Date(boliviaMs)
  const y = bd.getFullYear()
  const m = String(bd.getMonth() + 1).padStart(2, '0')
  const day = String(bd.getDate()).padStart(2, '0')
  const hh = String(bd.getHours()).padStart(2, '0')
  const mm = String(bd.getMinutes()).padStart(2, '0')
  const ss = String(bd.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

const addProgreso = () => {
  if (!canAddProgreso.value) return
  const fecha = getBoliviaNowString()
  const p = {
    id: null,
    id_persona: selectedAsistencia.value.id_persona,
    id_cualidad: selectedCualidad.value,
    valor: progresoValor.value,
    fecha,
    comentario: progresoComentario.value || ''
  }
  progresos.value.push(p)
  progressDialog.value = false
  $q.notify({ type: 'positive', message: 'Progreso agregado (local)' })
}

const personaNameById = (id) => {
  const a = asistencias.value.find(x => x.id_persona === id || (x.persona && (x.persona.id === id || x.persona.id_persona === id)))
  return a ? personaLabel(a) : `Persona ${id}`
}

const cualidadNameById = (id) => {
  const q = cualidades.value.find(c => c.id === id)
  return q ? (q.nombre || q.nombre_cualidad || q.descripcion || `Cualidad ${id}`) : `Cualidad ${id}`
}

const removeProgreso = (p) => {
  const idx = progresos.value.indexOf(p)
  if (idx !== -1) progresos.value.splice(idx, 1)
}

const generateProgresos = () => {
  console.log('Progresos generados:', JSON.parse(JSON.stringify(progresos.value)))
  $q.notify({ type: 'info', message: `Se generaron ${progresos.value.length} progresos (ver consola)` })
}

const closeDialog = () => { show.value = false }

</script>

<style scoped>
/* distinguir visualmente botones con colores y tamaños */
.q-item-section .q-btn[icon="person"] {
  color: var(--q-color-primary);
}

.q-item-section .q-btn[icon="check_circle"] {
  color: var(--q-color-positive);
}

.q-item-section .q-btn[icon="delete"] {
  color: var(--q-color-negative);
}
</style>
