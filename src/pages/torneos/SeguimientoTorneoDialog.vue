<template>
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
                <span>{{ formatDateShort(displayTorneo?.fecha_inicio) }} → {{ formatDateShort(displayTorneo?.fecha_fin)
                }}</span>
              </div>
            </div>

            <div v-if="displayTorneo?.encargados && displayTorneo.encargados.length" class="encargados-section q-mt-sm">
              <div class="text-caption text-weight-medium q-mb-xs">Encargado(s):</div>
              <div class="encargados-chips">
                <q-chip v-for="e in displayTorneo.encargados" :key="e.id || e.id_persona" dense class="encargado-chip">
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
                  <q-tab name="finalizados" label="Finalizados" />
                </q-tabs>
              </div>
            </div>

            <div class="partidos-list">
              <q-card v-for="p in filteredPartidos" :key="p.id || `${p.id_equipo_local}-${p.id_equipo_visitante}`"
                class="partido-card"
                :class="{ 'finalizado': p.estado_partido === 'Finalizado' || p.id_equipo_ganador || p.equipoGanador }">
                <q-card-section class="partido-content">
                  <!-- Equipo local -->
                  <div class="equipo equipo-local" :class="{ winner: isWinner(p, 'local') }">
                    <div class="equipo-info">
                      <div class="equipo-nombre">{{ nameOf(p, 'local') }}</div>
                    </div>

                    <div class="marcador">
                      <template v-if="isEncargado">
                        <q-btn round dense flat icon="remove" size="sm" @click="decrementGoal(p, 'local')"
                          :disable="p.estado_partido === 'Finalizado' || Number(p.goles_local || 0) <= 0"
                          class="goal-btn" />
                        <div class="goles">{{ Number(p.goles_local || 0) }}</div>
                        <q-btn round dense flat icon="add" size="sm" @click="incrementGoal(p, 'local')"
                          :disable="p.estado_partido === 'Finalizado'" class="goal-btn" />
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
                  <div class="equipo equipo-visitante" :class="{ winner: isWinner(p, 'visitante') }">
                    <div class="marcador">
                      <template v-if="isEncargado">
                        <q-btn round dense flat icon="remove" size="sm" @click="decrementGoal(p, 'visitante')"
                          :disable="p.estado_partido === 'Finalizado' || Number(p.goles_visitante || 0) <= 0"
                          class="goal-btn" />
                        <div class="goles">{{ Number(p.goles_visitante || 0) }}</div>
                        <q-btn round dense flat icon="add" size="sm" @click="incrementGoal(p, 'visitante')"
                          :disable="p.estado_partido === 'Finalizado'" class="goal-btn" />
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
                      <q-btn color="primary" unelevated v-if="p.id_equipo_ganador == null" label="Finalizar"
                        @click="finishMatch(p, $event.currentTarget)" />
                    </template>
                  </div>
                </q-card-section>

                <!-- Estado del partido -->
                <div v-if="p.estado_partido === 'Finalizado'" class="partido-finalizado-indicator">
                  <q-icon name="check_circle" size="16px" class="q-mr-xs" />
                  <span>Finalizado</span>
                </div>
              </q-card>
            </div>

            <div class="advance-center q-mt-md" v-if="enMarchaCount === 0 && partidos.length > 0">
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
    <OrganizeMatchesDialog :modelValue="organizeVisible" @update:modelValue="val => organizeVisible = val"
      :torneoId="displayTorneo?.id || props.torneoId" :initialTeams="organizeTeams" />
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import OrganizeMatchesDialog from 'src/pages/torneos/OrganizeMatchesDialog.vue'
import { actualizarPartido, listarPartidos } from 'src/stores/partido-store'
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

const filteredPartidos = computed(() => {
  if (!partidos.value) return []
  if (filterMode.value === 'en_marcha') {
    return partidos.value.filter(p => !p.id_equipo_ganador && !p.equipoGanador && p.estado_partido !== 'Finalizado')
  }
  return partidos.value.filter(p => !!p.id_equipo_ganador || !!p.equipoGanador || p.estado_partido === 'Finalizado')
})

const enMarchaCount = computed(() => {
  if (!partidos.value) return 0
  return partidos.value.filter(p => !p.id_equipo_ganador && !p.equipoGanador && p.estado_partido !== 'Finalizado').length
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
      // defensivo: normalizar estado y tipos
      if ((p.id_equipo_ganador || p.equipoGanador) && p.estado_partido !== 'Finalizado') {
        p.estado_partido = 'Finalizado'
      }
      // asegurar campos de goles como números para evitar comparaciones erróneas
      p.goles_local = Number(p.goles_local || p.golesLocal || 0)
      p.goles_visitante = Number(p.goles_visitante || p.golesVisitante || 0)
      return p
    })
  } catch (err) {
    console.error('Error al listar partidos', err)
    Notify.create({ type: 'negative', message: 'No se pudieron cargar los partidos' })
    partidos.value = []
  } finally {
    loading.value = false
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
    Notify.create({ type: 'warning', message: 'No se puede finalizar un partido en empate. el partido debe volver a jugarse.' })
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

function openOrganizeWithWinners() {
  const winnersMap = new Map()
  for (const p of partidos.value || []) {
    const w = getWinnerEquipo(p)
    if (w && w.id) winnersMap.set(String(w.id), w)
  }
  const winners = Array.from(winnersMap.values())
  if (!winners || winners.length < 2) {
    Notify.create({ type: 'warning', message: 'Se requieren al menos 2 equipos ganadores para organizar la siguiente fase' })
    return
  }
  const torneoId = displayTorneo.value?.id || props.torneoId
  // abrir localmente el diálogo de organización con los ganadores
  organizeTeams.value = winners
  organizeVisible.value = true
  // emitir también por compatibilidad
  emit('open-organize', { torneoId, teams: winners })
  Notify.create({ type: 'positive', message: `Abriendo organizador con ${winners.length} equipos ganadores` })
}

function close() {
  localVisible.value = false
}

function nameOf(p, side) {
  if (!p) return '-'
  if (side === 'local') return p.equipoLocal?.nombre || p.equipo_local?.nombre || '-'
  return p.equipoVisitante?.nombre || p.equipo_visitante?.nombre || '-'
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
  if (p.estado_partido === 'Finalizado') {
    Notify.create({ type: 'warning', message: 'No se pueden cambiar los goles de un partido finalizado' })
    return
  }
  if (side === 'local') {
    p.goles_local = (Number(p.goles_local) || 0) + 1
  } else {
    p.goles_visitante = (Number(p.goles_visitante) || 0) + 1
  }
  emit('partido-updated', JSON.parse(JSON.stringify(p)))
}

function decrementGoal(p, side) {
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para modificar este partido' })
    return
  }
  if (p.estado_partido === 'Finalizado') {
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
</style>
