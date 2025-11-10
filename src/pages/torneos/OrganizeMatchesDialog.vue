<template>
  <q-dialog v-model="localVisible" persistent>
    <q-card style="width: min(920px, 96vw); max-width: 920px;">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-card flat bordered class="matches-container q-pa-sm">
              <q-card-section>
                <div class="text-h6">Organizar partidos</div>
                <div class="q-mt-xs">
                  <div class="text-h5 text-primary q-mt-xs"><strong>{{ phaseName || 'No especificada' }}</strong></div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section>
                <div v-if="loading" class="row items-center justify-center q-pa-md">
                  <q-spinner-dots size="28px" />
                </div>

                <div v-else>
                  <div v-if="!matches.length" class="text-caption">No se generaron partidos.</div>

                  <div v-else class="matches-grid q-gutter-sm">
                    <q-card v-for="(m, idx) in matches" :key="`m-${idx}`" flat bordered
                      class="q-pa-xs small-match-card bg-grey-1">
                      <div class="row items-center justify-between">
                        <div class="text-caption">{{ idx + 1 }}</div>
                        <div class="row items-center" style="gap:8px;">
                          <div class="text-caption">{{ m._phaseName || phaseName || '-' }}</div>
                          <q-btn dense flat icon="swap_horiz" @click.stop="swapMatch(idx)" />
                          <q-btn dense flat icon="delete" color="negative" @click.stop="removeMatch(idx)" />
                        </div>
                      </div>
                      <div class="q-mt-xs text-body2 text-center team-vs"><span class="team-left">{{
                        findEquipoName(m.id_equipo_local) }}</span>
                        <strong> VS </strong>
                        <span class="team-right">{{ findEquipoName(m.id_equipo_visitante) }}</span>
                      </div>
                    </q-card>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="control-container q-pa-sm">
              <q-card-section>
                <div class="column q-gutter-sm">
                  <q-btn v-if="torneoType !== 2" dense unelevated color="secondary" class="full-width"
                    label="por orden de registro" @click="paresConImpares" />
                  <q-btn dense unelevated color="orange" class="full-width" label="Sortear aleatorio"
                    @click="sortearAleatorio" />
                  <q-btn v-if="torneoType !== 2" dense unelevated :color="manualMode ? 'primary' : 'accent'"
                    :outline="!manualMode" class="full-width"
                    :label="manualMode ? 'Salir modo manual' : 'Organizar manualmente'"
                    :icon="manualMode ? 'close' : 'edit'" @click="organizarManual" />
                </div>
                <div class="text-caption q-mt-xs">
                  <template v-if="torneoType === 2">Todos los equipos juegan contra todos al menos una vez y están
                    distribuidos equitativamente.</template>
                  <template v-else>Elige una estrategia para generar los partidos.</template>
                </div>

                <!-- Mostrar aviso si faltan combinaciones en liga -->
                <div v-if="torneoType === 2 && missingCount > 0" class="q-mt-sm">
                  <q-banner dense class="bg-yellow-2 text-black">
                    <div>Hay <strong>{{ missingCount }}</strong> combinaciones que no están jugando. Se recomienda
                      volver a sortear.
                    </div>
                    <template v-slot:action>
                      <q-btn dense flat color="primary" label="Sortear nuevamente" @click="sortearAleatorio" />
                      <q-btn dense unelevated color="secondary" label="Completar los que faltan"
                        @click="completarFaltantes" class="q-ml-sm" />
                    </template>
                  </q-banner>
                </div>

                <q-separator class="q-mt-sm" />

                <div class="q-mt-sm">
                  <div v-if="torneoType !== 2">
                    <div class="row q-gutter-sm items-start">
                      <q-chip v-for="t in unpairedTeams" :key="t.id" dense :disable="!manualMode" clickable
                        :outline="selectedTeam !== t.id" :color="selectedTeam === t.id ? 'primary' : undefined"
                        @click="selectTeam(t.id)" @keyup.enter="selectTeam(t.id)"
                        :class="{ 'cursor-pointer': manualMode }" tabindex="0" :aria-pressed="selectedTeam === t.id">
                        {{ t.nombre }}
                      </q-chip>
                    </div>
                    <div class="text-caption q-mt-xs">Haga click en "Organizar manualmente" y luego seleccione dos
                      equipos
                      para crear un par.</div>
                    <q-banner v-if="manualMode" class="q-mt-sm" dense inline-actions>
                      <template v-slot:avatar>
                        <q-icon name="edit" />
                      </template>
                      <div>Modo manual activo — seleccione dos equipos (o pulse ESC para cancelar).</div>
                    </q-banner>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="secondary" @click="close" />
        <q-btn color="primary" label="Confirmar generación" @click="confirm" :disable="matches.length === 0" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { listarBorradores } from 'src/stores/borrador-store'
