<template>
  <template v-if="!isMobile">
    <q-dialog v-model="localVisible" persistent class="torneo-dialog">
      <q-card class="torneo-card">
        <!-- Header mejorado -->
        <q-card-section class="dialog-header">
          <div class="header-content">
            <div class="torneo-info">
              <div class="row items-center q-mb-xs">
                <q-icon name="sports_soccer" size="24px" class="q-mr-sm" color="primary" />
                <div class="text-h5 torneo-title">{{ displayTorneo?.nombre || 'Seguimiento del torneo' }}</div>
                <q-badge v-if="displayTorneo?.tipo_torneo?.nombre" :color="badgeColor(displayTorneo.tipo_torneo.nombre)"
                  class="q-ml-md tipo-badge">
                  {{ displayTorneo.tipo_torneo.nombre }}
                </q-badge>
              </div>

              <div class="torneo-meta row items-center">
                <div class="meta-item">
                  <q-icon name="place" size="16px" class="q-mr-xs" />
                  <q-btn v-if="displayTorneo?.ubicacion?.id" flat dense class="location-btn q-pa-none"
                    @click.stop="goToUbicacion(displayTorneo.ubicacion.id)">
                    {{ displayTorneo.ubicacion?.nombre || '—' }}
                  </q-btn>
                  <span v-else>{{ displayTorneo?.ubicacion?.nombre || '—' }}</span>
                </div>

                <div class="meta-item">
                  <q-icon name="event" size="16px" class="q-mr-xs" />
                  <span>{{ formatDateShort(displayTorneo?.fecha_inicio) }} → {{
                    formatDateShort(displayTorneo?.fecha_fin)
                  }}</span>
                </div>
              </div>

              <div v-if="displayTorneo?.encargados && displayTorneo.encargados.length"
                class="encargados-section q-mt-sm">
                <div class="text-caption text-weight-medium q-mb-xs">Encargado(s):</div>
                <div class="encargados-chips">
                  <q-chip v-for="e in displayTorneo.encargados" :key="e.id || e.id_persona" dense
                    class="encargado-chip">
                    <q-avatar size="24px" color="primary" text-color="white" class="q-mr-sm">
                      {{ getInitials(personaLabel(e.persona || e)) }}
                    </q-avatar>
                    {{ personaLabel(e.persona || e) }}
                  </q-chip>
                </div>
              </div>
            </div>

            <q-btn flat round dense icon="close" class="close-btn" @click="close" />
          </div>
        </q-card-section>

        <q-separator />

        <!-- Contenido principal mejorado -->
        <q-card-section class="partidos-section">
          <div v-if="loading" class="loading-container">
            <q-spinner-oval size="40px" color="primary" />
            <div class="q-mt-md text-caption">Cargando partidos...</div>
          </div>

          <div v-else>
            <div v-if="!partidos || partidos.length === 0" class="empty-state">
              <q-icon name="sports" size="48px" color="grey-5" />
              <div class="q-mt-md text-h6 text-grey-7">No hay partidos programados</div>
              <div class="q-mt-xs text-caption text-grey-6">Los partidos aparecerán aquí cuando se programen</div>
            </div>

            <div v-else class="partidos-container">
              <div class="partidos-header">
                <div class="text-h6">Partidos</div>
                <div class="header-right">
                  <q-badge color="primary" rounded class="q-mr-sm">{{ filteredPartidos.length }} partido(s)</q-badge>
                  <q-tabs v-model="filterMode" dense class="tabs-switch">
                    <q-tab name="en_marcha" label="En marcha" />
                    <q-tab v-if="displayTorneo?.id_tipo_torneo === 2" name="posiciones" label="Posiciones" />
                    <q-tab name="finalizados" label="Finalizados" />
                  </q-tabs>
                </div>
              </div>

              <div class="partidos-list">
                <template v-if="filterMode === 'posiciones'">
                  <div class="posiciones-table q-mt-sm">
                    <div class="posiciones-header row items-center q-mb-sm" style="justify-content:flex-end;">
                      <q-icon name="help_outline" class="help-posiciones cursor-pointer" size="24px" color="primary"
                        @click.stop="() => startPosicionesTour()" />
                    </div>
                    <table class="standings-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Equipo</th>
                          <th class="PJ">PJ</th>
                          <th class="G">G</th>
                          <th class="E">E</th>
                          <th class="P">P</th>
                          <th class="GF">GF</th>
                          <th class="GC">GC</th>
                          <th class="DG">DG</th>
                          <th class="PTS">PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(t, idx) in posiciones" :key="t.id">
                          <td>{{ idx + 1 }}</td>
                          <td>{{ t.nombre }}</td>
                          <td>{{ t.PJ }}</td>
                          <td>{{ t.W }}</td>
                          <td>{{ t.E }}</td>
                          <td>{{ t.L }}</td>
                          <td>{{ t.GF }}</td>
                          <td>{{ t.GC }}</td>
                          <td>{{ t.DG }}</td>
                          <td>{{ t.PTS }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>
                <template v-if="filterMode === 'en_marcha' && enMarchaCount === 0 && finalWinner">
                  <q-card class="partido-card finalizado special-final-winner">
                    <q-card-section class="partido-content" style="justify-content:center; text-align:center;">
                      <div class="equipo equipo-center winner-final"
                        style="display:flex; align-items:center; gap:12px; justify-content:center;">
                        <img :src="trophyImg" alt="Trofeo" class="trophy-img" />
                        <div>
                          <div ref="finalWinnerNameRef" class="equipo-nombre" style="font-size:1.25rem;">{{
                            finalWinner.team.nombre }}</div>
                          <div class="text-caption q-mt-xs">Ganador definitivo</div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </template>
                <q-card v-for="p in filteredPartidos" :key="p.id || `${p.id_equipo_local}-${p.id_equipo_visitante}`"
                  class="partido-card" :class="{ 'finalizado': p.finalizado === true }">
                  <q-card-section class="partido-content">
                    <!-- Equipo local -->
                    <div class="equipo equipo-local" :class="{
                      winner: isWinner(p, 'local'),
                      'winner-final': isWinner(p, 'local') && shouldPaintFinal(p),
                      'winner-semifinal': isWinner(p, 'local') && getWinnerPhase(p) === 'semifinal',
                      'winner-cuartos': isWinner(p, 'local') && getWinnerPhase(p) === 'cuartos',
                      'winner-octavos': isWinner(p, 'local') && getWinnerPhase(p) === 'octavos',
                      'empate': (displayTorneo?.id_tipo_torneo === 2) && (Number(p.goles_local || p.golesLocal || 0) === Number(p.goles_visitante || p.golesVisitante || 0)) && (Number(p.goles_local || p.golesLocal || 0) > 0)
                    }">
                      <div class="equipo-info">
                        <div class="equipo-nombre">{{ nameOf(p, 'local') }}</div>
                      </div>

                      <div class="marcador">
                        <template v-if="isEncargado && !p.finalizado">
                          <q-btn round dense flat icon="remove" size="sm" @click="decrementGoal(p, 'local')"
                            :disable="Number(p.goles_local || 0) <= 0" class="goal-btn" />
                          <div class="goles">{{ Number(p.goles_local || 0) }}</div>
                          <q-btn round dense flat icon="add" size="sm" @click="incrementGoal(p, 'local')"
                            class="goal-btn" />
                        </template>
                        <template v-else>
                          <div class="goles">{{ Number(p.goles_local || 0) }}</div>
                        </template>
                      </div>
                    </div>

                    <!-- Separador central -->
                    <div class="partido-separador">
                      <div class="vs">VS</div>
                      <div class="ronda">{{ p.ronda || '-' }}</div>
                    </div>

                    <!-- Equipo visitante -->
                    <div class="equipo equipo-visitante" :class="{
                      winner: isWinner(p, 'visitante'),
                      'winner-final': isWinner(p, 'visitante') && shouldPaintFinal(p),
                      'winner-semifinal': isWinner(p, 'visitante') && getWinnerPhase(p) === 'semifinal',
                      'winner-cuartos': isWinner(p, 'visitante') && getWinnerPhase(p) === 'cuartos',
                      'winner-octavos': isWinner(p, 'visitante') && getWinnerPhase(p) === 'octavos',
                      'empate': (displayTorneo?.id_tipo_torneo === 2) && (Number(p.goles_local || p.golesLocal || 0) === Number(p.goles_visitante || p.golesVisitante || 0)) && (Number(p.goles_local || p.golesLocal || 0) > 0)
                    }">
                      <div class="marcador">
                        <template v-if="isEncargado && !p.finalizado">
                          <q-btn round dense flat icon="remove" size="sm" @click="decrementGoal(p, 'visitante')"
                            :disable="Number(p.goles_visitante || 0) <= 0" class="goal-btn" />
                          <div class="goles">{{ Number(p.goles_visitante || 0) }}</div>
                          <q-btn round dense flat icon="add" size="sm" @click="incrementGoal(p, 'visitante')"
                            class="goal-btn" />
                        </template>
                        <template v-else>
                          <div class="goles">{{ Number(p.goles_visitante || 0) }}</div>
                        </template>
                      </div>
                      <div class="equipo-info">
                        <div class="equipo-nombre">{{ nameOf(p, 'visitante') }}</div>
                      </div>

                    </div>

                    <!-- Acciones -->
                    <div class="partido-acciones">
                      <template v-if="isEncargado">
                        <q-btn color="primary" unelevated v-if="p.id_equipo_ganador == null && p.finalizado !== true"
                          label="Finalizar" @click="finishMatch(p, $event.currentTarget)" />
                      </template>
                    </div>
                    <!-- Mobile layout duplicates (visible only on small screens) -->

                  </q-card-section>

                  <!-- Estado del partido -->
                  <div v-if="p.finalizado === true" class="partido-finalizado-indicator">
                    <q-icon name="check_circle" size="16px" class="q-mr-xs" :color="statusLabelColor(p).color" />
                    <span class="finalizado-label" :style="{ color: statusLabelColor(p).color }">{{
                      statusLabelColor(p).label }}</span>
                  </div>
                </q-card>
              </div>

              <div class="advance-center q-mt-md" v-if="enMarchaCount === 0 && partidos.length > 0 && showAdvance">
                <template v-if="displayTorneo?.id_tipo_torneo === 1">
                  <q-btn class="advance-btn" icon="skip_next" @click="openOrganizeWithWinners">Avanzar fase</q-btn>
                </template>
                <template v-else>
                  <q-btn class="advance-btn" flat color="grey-6" disable icon="flag" label="Torneo finalizado" />
                </template>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cerrar" color="grey-7" @click="close" />
        </q-card-actions>
      </q-card>
      <!-- Organize dialog embebido: se abre con los ganadores cuando corresponde -->

      <q-dialog v-model="tieDialogVisible" persistent>
        <q-card class="q-pa-none tie-dialog" style="min-width:360px; max-width:560px;">
          <q-card-section class="row items-start">
            <q-icon name="warning_amber" size="40px" color="amber-8" class="q-mr-md" />
            <div>
              <div class="text-h6">{{ tieDialogTitle }}</div>
              <div class="text-caption q-mt-xs">El partido está empatado. Si continúa, el partido se reprogramará.</div>
              <div v-if="tieDialogMatch" class="text-subtitle2 q-mt-sm">
                <span class="team-name">{{ tieDialogMatch.equipoLocal?.nombre || tieDialogMatch.equipo_local?.nombre ||
                  'Local' }}</span>
                <span class="goals-color">{{ tieDialogMatch.goles_local }} - {{ tieDialogMatch.goles_visitante }}</span>
                <span class="team-name">{{ tieDialogMatch.equipoVisitante?.nombre ||
                  tieDialogMatch.equipo_visitante?.nombre
                  || 'Visitante' }}</span>
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="grey-7" @click="cancelReprogram" />
            <q-btn color="primary" unelevated label="Reprogramar" @click="confirmReprogram" />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <OrganizeMatchesDialog :modelValue="organizeVisible" @update:modelValue="val => organizeVisible = val"
        :torneoId="displayTorneo?.id || props.torneoId" :initialTeams="organizeTeams"
        @generatedMatches="onGeneratedMatches" @started="onOrganizeStarted" />
    </q-dialog>
  </template>

  <!-- Mobile-specific dialog component -->
  <MobileSeguimientoDialog v-else :modelValue="localVisible" @update:modelValue="val => localVisible = val"
    :torneoId="props.torneoId" :torneo="props.torneo" @partido-updated="p => emit('partido-updated', p)" />
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import trophyImg from 'src/assets/trofeo.png'
import useDrive from 'src/composables/useDrive'

