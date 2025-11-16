<template>
  <q-dialog v-model="localVisible" persistent>
    <q-card style="min-width:480px; max-width:900px;">
      <q-card-section class="row items-start">
        <div class="col">
          <div class="row items-center">
            <div class="text-h6">{{ displayTorneo?.nombre || 'Seguimiento del torneo' }}</div>
            <div v-if="displayTorneo?.tipo_torneo?.nombre" class="q-ml-sm">
              <q-badge :color="badgeColor(displayTorneo.tipo_torneo.nombre)" align="middle">{{
                displayTorneo.tipo_torneo.nombre }}</q-badge>
            </div>
          </div>
          <div class="text-caption q-mt-sm">
            <q-icon name="place" size="16px" class="q-mr-xs" />
            <q-btn v-if="displayTorneo?.ubicacion?.id" flat dense class="q-pa-none"
              @click.stop="goToUbicacion(displayTorneo.ubicacion.id)">
              {{ displayTorneo.ubicacion?.nombre || '—' }}
            </q-btn>
            <span v-else>{{ displayTorneo?.ubicacion?.nombre || '—' }}</span>
            <span class="q-ml-md">{{ formatDateShort(displayTorneo?.fecha_inicio) }} → {{
              formatDateShort(displayTorneo?.fecha_fin) }}</span>
          </div>
        </div>
        <div class="q-pl-md">
          <q-btn flat dense icon="close" @click="close" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="loading" class="row items-center justify-center q-pa-md">
          <q-spinner-dots size="28px" />
        </div>
        <div v-else>
          <div v-if="!partidos || partidos.length === 0" class="text-caption q-pa-md">No se encontraron partidos.</div>
          <div v-else class="cards-container">
            <q-card v-for="p in partidos" :key="p.id || `${p.id_equipo_local}-${p.id_equipo_visitante}`"
              class="match-card q-mb-sm">
              <q-card-section class="row items-center no-wrap">
                <div class="col">
                  <div class="row items-center">
                    <q-badge color="primary" class="q-mr-sm">{{ nameOf(p, 'local') }}</q-badge>
                    <div class="text-caption q-mx-sm">vs</div>
                    <q-badge color="secondary" class="q-ml-sm">{{ nameOf(p, 'visitante') }}</q-badge>
                  </div>
                  <div class="text-caption q-mt-xs">Ronda: {{ p.ronda || p.numero_ronda || '-' }} · Fecha: {{ p.fecha ||
                    p.fecha_partido || '-' }}</div>
                </div>
                <div class="match-score text-right">
                  <div class="text-h6">{{ (p.goles_local != null ? p.goles_local : '-') }} - {{ (p.goles_visitante !=
                    null ? p.goles_visitante : '-') }}</div>
                  <div class="text-caption">Estado: {{ p.estado_partido || p.estado || 'Pendiente' }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="secondary" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { listarPartidos } from 'src/stores/partido-store'
import { obtenerTorneo } from 'src/stores/torneo-store'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  torneoId: { type: [Number, String], required: false },
  torneo: { type: Object, required: false }
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const localVisible = ref(props.modelValue)
const partidos = ref([])
const loading = ref(false)
const localTorneo = ref(props.torneo || null)
const displayTorneo = ref(localTorneo.value)

watch(() => props.modelValue, v => localVisible.value = v)
watch(localVisible, v => emit('update:modelValue', v))

watch(() => props.torneo, async (t) => {
  localTorneo.value = t || null
  displayTorneo.value = localTorneo.value
  const id = t?.id || props.torneoId
  if (!id) return
  if (!localVisible.value) return
  await loadPartidos(id)
})

watch(localVisible, async (v) => {
  if (v) {
    const id = props.torneo?.id || props.torneoId
    if (id) {
      if (!displayTorneo.value) {
        try {
          const t = await obtenerTorneo(id).catch(() => null)
          displayTorneo.value = t || null
        } catch (e) { console.warn('No se pudo obtener torneo', e) }
      }
      await loadPartidos(id)
    }
  }
})

function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const part = String(dateStr).split('T')[0]
  const parts = part.split('-')
  if (parts.length < 3) return dateStr
  const [yyyy, mm, dd] = parts
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mi = parseInt(mm, 10) - 1
  const mon = monthNames[mi] || mm
  return `${dd} ${mon} ${yyyy}`
}

async function loadPartidos(id) {
  loading.value = true
  partidos.value = []
  try {
    const res = await listarPartidos(id)
    partidos.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err) {
    console.error('Error listando partidos', err)
    Notify.create({ type: 'negative', message: 'Error al cargar partidos' })
  } finally {
    loading.value = false
  }
}

function close() {
  localVisible.value = false
}

function nameOf(p, side) {
  if (!p) return '-'
  if (side === 'local') return p.equipo_local?.nombre || p.id_equipo_local || '-'
  return p.equipo_visitante?.nombre || p.id_equipo_visitante || '-'
}

function badgeColor(key) {
  if (!key) return 'grey'
  const name = String(key).toLowerCase()
  if (name.includes('elimin')) return 'red'
  if (name.includes('liga')) return 'teal'
  if (name.includes('final') || name.includes('semif')) return 'amber'
  return 'primary'
}

function goToUbicacion(id) {
  if (!id) return
  router.push({ path: '/ubicaciones', query: { focus: id } })
}
</script>

<style scoped></style>