import { obtenerTorneo, listarFases } from 'src/stores/torneo-store'
import { Notify } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  torneoId: { type: [Number, String], required: true }
});
const emit = defineEmits(['update:modelValue', 'generatedMatches'])

const loading = ref(false)
const matches = ref([])
const phaseName = ref('')
const phaseId = ref(null)
const borradores = ref([])
const manualMode = ref(false)
const selectedTeam = ref(null)
const torneoType = ref(null)

const localVisible = ref(props.modelValue)

watch(() => props.modelValue, (v) => { localVisible.value = v })
watch(localVisible, (v) => { emit('update:modelValue', v) })

watch(localVisible, async (val) => {
  if (val) {
    await prepareOrganization()
  }
});

async function prepareOrganization() {
  loading.value = true
  matches.value = []
  phaseName.value = ''
  phaseId.value = null
  try {
    const t = await obtenerTorneo(props.torneoId).catch(() => null)
    const tor = t || null
    // cargar borradores
    const borr = await listarBorradores(props.torneoId).catch(() => [])
    borradores.value = Array.isArray(borr) ? borr : (borr?.data || [])

    // guardar tipo de torneo para condicionar la UI
    torneoType.value = tor?.id_tipo_torneo ?? null

    // si tipo 1 -> intentar mapear el número de borradores a una fase por su "orden";
    // si no se encuentra, buscar por nombre (ej. "octav") y luego fallback a la primera fase disponible.
    if (tor && tor.id_tipo_torneo === 1) {
      const fases = await listarFases(props.torneoId).catch(() => [])
      let phase = null
      if (Array.isArray(fases) && fases.length > 0) {
        const total = (borradores.value?.length || 0)
        // buscar por campo "orden" que coincida exactamente con el número de equipos
        phase = fases.find(f => {
          const orden = Number(f?.orden)
          return orden && orden === total
        })
        // si no hay match por orden, buscar por nombre (ej. "octav", "dieciseis", "16")
        if (!phase) {
          const needle = ('' + total).toLowerCase()
          phase = fases.find(f => {
            const name = (f.nombre || '').toLowerCase()
            return name.includes('octav') || name.includes('diec') || name.includes(needle)
          })
        }
        if (!phase) phase = fases[0]
        phaseId.value = phase?.id ?? null
        phaseName.value = phase?.nombre ?? `Fase ${phaseId.value ?? ''}`
      }

      // generar partidos por parejas secuenciales (1-2,3-4, ...)
      for (let i = 0; i + 1 < (borradores.value?.length || 0); i += 2) {
        const a = borradores.value[i]
        const b = borradores.value[i + 1]
        matches.value.push({ id_equipo_local: a?.id ?? null, id_equipo_visitante: b?.id ?? null, id_fase: phaseId.value, id_torneo: props.torneoId })
      }
    } else if (tor && tor.id_tipo_torneo === 2) {
      // tipo 2: liga. Generar calendario Round-Robin balanceado.
      const fases = await listarFases(props.torneoId).catch(() => [])
      await generateRoundRobin(borradores.value || [], fases)
    } else {
      // fallback: pares secuenciales y fase por defecto si existe
      const fases = await listarFases(props.torneoId).catch(() => [])
      if (Array.isArray(fases) && fases.length > 0) {
        phaseId.value = fases[0].id
        phaseName.value = fases[0].nombre
      }
      for (let i = 0; i + 1 < (borradores.value?.length || 0); i += 2) {
        const a = borradores.value[i]
        const b = borradores.value[i + 1]
        matches.value.push({ id_equipo_local: a?.id ?? null, id_equipo_visitante: b?.id ?? null, id_fase: phaseId.value, id_torneo: props.torneoId })
      }
    }
  } catch (err) {
    console.error('Error preparando organización', err)
    Notify.create({ type: 'negative', message: 'Error al preparar organización de partidos' })
  } finally {
    loading.value = false
  }
}