const { startPosicionesTour, attachToIcon } = useDrive()

// onMounted(() => {
//   attachToIcon() // O llamar startPosicionesTour() directamente después de que la tabla se renderice
// })
import OrganizeMatchesDialog from 'src/pages/torneos/OrganizeMatchesDialog.vue'
import MobileSeguimientoDialog from 'src/pages/torneos/MobileSeguimientoDialog.vue'
import { actualizarPartido, listarPartidos, reprogramarPartido } from 'src/stores/partido-store'
import { obtenerTorneo } from 'src/stores/torneo-store'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  torneoId: { type: [Number, String], required: false },
  torneo: { type: Object, required: false }
})
const emit = defineEmits(['update:modelValue', 'partido-updated', 'open-organize'])

const router = useRouter()
const localVisible = ref(props.modelValue)
const partidos = ref([])
const loading = ref(false)
const filterMode = ref('en_marcha')
const localTorneo = ref(props.torneo || null)
const displayTorneo = ref(localTorneo.value)
const organizeVisible = ref(false)
const organizeTeams = ref([])
const tieDialogVisible = ref(false)
const tieDialogMatch = ref(null)
const finalWinnerNameRef = ref(null)
const finalConfettiFired = ref(false)
// attach drive help icon when component mounts
onMounted(() => attachToIcon('.help-posiciones'))
const tieDialogTitle = computed(() => {
  const m = tieDialogMatch.value
  if (!m) return 'Reprogramar partido'
  const gl = Number(m.goles_local || m.golesLocal || 0)
  const gv = Number(m.goles_visitante || m.golesVisitante || 0)
  return (gl === 0 && gv === 0) ? 'Reprogramar partido' : 'Partido empatado'
})