function findEquipoName(id) {
  if (!id) return '-'
  const found = (borradores.value || []).find(e => e.id === id)
  if (found) return found.nombre || `#${id}`
  return `#${id}`
}

async function generateRoundRobin(teamsOrig, fases) {
  // teamsOrig: array of equipos objects {id,nombre}
  matches.value = []
  const teams = (teamsOrig || []).slice()
  // si impar -> añadir bye
  if (teams.length % 2 === 1) teams.push({ id: null, nombre: 'BYE' })
  const n = teams.length
  const rounds = n - 1
  const half = n / 2

  // copia para rotación
  const rot = teams.slice()
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const t1 = rot[i]
      const t2 = rot[n - 1 - i]
      if (!t1 || !t2) continue
      if (t1.id == null || t2.id == null) continue
      matches.value.push({ id_equipo_local: t1.id, id_equipo_visitante: t2.id, id_fase: null, id_torneo: props.torneoId, ronda: r + 1 })
    }
    // rotación manteniendo rot[0]
    const fixed = rot[0]
    const rest = rot.slice(1)
    rest.unshift(rest.pop())
    rot.length = 0
    rot.push(fixed)
    rot.push(...rest)
  }

  // asignar fases por ronda si hay fases
  for (let r = 0; r < rounds; r++) {
    const phase = (Array.isArray(fases) && fases[r]) ? fases[r] : (Array.isArray(fases) && fases.length > 0 ? fases[0] : null)
    const baseName = (phase && phase.nombre) ? phase.nombre : 'Jornada'
    const label = `${baseName} ${r + 1}`
    const idF = phase?.id ?? null
    matches.value.forEach(m => {
      if (m.ronda === r + 1) {
        m.id_fase = idF
        m._phaseName = label
      }
    })
  }

  if (matches.value.length > 0) {
    const first = matches.value.find(m => m.ronda === 1)
    phaseName.value = first?._phaseName || ''
    phaseId.value = first?.id_fase ?? phaseId.value
  }
}

const unpairedTeams = computed(() => {
  const pairedIds = new Set();
  (matches.value || []).forEach(m => {
    if (m.id_equipo_local) pairedIds.add(m.id_equipo_local)
    if (m.id_equipo_visitante) pairedIds.add(m.id_equipo_visitante)
  })
  return (borradores.value || []).filter(e => !pairedIds.has(e.id))
});

const expectedMatchesCount = computed(() => {
  // para liga: combinaciones C(n,2) donde n es número de equipos reales en borradores
  const n = (borradores.value || []).length
  return n >= 2 ? (n * (n - 1)) / 2 : 0
})

const missingCount = computed(() => {
  if (torneoType.value !== 2) return 0
  const expected = expectedMatchesCount.value
  const actual = (matches.value || []).length
  return Math.max(0, expected - actual)
})

function pairKey(a, b) {
  // key for unordered pair
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function completarFaltantes() {
  const teams = (borradores.value || []).map(t => t).filter(t => t && t.id != null)
  const expected = new Set()
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      expected.add(pairKey(teams[i].id, teams[j].id))
    }
  }
  const existing = new Set();
  (matches.value || []).forEach(m => {
    if (m.id_equipo_local != null && m.id_equipo_visitante != null) existing.add(pairKey(m.id_equipo_local, m.id_equipo_visitante))
  })
  const missing = []
  expected.forEach(k => {
    if (!existing.has(k)) missing.push(k)
  })
  if (missing.length === 0) {
    Notify.create({ type: 'info', message: 'No hay combinaciones faltantes.' })
    return
  }
  // agregar partidos faltantes como pendientes (ronda y fase null)
  missing.forEach(k => {
    const [a, b] = k.split('|')
    matches.value.push({ id_equipo_local: Number(a), id_equipo_visitante: Number(b), id_fase: null, id_torneo: props.torneoId, ronda: null, _phaseName: 'Pendiente' })
  })
  Notify.create({ type: 'positive', message: `${missing.length} partidos agregados como pendientes` })
}