const filteredPartidos = computed(() => {
  if (!partidos.value) return []
  if (filterMode.value === 'en_marcha') {
    return partidos.value.filter(p => !p.finalizado)
  }
  // Para la pestaña "finalizados" queremos ordenarlos por id descendente
  return partidos.value.filter(p => !!p.finalizado).slice().sort((a, b) => {
    const ai = Number(a?.id || a?.id_equipo_local || 0)
    const bi = Number(b?.id || b?.id_equipo_local || 0)
    return bi - ai
  })
})

// Responsive helper: detect mobile breakpoint and switch to mobile dialog
const isMobile = ref(false)
function updateIsMobile() { isMobile.value = window.innerWidth <= 520 }
if (typeof window !== 'undefined') {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
}

const enMarchaCount = computed(() => {
  if (!partidos.value) return 0
  return partidos.value.filter(p => !p.finalizado).length
})

// permisos: solo encargados del torneo
const currentPersonaId = computed(() => {
  try {
    const raw = sessionStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw)
    return u?.persona?.id || u?.personaId || null
  } catch {
    return null
  }
})

const isEncargado = computed(() => {
  const t = displayTorneo.value
  const pid = currentPersonaId.value
  if (!t || !t.encargados || !pid) return false
  return t.encargados.some(e => {
    const p = e.persona || e
    return p && (p.id === pid || p.id_persona === pid)
  })
})
// ensure template and functions can use it
// isEncargado is used in template to show/hide controls

// Watchers (sin cambios en la lógica)
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
  if (!v) return
  const id = props.torneo?.id || props.torneoId
  if (!id) return

  loading.value = true
  try {
    if (!displayTorneo.value) {
      const t = await obtenerTorneo(id).catch(() => null)
      displayTorneo.value = t || null
    }
    await loadPartidos(id)
  } catch (err) {
    console.error('Error listando partidos', err)
    Notify.create({ type: 'negative', message: 'Error al cargar partidos' })
  } finally {
    loading.value = false
  }
})

async function loadPartidos(id) {
  if (!id) return
  loading.value = true
  try {
    const res = await listarPartidos(id)
    partidos.value = Array.isArray(res) ? res : (res?.data || [])
    // Normalizar partidos: si vienen con un ganador ya asignado, marcar como Finalizado
    partidos.value = (partidos.value || []).map(p => {
      // normalizar finalizado a booleano teniendo en cuenta campos existentes
      p.finalizado = Boolean(p.finalizado) || p.estado_partido === 'Finalizado' || Boolean(p.id_equipo_ganador) || Boolean(p.equipoGanador)
      // defensivo: normalizar estado cuando corresponda
      if ((p.id_equipo_ganador || p.equipoGanador) && p.estado_partido !== 'Finalizado') {
        p.estado_partido = 'Finalizado'
      }
      // asegurar campos de goles como números para evitar comparaciones erróneas
      p.goles_local = Number(p.goles_local || p.golesLocal || 0)
      p.goles_visitante = Number(p.goles_visitante || p.golesVisitante || 0)
      return p
    })
    // no usamos variable externa para ganador dorado; el estilo depende de p.ronda === 'Final' y de tener ganador
  } catch (err) {
    console.error('Error al listar partidos', err)
    Notify.create({ type: 'negative', message: 'No se pudieron cargar los partidos' })
    partidos.value = []
  } finally {
    loading.value = false
  }
}

// Handler: se ejecuta cuando OrganizeMatchesDialog emite 'generatedMatches'
function onGeneratedMatches(payload) {
  // solo notificar/registrar; el evento 'started' será el que confirme persistencia
  console.log('generatedMatches recibido en Seguimiento:', payload)
  Notify.create({ type: 'info', message: 'Partidos generados (no confirmados) recibidos' })
}

// Handler: se ejecuta cuando OrganizeMatchesDialog emitió 'started' (partidos confirmados y torneo iniciado)
async function onOrganizeStarted(evt) {
  try {
    const id = evt?.torneoId || displayTorneo.value?.id || props.torneoId
    if (id) {
      loading.value = true
      await loadPartidos(id)
      Notify.create({ type: 'positive', message: 'Partidos actualizados después de iniciar torneo' })
    }
  } catch (err) {
    console.error('Error al refrescar partidos tras iniciar torneo', err)
    Notify.create({ type: 'negative', message: 'No se pudieron actualizar los partidos' })
  } finally {
    loading.value = false
    // asegurarse de cerrar el dialogo de organizacion si sigue abierto
    organizeVisible.value = false
  }
}

async function finishMatch(p) {
  // old signature: finishMatch(p)
  // new: may receive event as second arg, so allow either
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para finalizar este partido' })
    return
  }
  // el segundo argumento puede ser un event o un elemento DOM; lo procesamos abajo
  const golesLocal = Number(p.goles_local || p.golesLocal || 0)
  const golesVisit = Number(p.goles_visitante || p.golesVisitante || 0)
  if (golesLocal === golesVisit) {
    // Para torneos tipo 2: los empates (excepto 0-0) se registran como partidos finales empatados
    if (displayTorneo.value?.id_tipo_torneo === 2 && !(golesLocal === 0 && golesVisit === 0)) {
      // Registrar empate: no hay equipo ganador, marcar como finalizado
      p.equipoGanador = null
      p.id_equipo_ganador = null
      p.estado_partido = 'Finalizado'
      p.finalizado = true
      try {
        await actualizarPartido(p)
        emit('partido-updated', JSON.parse(JSON.stringify(p)))
        Notify.create({ type: 'positive', message: 'Empate registrado' })
      } catch (err) {
        console.error('Error guardando empate', err)
        Notify.create({ type: 'negative', message: 'No se pudo guardar el empate' })
      }
      return
    }
    // Comportamiento anterior: abrir diálogo de reprogramación para empates (incluyendo 0-0)
    tieDialogMatch.value = p
    tieDialogVisible.value = true
    return
  }
  // Capturar la posición del origen (botón) antes de mutar el partido/esperar
  let savedOrigin = null
  try {
    const maybeOrigin = arguments[1]
    let el = null
    if (maybeOrigin instanceof Element) el = maybeOrigin
    else if (maybeOrigin && (maybeOrigin.currentTarget || maybeOrigin.target)) el = maybeOrigin.currentTarget || maybeOrigin.target
    else if (maybeOrigin && maybeOrigin.$el) el = maybeOrigin.$el
    if (el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect()
      savedOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
  } catch (e) {
    // ignore errors obtaining bounding rect
    void e
  }
  let winnerId = null
  let winnerObj = null
  // determine team ids reliably
  const localId = p.id_equipo_local || (p.equipoLocal && (p.equipoLocal.id || p.equipoLocal.id_equipo)) || (p.equipo_local && p.equipo_local.id)
  const visitId = p.id_equipo_visitante || (p.equipoVisitante && (p.equipoVisitante.id || p.equipoVisitante.id_equipo)) || (p.equipo_visitante && p.equipo_visitante.id)
  if (golesLocal > golesVisit) {
    winnerId = localId || null
    winnerObj = p.equipoLocal || p.equipo_local || null
  } else {
    winnerId = visitId || null
    winnerObj = p.equipoVisitante || p.equipo_visitante || null
  }
  p.equipoGanador = winnerObj
  // prefer the team's object id when available (equipoVisitante.id / equipoLocal.id)
  p.id_equipo_ganador = (winnerObj && (winnerObj.id || winnerObj.id_equipo)) || winnerId
  p.estado_partido = 'Finalizado'
  // marcar flag explícita para UI
  p.finalizado = true
  console.log('Finalizando partido:', JSON.parse(JSON.stringify(p)))
  await actualizarPartido(p)
  emit('partido-updated', JSON.parse(JSON.stringify(p)))
  Notify.create({ type: 'positive', message: 'Partido finalizado' })
  // trigger confetti at the button location (try to use a DOM element passed), fallback to center
  try {
    triggerConfetti(savedOrigin)
  } catch (err) {
    console.warn('Confetti failed', err)
  }
}

// avanzarFase ya no se usa — ahora `openOrganizeWithWinners` arma la lista de ganadores y emite `open-organize`.

function triggerConfetti(originArg) {
  if (typeof window === 'undefined') return
  // originArg may be: an Element, an Event, or falsy (use center)
  let originX = window.innerWidth / 2
  let originY = window.innerHeight / 2
  try {
    // If caller passed explicit coordinates, use them (saved before DOM changes)
    if (originArg && typeof originArg.x === 'number' && typeof originArg.y === 'number') {
      originX = originArg.x
      originY = originArg.y
      // skip other checks
      originArg = null
    }
    if (!originArg) {
      // keep center
    } else if (originArg instanceof Element) {
      const rect = originArg.getBoundingClientRect()
      originX = rect.left + rect.width / 2
      originY = rect.top + rect.height / 2
    } else if (originArg instanceof Event) {
      originX = originArg.clientX || (window.innerWidth / 2)
      originY = originArg.clientY || (window.innerHeight / 2)
    } else if (originArg && (originArg.currentTarget || originArg.target)) {
      const el = originArg.currentTarget || originArg.target
      if (el && el.getBoundingClientRect) {
        const rect = el.getBoundingClientRect()
        originX = rect.left + rect.width / 2
        originY = rect.top + rect.height / 2
      } else if (originArg.clientX || originArg.clientY) {
        originX = originArg.clientX || originX
        originY = originArg.clientY || originY
      }
    } else if (originArg && originArg.$el && originArg.$el.getBoundingClientRect) {
      // Vue component proxy
      const rect = originArg.$el.getBoundingClientRect()
      originX = rect.left + rect.width / 2
      originY = rect.top + rect.height / 2
    }
  } catch {
    // fallback to center
    originX = window.innerWidth / 2
    originY = window.innerHeight / 2
  }

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.pointerEvents = 'none'
  // ensure confetti is rendered above the dialog overlay
  canvas.style.zIndex = '2147483647'
  // support high-DPI displays
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr))
  canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr))
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)
  const colors = ['#ff6b6b', '#ffd93d', '#6be4ff', '#9b8cff', '#6bff9b', '#ff9f1c', '#7effa2']
  const particles = []
  const count = 80
  const secondCount = 60
  const gravity = 0.12

  // primary burst (bigger)
  for (let i = 0; i < count; i++) {
    particles.push({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 14 - 3,
      size: 6 + Math.random() * 8,
      life: 80 + Math.random() * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.4
    })
  }

  // secondary softer burst
  for (let i = 0; i < secondCount; i++) {
    particles.push({
      x: originX + (Math.random() - 0.5) * 30,
      y: originY + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.6) * 8 - 1,
      size: 4 + Math.random() * 6,
      life: 100 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35
    })
  }

  let frame = 0
  function draw() {
    frame++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.vy += gravity
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr
      p.life--
      const alpha = Math.max(0, p.life / 140)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
      if (p.life <= 0 || p.y > window.innerHeight + 80) particles.splice(i, 1)
    }
    if (particles.length > 0 && frame < 600) {
      requestAnimationFrame(draw)
    } else {
      // cleanup
      setTimeout(() => {
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)
      }, 600)
    }
  }
  requestAnimationFrame(draw)
}

function getWinnerEquipo(p) {
  if (!p) return null
  const winnerId = p.id_equipo_ganador || (p.equipoGanador && (p.equipoGanador.id || p.equipoGanador.id_equipo)) || null
  if (!winnerId) return null
  const wObj = p.equipoGanador || p.equipo_ganador || null
  if (wObj && (wObj.id || wObj.id_equipo)) {
    return { id: wObj.id || wObj.id_equipo, nombre: wObj.nombre || wObj.nombre_corto || nameOf(p, (winnerId === p.id_equipo_local ? 'local' : 'visitante')) }
  }
  if (winnerId === p.id_equipo_local) return { id: winnerId, nombre: nameOf(p, 'local') }
  if (winnerId === p.id_equipo_visitante) return { id: winnerId, nombre: nameOf(p, 'visitante') }
  return { id: winnerId, nombre: nameOf(p, 'local') }
}