function selectTeam(id) {
  if (!manualMode.value) {
    Notify.create({ type: 'warning', message: 'Active "Organizar manualmente" para emparejar equipos' })
    return
  }
  if (!selectedTeam.value) {
    selectedTeam.value = id
    return
  }
  // si se hace click en el mismo, deseleccionar
  if (selectedTeam.value === id) {
    selectedTeam.value = null
    return
  }
  // crear par: selectedTeam => local, id => visitante
  const a = selectedTeam.value
  const b = id
  // seguridad: comprobar que ninguno ya esté emparejado
  const already = matches.value.find(m => (m.id_equipo_local === a || m.id_equipo_visitante === a || m.id_equipo_local === b || m.id_equipo_visitante === b))
  if (already) {
    Notify.create({ type: 'negative', message: 'Uno de los equipos ya está emparejado' })
    selectedTeam.value = null
    return
  }
  matches.value.push({ id_equipo_local: a, id_equipo_visitante: b, id_fase: phaseId.value, id_torneo: props.torneoId })
  selectedTeam.value = null
  Notify.create({ type: 'positive', message: 'Par creado' })
}

function removeMatch(idx) {
  if (idx >= 0 && idx < matches.value.length) {
    matches.value.splice(idx, 1)
  }
}

function swapMatch(idx) {
  const m = matches.value[idx]
  if (!m) return
  const l = m.id_equipo_local
  m.id_equipo_local = m.id_equipo_visitante
  m.id_equipo_visitante = l
}

function close() {
  localVisible.value = false
}

function confirm() {
  emit('generatedMatches', { torneoId: props.torneoId, matches: matches.value })
  localVisible.value = false
}

function paresConImpares() {
  // genera pares tomando pares (índices 1,3,5...) como locales y los impares anteriores como visitantes: 2-1,4-3...
  const b = borradores.value || []
  matches.value = []
  for (let i = 1; i < b.length; i += 2) {
    const local = b[i]
    const visitante = b[i - 1]
    matches.value.push({ id_equipo_local: local?.id ?? null, id_equipo_visitante: visitante?.id ?? null, id_fase: phaseId.value, id_torneo: props.torneoId })
  }
  Notify.create({ type: 'info', message: 'Generado: pares con impares' })
}

async function sortearAleatorio() {
  // Si es liga (tipo 2) barajar el orden de equipos y regenerar Round-Robin
  if (torneoType.value === 2) {
    const fases = await listarFases(props.torneoId).catch(() => [])
    const teams = (borradores.value || []).slice()
    // shuffle
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = teams[i]; teams[i] = teams[j]; teams[j] = tmp
    }
    await generateRoundRobin(teams, fases)
    Notify.create({ type: 'positive', message: 'Equipos sorteados aleatoriamente (Round-Robin)' })
    return
  }

  // mezcla y empareja secuencialmente (modo por pares)
  const b = (borradores.value || []).slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = b[i]; b[i] = b[j]; b[j] = tmp
  }
  matches.value = []
  for (let i = 0; i + 1 < b.length; i += 2) {
    const a = b[i]
    const bb = b[i + 1]
    matches.value.push({ id_equipo_local: a?.id ?? null, id_equipo_visitante: bb?.id ?? null, id_fase: phaseId.value, id_torneo: props.torneoId })
  }
  Notify.create({ type: 'positive', message: 'Equipos sorteados aleatoriamente' })
}

function organizarManual() {
  manualMode.value = !manualMode.value
  // limpiar selección al desactivar
  if (!manualMode.value) selectedTeam.value = null
  Notify.create({ type: 'info', message: manualMode.value ? 'Modo manual activado' : 'Modo manual desactivado' })
}

function handleKeydown(e) {
  if (e.key === 'Escape' && manualMode.value) {
    manualMode.value = false
    selectedTeam.value = null
    Notify.create({ type: 'info', message: 'Modo manual cancelado' })
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.matches-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.small-match-card {
  min-height: 48px;
  padding: 6px !important;
  font-size: 0.9rem;
}

.phase-card {
  background: linear-gradient(90deg, #1976d2 0%, #1565c0 100%);
  border-radius: 6px;
}

.control-card {
  border-radius: 6px;
}

.team-vs {
  color: #222
}

.team-left {
  color: #0d47a1;
  font-weight: 600
}

.team-right {
  color: #b71c1c;
  font-weight: 600
}

.matches-container {
  max-height: 56vh;
  overflow: auto;
}

.control-container .full-width {
  width: 100%;
}

.cursor-pointer {
  cursor: pointer;
}

@media (max-width: 900px) {
  .matches-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .matches-grid {
    grid-template-columns: 1fr;
  }
}
</style>