async function openOrganizeWithWinners() {
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'Solo los encargados pueden avanzar la fase' })
    return
  }

  // recopilar partidos finalizados con ganador
  const finals = (partidos.value || []).map(p => ({ p, id: Number(p?.id || p?.id_partido || 0) }))
    .filter(x => {
      const w = getWinnerEquipo(x.p)
      return x.p && (x.p.finalizado === true || Boolean(w)) && w && w.id
    })
    .sort((a, b) => b.id - a.id)

  const winnersCount = finals.length
  if (winnersCount < 2) {
    Notify.create({ type: 'warning', message: 'Se requieren al menos 2 equipos ganadores para organizar la siguiente fase' })
    return
  }

  // decidir subconjunto según umbrales: >14 Final (1), >12 Semifinal (2), >8 Cuartos (4)
  let label = null
  let take = null
  if (winnersCount > 14) {
    label = 'Final'
    take = 1
  } else if (winnersCount > 12) {
    label = 'Semifinal'
    take = 2
  } else if (winnersCount > 8) {
    label = 'Cuartos'
    take = 4
  }

  let selected = []
  if (take) {
    selected = finals.slice(0, take).map(x => x.p)
  }

  // Si hay selección por fase, actualizamos la ronda en los partidos correspondientes
  let winners = []
  try {
    if (selected && selected.length > 0) {
      for (const sp of selected) {
        // si la ronda no contiene ya la etiqueta, añadirla
        if (!sp.ronda || !String(sp.ronda).includes(label)) {
          sp.ronda = (sp.ronda ? sp.ronda + ' ' : '') + label
        }
        // persistir cambio de ronda
        try {
          await actualizarPartido(sp)
        } catch (err) {
          console.warn('No se pudo actualizar ronda para partido', sp, err)
        }
        const w = getWinnerEquipo(sp)
        if (w && w.id) winners.push(w)
      }

      // si estamos apuntando a la Final (1 ganador), marcarlo para estilo dorado
      // si es Final no seteamos variable externa; el estilo se aplica según p.ronda === 'Final' y ganador
    } else {
      // fallback: usar todos los ganadores únicos
      const winnersMap = new Map()
      for (const p of partidos.value || []) {
        const w = getWinnerEquipo(p)
        if (w && w.id) winnersMap.set(String(w.id), w)
      }
      winners = Array.from(winnersMap.values())
    }
  } catch (err) {
    console.error('Error preparando ganadores para organizar fase', err)
    Notify.create({ type: 'negative', message: 'Error preparando equipos para la siguiente fase' })
    return
  }

  const torneoId = displayTorneo.value?.id || props.torneoId
  organizeTeams.value = winners
  organizeVisible.value = true
  emit('open-organize', { torneoId, teams: winners })
  Notify.create({ type: 'positive', message: `Abriendo organizador con ${winners.length} equipo(s)` })
}

function getWinnerPhase(p) {
  if (!p) return null
  const r = (p.ronda || '').toString().toLowerCase()
  if (!r) return null
  // comprobar 'semif' antes que 'final' porque 'semifinal' incluye 'final'
  if (r.includes('semif')) return 'semifinal'
  if (r.includes('final')) return 'final'
  if (r.includes('cuart')) return 'cuartos'
  if (r.includes('octav') || r.includes('octa')) return 'octavos'
  return null
}

const winnersWithWinnerCount = computed(() => {
  return (partidos.value || []).filter(p => Boolean(p.id_equipo_ganador) || Boolean(p.equipoGanador)).length
})

// contar número de equipos únicos detectados a partir de los partidos
const nroEquipos = computed(() => {
  const s = new Set()
  for (const p of partidos.value || []) {
    const local = p.id_equipo_local || (p.equipoLocal && (p.equipoLocal.id || p.equipoLocal.id_equipo)) || (p.equipo_local && p.equipo_local.id)
    const visit = p.id_equipo_visitante || (p.equipoVisitante && (p.equipoVisitante.id || p.equipoVisitante.id_equipo)) || (p.equipo_visitante && p.equipo_visitante.id)
    if (local) s.add(String(local))
    if (visit) s.add(String(visit))
  }
  return s.size
})

// cuando hay >= nroEquipos - 1 partidos con ganador, el siguiente partido con ganador
// se considera el partido decisivo (ganador final). Aquí tomamos como heurística
// el partido con ganador de mayor id cuando ya se alcanzó el umbral.
const finalWinnerMatchId = computed(() => {
  const n = nroEquipos.value || 0
  if (n <= 0) return null
  if ((winnersWithWinnerCount.value || 0) < Math.max(0, n - 1)) return null
  let maxId = null
  for (const p of partidos.value || []) {
    const hasWinner = Boolean(p.id_equipo_ganador) || Boolean(p.equipoGanador)
    if (!hasWinner) continue
    const pid = Number(p.id || p.id_partido || 0)
    if (!maxId || pid > maxId) maxId = pid
  }
  return maxId
})

const finalWinner = computed(() => {
  const fid = finalWinnerMatchId.value
  if (!fid) return null
  const p = (partidos.value || []).find(x => Number(x.id || x.id_partido || 0) === fid)
  if (!p) return null
  const w = getWinnerEquipo(p)
  return w ? { team: w, partido: p } : null
})

const posiciones = computed(() => {
  // solo para torneos tipo 2
  if (displayTorneo.value?.id_tipo_torneo !== 2) return []
  const map = new Map()
  const addTeam = (id, nombre) => {
    const key = String(id || nombre || 'x_' + nombre)
    if (!map.has(key)) {
      map.set(key, {
        id: id || key,
        nombre: nombre || '—',
        PJ: 0,
        W: 0,
        E: 0,
        L: 0,
        GF: 0,
        GC: 0,
        PTS: 0,
      })
    }
    return map.get(key)
  }

  for (const p of partidos.value || []) {
    if (!p) continue
    // considerar solo partidos finalizados y no reprogramados
    if (!p.finalizado) continue
    const ronda = String(p.ronda || '').toLowerCase()
    if (ronda.includes('reprogramado')) continue

    const localId = p.id_equipo_local || (p.equipoLocal && (p.equipoLocal.id || p.equipoLocal.id_equipo)) || (p.equipo_local && p.equipo_local.id)
    const visitId = p.id_equipo_visitante || (p.equipoVisitante && (p.equipoVisitante.id || p.equipoVisitante.id_equipo)) || (p.equipo_visitante && p.equipo_visitante.id)
    const localName = p.equipoLocal?.nombre || p.equipo_local?.nombre || nameOf(p, 'local')
    const visitName = p.equipoVisitante?.nombre || p.equipo_visitante?.nombre || nameOf(p, 'visitante')

    const teamL = addTeam(localId, localName)
    const teamV = addTeam(visitId, visitName)

    const gl = Number(p.goles_local || p.golesLocal || 0)
    const gv = Number(p.goles_visitante || p.golesVisitante || 0)

    teamL.PJ += 1
    teamV.PJ += 1
    teamL.GF += gl
    teamL.GC += gv
    teamV.GF += gv
    teamV.GC += gl

    if (gl > gv) {
      teamL.W += 1
      teamV.L += 1
      teamL.PTS += 3
    } else if (gv > gl) {
      teamV.W += 1
      teamL.L += 1
      teamV.PTS += 3
    } else {
      // empate
      teamL.E += 1
      teamV.E += 1
      teamL.PTS += 1
      teamV.PTS += 1
    }
  }

  const arr = Array.from(map.values())
  arr.forEach(t => { t.DG = (t.GF || 0) - (t.GC || 0) })
  arr.sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS
    if (b.DG !== a.DG) return b.DG - a.DG
    return (b.GF || 0) - (a.GF || 0)
  })
  return arr
})

function shouldPaintFinal(p) {
  if (!p) return false
  const hasWinner = Boolean(p.id_equipo_ganador) || Boolean(p.equipoGanador)
  if (!hasWinner) return false
  const fid = finalWinnerMatchId.value
  if (!fid) return false
  const pid = Number(p.id || p.id_partido || 0)
  return pid === fid
}

// Mostrar u ocultar el botón "Avanzar fase". Si ya estamos en la fase de
// determinar el ganador final (>= nroEquipos - 1 ganadores), ocultamos el botón.
const showAdvance = computed(() => {
  if (displayTorneo.value?.id_tipo_torneo !== 1) return false
  const n = nroEquipos.value || 0
  if (n <= 1) return true
  return (winnersWithWinnerCount.value || 0) < Math.max(0, n - 1)
})

// cuando aparece un ganador final y no hay partidos 'en marcha', animar y
// lanzar confetti desde el nombre del equipo por ~2s (disparo único por apertura)
watch([finalWinner, enMarchaCount], ([fw, em]) => {
  if (!fw) return
  if ((em || 0) > 0) return
  if (finalConfettiFired.value) return
  // disparar confetti desde el elemento del nombre si existe
  try {
    const el = finalWinnerNameRef.value && finalWinnerNameRef.value.$el ? finalWinnerNameRef.value.$el : finalWinnerNameRef.value
    if (el) {
      // lanzar un par de ráfagas para que sea visible ~2s
      triggerConfetti(el)
      setTimeout(() => triggerConfetti(el), 700)
    } else {
      // fallback al centro
      triggerConfetti(null)
    }
  } catch (err) {
    // ignore
    void err
  }
  finalConfettiFired.value = true
})

watch(localVisible, v => {
  if (!v) {
    finalConfettiFired.value = false
  }
})

function close() {
  localVisible.value = false
}

function nameOf(p, side) {
  if (!p) return '-'
  if (side === 'local') return p.equipoLocal?.nombre || p.equipo_local?.nombre || '-'
  return p.equipoVisitante?.nombre || p.equipo_visitante?.nombre || '-'
}

function statusLabelColor(p) {
  if (!p) return { label: '-', color: 'grey' }
  const gl = Number(p.goles_local || p.golesLocal || 0)
  const gv = Number(p.goles_visitante || p.golesVisitante || 0)
  const hasWinner = Boolean(p.id_equipo_ganador) || Boolean(p.equipoGanador)
  if (hasWinner) return { label: 'Finalizado', color: 'positive' }
  if (gl === 0 && gv === 0) return { label: 'Reprogramado', color: 'grey' }
  if (gl === gv && gl > 0) return { label: 'Empate', color: 'amber' }
  if (p.finalizado) return { label: 'Finalizado', color: 'positive' }
  return { label: '-', color: 'grey' }
}

function isWinner(p, side) {
  if (!p) return false
  const winnerId = p.id_equipo_ganador || (p.equipoGanador && (p.equipoGanador.id || p.equipoGanador.id_equipo)) || null
  if (!winnerId) return false
  if (side === 'local') {
    return winnerId === p.id_equipo_local || winnerId === (p.equipoLocal && p.equipoLocal.id) || winnerId === (p.equipo_local && p.equipo_local.id)
  }
  return winnerId === p.id_equipo_visitante || winnerId === (p.equipoVisitante && p.equipoVisitante.id) || winnerId === (p.equipo_visitante && p.equipo_visitante.id)
}

function formatDateShort(dateString) {
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function incrementGoal(p, side) {
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para modificar este partido' })
    return
  }
  if (p.finalizado === true) {
    Notify.create({ type: 'warning', message: 'No se pueden cambiar los goles de un partido finalizado' })
    return
  }
  // Limitar silenciosamente a 10 goles por equipo
  if (side === 'local') {
    const curr = Number(p.goles_local) || 0
    if (curr >= 10) return
    p.goles_local = curr + 1
  } else {
    const curr = Number(p.goles_visitante) || 0
    if (curr >= 10) return
    p.goles_visitante = curr + 1
  }
  emit('partido-updated', JSON.parse(JSON.stringify(p)))
}

function decrementGoal(p, side) {
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para modificar este partido' })
    return
  }
  if (p.finalizado === true) {
    Notify.create({ type: 'warning', message: 'No se pueden cambiar los goles de un partido finalizado' })
    return
  }
  if (side === 'local') {
    p.goles_local = Math.max(0, (Number(p.goles_local) || 0) - 1)
  } else {
    p.goles_visitante = Math.max(0, (Number(p.goles_visitante) || 0) - 1)
  }
  emit('partido-updated', JSON.parse(JSON.stringify(p)))
}

function personaLabel(persona) {
  if (!persona) return '-'
  const names = [persona.nombres || persona.nombre || '', persona.apellido_paterno || '', persona.apellido_materno || '']
    .map(s => (s || '').trim())
    .filter(Boolean)
    .join(' ')
  const phone = persona.telefono || persona.celular || persona.movil || persona.telefono_celular || '-'
  return `${names} | ${phone}`
}

function getInitials(text) {
  if (!text) return '?'
  const parts = text.split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return text.charAt(0).toUpperCase()
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

// Manejo del diálogo de empate: confirmar reprogramación
async function confirmReprogram() {
  if (!tieDialogMatch.value) {
    tieDialogVisible.value = false
    return
  }
  try {
    // Asegurar que no quede ganador y marcar la ronda como reprogramada
    tieDialogMatch.value.equipoGanador = null
    tieDialogMatch.value.id_equipo_ganador = null
    const gl = Number(tieDialogMatch.value.goles_local || tieDialogMatch.value.golesLocal || 0)
    const gv = Number(tieDialogMatch.value.goles_visitante || tieDialogMatch.value.golesVisitante || 0)
    if (gl === 0 && gv === 0) {
      const vieja = tieDialogMatch.value.ronda || ''
      appendOrIncrementReprogram(tieDialogMatch.value, 'Reprogramado')
      tieDialogMatch.value.ronda_antigua = vieja
    } else {
      const vieja = tieDialogMatch.value.ronda || ''
      appendOrIncrementReprogram(tieDialogMatch.value, 'Reprogramado por empate')
      tieDialogMatch.value.ronda_antigua = vieja
    }
    // marcar como finalizado
    tieDialogMatch.value.finalizado = true
    tieDialogMatch.value.estado_partido = 'Finalizado'
    await reprogramarPartido(tieDialogMatch.value)
    Notify.create({ type: 'positive', message: 'Partido reprogramado' })
    const id = displayTorneo.value?.id || props.torneoId
    if (id) await loadPartidos(id)
  } catch (err) {
    console.error('Error reprogramando partido', err)
    Notify.create({ type: 'negative', message: 'No se pudo reprogramar el partido' })
  } finally {
    tieDialogVisible.value = false
    tieDialogMatch.value = null
  }
}

function cancelReprogram() {
  tieDialogVisible.value = false
  tieDialogMatch.value = null
}

// Helper local para añadir o incrementar contador de reprogramaciones en `ronda`.
function appendOrIncrementReprogram(p, label) {
  if (!p) return
  const current = p.ronda || ''
  if (!current.includes('Reprogramado')) {
    p.ronda = (current ? current + ' ' : '') + label
    return
  }
  const m = current.match(/Reprogramado(?: por empate)?(?:\s*(\d+)\s*vez)?$/)
  if (m) {
    const hasNumber = !!m[1]
    const currentNum = hasNumber ? Number(m[1]) : 1
    const next = currentNum + 1
    const porEmpate = /Reprogramado por empate/.test(current) || /por empate/.test(label)
    const replacement = 'Reprogramado' + (porEmpate ? ' por empate' : '') + ' ' + next + ' vez'
    p.ronda = current.replace(/Reprogramado(?: por empate)?(?:\s*(\d+)\s*vez)?$/, replacement)
  } else {
    p.ronda = current + ' 2 vez'
  }
}
</script>

<style scoped lang="scss">
.torneo-dialog {
  .torneo-card {
    min-width: 480px;
    max-width: 900px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }

  .dialog-header {
    padding: 20px 24px 16px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .torneo-info {
      flex: 1;
    }

    .torneo-title {
      font-weight: 600;
      color: #1a1a1a;
    }

    .tipo-badge {
      font-size: 0.75rem;
      padding: 4px 8px;
    }

    .torneo-meta {
      margin-top: 8px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      color: #666;
      font-size: 0.875rem;
    }

    .location-btn {
      color: #1976d2;
      font-weight: 500;
    }

    .encargados-section {
      margin-top: 12px;
    }

    .encargados-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .encargado-chip {
      background: #f5f7fa;
      border: 1px solid #e1e5eb;
    }

    .close-btn {
      color: #666;
    }
  }

  .partidos-section {
    padding: 16px 24px;

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .partidos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 12px;
    }

    .tabs-switch {
      min-width: 220px;
    }

    .partidos-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .standings-table {
      width: 100%;
      border-collapse: collapse;
    }

    .standings-table th,
    .standings-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e9ecef;
      text-align: left;
      font-size: 0.95rem;
    }

    .standings-table thead th {
      font-weight: 700;
      color: #333;
      background: #fafafa;
    }

    .standings-table tbody tr:nth-child(odd) {
      background: #ffffff;
    }

    .standings-table tbody tr:nth-child(even) {
      background: #fbfbfb;
    }

    .advance-center {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px 0;
    }

    .partido-card {
      border-radius: 8px;
      border: 1px solid #e1e5eb;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.finalizado {
        background: #f8f9fa;
        border-color: #d1e7dd;

        .partido-finalizado-indicator {
          display: flex;
        }
      }
    }

    .partido-content {
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr auto 1fr auto;
      align-items: center;
      gap: 16px;
    }

    .equipo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .equipo-local {
      justify-content: flex-start;
    }

    .equipo-visitante {
      justify-content: flex-end;
    }

    .equipo-info {
      flex: 1;
    }

    .equipo-nombre {
      font-weight: 600;
      font-size: 1rem;
      color: #1a1a1a;
    }

    .marcador {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .goles {
      min-width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #f5f7fa;
      font-weight: 800;
      font-size: 1.375rem;
      color: #1a1a1a;
    }

    /* Winner highlight for finalizados */
    .partido-card.finalizado .equipo.winner .goles {
      background: #d1e7dd;
      border: 1px solid #0f5132;
      color: #0f5132;
      font-weight: 900;
    }

    .partido-card.finalizado .equipo.winner .equipo-nombre {
      color: #0f5132;
      font-weight: 800;
    }

    .goal-btn {
      color: #666;

      &:hover {
        background: #e9ecef;
      }
    }

    .partido-separador {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .vs {
      font-weight: 700;
      color: #666;
      font-size: 0.875rem;
    }

    .ronda {
      font-size: 0.75rem;
      color: #888;
      background: #f1f3f4;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .partido-acciones {
      display: flex;
      justify-content: center;
    }

    .finalizar-btn {
      min-width: 100px;
    }

    .partido-finalizado-indicator {
      display: none;
      position: absolute;
      top: 0;
      right: 0;
      background: #d1e7dd;
      color: #0f5132;
      padding: 4px 12px;
      border-bottom-left-radius: 8px;
      font-size: 0.75rem;
      font-weight: 500;
      align-items: center;
    }

    .ganador-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .ganador-equina {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #e1e5eb;
      margin-left: 8px;
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
    }

    .ganador-equina .horse-icon {
      color: #f59e0b;
      font-size: 18px;
      line-height: 1;
    }

    .partido-card.finalizado .equipo.winner .ganador-equina {
      background: #d1e7dd;
      border-color: #0f5132;
    }

    .partido-card.finalizado .equipo.winner .ganador-equina .horse-icon {
      color: #0f5132;
    }

    /* Final (oro) */
    @keyframes glowFinal {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 184, 20, 0.10);
      }

      50% {
        box-shadow: 0 0 20px 6px rgba(255, 184, 20, 0.16);
      }

      100% {
        box-shadow: 0 0 0 0 rgba(255, 184, 20, 0.10);
      }
    }

    .partido-card.finalizado .equipo.winner-final {
      position: relative;
    }

    .partido-card.finalizado .equipo.winner-final .goles {
      background: linear-gradient(180deg, #fff8e1, #fff3c4);
      border: 1px solid #ffb300;
      color: #8b5e00;
      font-weight: 900;
      animation: glowFinal 2.2s infinite ease-in-out;
    }

    .partido-card.finalizado .equipo.winner-final .equipo-nombre {
      color: #8b5e00;
      font-weight: 800;
    }

    .partido-card.finalizado .equipo.winner-final::before {
      content: '';
      position: absolute;
      left: -60%;
      width: 220%;
      pointer-events: none;
      z-index: 2;
      top: 28%;
      height: 12px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.12));
      transform: translateX(-100%) rotate(-25deg);
      opacity: 0.9;
      animation: diagLR 3.2s linear infinite;
    }

    @keyframes diagLR {
      0% {
        transform: translateX(-100%) rotate(-25deg);
      }

      100% {
        transform: translateX(100%) rotate(-25deg);
      }
    }

    /* Semifinal (azul) */
    @keyframes glowSemi {
      0% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.06);
      }

      50% {
        box-shadow: 0 0 18px 5px rgba(37, 99, 235, 0.12);
      }

      100% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.06);
      }
    }

    .partido-card.finalizado .equipo.winner-semifinal .goles {
      background: linear-gradient(180deg, #e8f0ff, #dbe9ff);
      border: 1px solid #2563eb;
      color: #0b3d91;
      font-weight: 800;
      animation: glowSemi 2.2s infinite ease-in-out;
    }

    .partido-card.finalizado .equipo.winner-semifinal .equipo-nombre {
      color: #0b3d91;
      font-weight: 700;
    }

    /* Cuartos (teal) */
    @keyframes glowCuartos {
      0% {
        box-shadow: 0 0 0 0 rgba(14, 165, 132, 0.08);
      }

      50% {
        box-shadow: 0 0 18px 5px rgba(14, 165, 132, 0.14);
      }

      100% {
        box-shadow: 0 0 0 0 rgba(14, 165, 132, 0.08);
      }
    }

    .partido-card.finalizado .equipo.winner-cuartos .goles {
      background: linear-gradient(180deg, #e6fffa, #ccfbf1);
      border: 1px solid #0ea5a4;
      color: #064e3b;
      font-weight: 800;
      animation: glowCuartos 2.2s infinite ease-in-out;
    }

    .partido-card.finalizado .equipo.winner-cuartos .equipo-nombre {
      color: #064e3b;
      font-weight: 700
    }

    /* Octavos (purple) */
    @keyframes glowOctavos {
      0% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.08);
      }

      50% {
        box-shadow: 0 0 18px 5px rgba(139, 92, 246, 0.14);
      }

      100% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.08);
      }
    }

    .partido-card.finalizado .equipo.winner-octavos .goles {
      background: linear-gradient(180deg, #f3e8ff, #efe6ff);
      border: 1px solid #8b5cf6;
      color: #3c096c;
      font-weight: 800;
      animation: glowOctavos 2.2s infinite ease-in-out;
    }

    .partido-card.finalizado .equipo.winner-octavos .equipo-nombre {
      color: #3c096c;
      font-weight: 700
    }

    /* Estilos para empates en torneos tipo 2 (resaltado de goles y nombre) */
    .partido-card .equipo.empate .goles {
      background: linear-gradient(180deg, #fff7ed, #fff1d6);
      border: 1px solid #f59e0b;
      color: #92400e;
      font-weight: 800;
    }

    .partido-card .equipo.empate .equipo-nombre {
      color: #92400e;
      font-weight: 700;
    }

    /* Estilo trofeo palpitante para ganador definitivo mostrado en 'En marcha' */
    .special-final-winner .trophy-img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      animation: beat 1s ease-in-out infinite;
    }

    @keyframes beat {
      0% {
        transform: scale(1);
      }

      50% {
        transform: scale(1.12);
      }

      100% {
        transform: scale(1);
      }
    }
  }

  .dialog-actions {
    padding: 16px 24px;
    border-top: 1px solid #e1e5eb;
  }
}

// Responsive
@media (max-width: 768px) {
  .torneo-dialog {
    .torneo-card {
      min-width: unset;
      margin: 16px;
    }

    .partido-content {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto;
      gap: 12px;
      text-align: center;
    }

    .equipo-local,
    .equipo-visitante {
      justify-content: center;
    }

    .equipo-visitante {
      flex-direction: row-reverse;
    }

    .partido-separador {
      order: -1;
      flex-direction: row;
      justify-content: center;
      gap: 12px;
    }

    .partido-acciones {
      margin-top: 8px;
    }
  }
}

@media (max-width: 480px) {
  .torneo-dialog {

    .dialog-header,
    .partidos-section,
    .dialog-actions {
      padding-left: 16px;
      padding-right: 16px;
    }

    .torneo-title {
      font-size: 1.25rem;
    }

    .torneo-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
}

/* Estilos para el diálogo de empate/reprogramación */
.tie-dialog .team-name {
  color: #1a1a1a;
  font-weight: 700;
}

.tie-dialog .goals-color {
  color: #1976d2;
  font-weight: 800;
  margin: 0 10px;
}

/* Mobile-only helpers (hidden by default) */
.mobile-only {
  display: none;
}

@media (max-width: 520px) {
  .mobile-only {
    display: block;
  }

  .torneo-dialog {

    /* make the partidos list horizontally scrollable */
    .partidos-list {
      display: flex;
      flex-direction: row;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 10px;
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
    }

    .partido-card {
      min-width: 320px;
      flex: 0 0 auto;
      scroll-snap-align: start;
    }

    /* Use a grid layout inside each card to match requested rows/columns */
    .partido-content {
      display: grid;
      grid-template-columns: 1fr 72px 1fr;
      grid-template-rows: auto auto auto;
      grid-template-areas:
        "local-controls . visitante-controls"
        "local-name vs visitante-name"
        "actions actions actions";
      gap: 8px;
      align-items: center;
      padding: 12px;
    }

    /* hide desktop-specific markers/info to avoid duplication */
    .partido-content .marcador {
      display: none !important;
    }

    .partido-content .equipo-info {
      display: none !important;
    }

    .mobile-local-controls {
      grid-area: local-controls;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mobile-visit-controls {
      grid-area: visitante-controls;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mobile-local-name {
      grid-area: local-name;
      text-align: left;
      padding-left: 6px;
    }

    .mobile-visit-name {
      grid-area: visitante-name;
      text-align: right;
      padding-right: 6px;
    }

    .mobile-vs {
      grid-area: vs;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .mobile-actions {
      grid-area: actions;
      display: flex;
      justify-content: center;
      padding-top: 6px;
    }

    .mobile-goals {
      min-width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: #f5f7fa;
      font-weight: 800;
      font-size: 1.25rem;
    }

    .mobile-icons {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
    }
  }
}
</style>
