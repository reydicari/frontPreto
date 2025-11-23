<template>
  <q-dialog v-model="localVisible" persistent class="mobile-torneo-dialog">
    <q-card class="mobile-card">
      <q-card-section class="mobile-header row items-center">
        <div class="col">
          <div class="text-h6">{{ displayTorneo?.nombre || 'Seguimiento (móvil)' }}</div>
          <div class="text-caption">{{ displayTorneo?.ubicacion?.nombre || '—' }} • {{
            formatDateShort(displayTorneo?.fecha_inicio) }}</div>
        </div>
        <q-btn flat round dense icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section class="mobile-partidos">
        <div v-if="loading" class="loading">
          <q-spinner-dots color="primary" />
        </div>

        <div v-else>
          <div v-if="(!partidos || partidos.length === 0)" class="empty">
            <q-icon name="sports" size="48px" color="grey-5" />
            <div class="text-caption q-mt-sm">No hay partidos</div>
          </div>

          <div v-else>
            <!-- En marcha -->
            <div class="section">
              <div class="section-header row items-center q-mb-sm">
                <div class="text-subtitle2">En marcha</div>
                <q-badge color="primary" class="q-ml-sm">{{ partidosEnMarcha.length }}</q-badge>
              </div>
              <div class="list en-marcha">
                <q-card v-for="p in partidosEnMarcha" :key="p.id || `${p.id_equipo_local}-${p.id_equipo_visitante}`"
                  class="m-partido-card">
                  <!-- Row 1: goles + icons next to number -->
                  <div class="row row-1">
                    <div class="col goals-col">
                      <div class="goal-with-icons">
                        <div class="mobile-goals">{{ Number(p.goles_local || 0) }}</div>
                        <div class="mobile-icons">
                          <template v-if="isEncargado && !p.finalizado">
                            <q-btn round dense flat icon="add" size="sm" @click.stop="incrementGoal(p, 'local')" />
                            <q-btn round dense flat icon="remove" size="sm" @click.stop="decrementGoal(p, 'local')"
                              :disable="Number(p.goles_local || 0) <= 0" />
                          </template>
                        </div>
                      </div>
                    </div>

                    <div class="col goals-col right">
                      <div class="goal-with-icons right">
                        <div class="mobile-goals">{{ Number(p.goles_visitante || 0) }}</div>
                        <div class="mobile-icons">
                          <template v-if="isEncargado && !p.finalizado">
                            <q-btn round dense flat icon="add" size="sm" @click.stop="incrementGoal(p, 'visitante')" />
                            <q-btn round dense flat icon="remove" size="sm" @click.stop="decrementGoal(p, 'visitante')"
                              :disable="Number(p.goles_visitante || 0) <= 0" />
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Row 2: nombre | VS + ronda | nombre -->
                  <div class="row row-2">
                    <div class="col name-left">{{ nameOf(p, 'local') }}</div>
                    <div class="col vs-center">
                      <div class="vs">VS</div>
                      <div class="ronda">{{ p.ronda || '-' }}</div>
                    </div>
                    <div class="col name-right">{{ nameOf(p, 'visitante') }}</div>
                  </div>

                  <!-- Row 3: boton Finalizar -->
                  <div class="row row-3">
                    <div class="col actions">
                      <q-btn color="primary" unelevated
                        v-if="isEncargado && p.id_equipo_ganador == null && p.finalizado !== true" label="Finalizar"
                        @click.stop="finishMatch(p, $event.currentTarget)" />
                    </div>
                    <div class="col status-col" v-if="p.finalizado === true">
                      <q-icon name="check_circle" size="16px" class="q-mr-xs" :color="statusLabelColor(p).color" />
                      <span class="finalizado-label" :style="{ color: statusLabelColor(p).color }">{{
                        statusLabelColor(p).label }}</span>
                    </div>
                  </div>
                </q-card>
              </div>
            </div>

            <!-- Finalizados -->
            <div class="section q-mt-md">
              <div class="section-header row items-center q-mb-sm">
                <div class="text-subtitle2">Finalizados</div>
                <q-badge color="grey" class="q-ml-sm">{{ partidosFinalizados.length }}</q-badge>
              </div>
              <div class="list finalizados">
                <q-card v-for="p in partidosFinalizados"
                  :key="`f-${p.id || p.id_equipo_local + '-' + p.id_equipo_visitante}`" class="m-partido-card">
                  <!-- Row 1: goles + icons next to number -->
                  <div class="row row-1">
                    <div class="col goals-col">
                      <div class="goal-with-icons">
                        <div class="mobile-goals">{{ Number(p.goles_local || 0) }}</div>
                        <div class="mobile-icons">
                          <q-btn round dense flat icon="add" size="sm" @click.stop="incrementGoal(p, 'local')"
                            :disable="p.finalizado === true" />
                          <q-btn round dense flat icon="remove" size="sm" @click.stop="decrementGoal(p, 'local')"
                            :disable="p.finalizado === true || Number(p.goles_local || 0) <= 0" />
                        </div>
                      </div>
                    </div>

                    <div class="col goals-col right">
                      <div class="goal-with-icons right">
                        <div class="mobile-goals">{{ Number(p.goles_visitante || 0) }}</div>
                        <div class="mobile-icons">
                          <q-btn round dense flat icon="add" size="sm" @click.stop="incrementGoal(p, 'visitante')"
                            :disable="p.finalizado === true" />
                          <q-btn round dense flat icon="remove" size="sm" @click.stop="decrementGoal(p, 'visitante')"
                            :disable="p.finalizado === true || Number(p.goles_visitante || 0) <= 0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Row 2: nombre | VS + ronda | nombre -->
                  <div class="row row-2">
                    <div class="col name-left">{{ nameOf(p, 'local') }}</div>
                    <div class="col vs-center">
                      <div class="vs">VS</div>
                      <div class="ronda">{{ p.ronda || '-' }}</div>
                    </div>
                    <div class="col name-right">{{ nameOf(p, 'visitante') }}</div>
                  </div>

                  <!-- Row 3: boton Finalizar -->
                  <div class="row row-3">
                    <div class="col actions">
                      <q-btn color="primary" unelevated
                        v-if="isEncargado && p.id_equipo_ganador == null && p.finalizado !== true" label="Finalizar"
                        @click.stop="finishMatch(p, $event.currentTarget)" />
                    </div>
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="grey-7" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { listarPartidos, actualizarPartido, reprogramarPartido } from 'src/stores/partido-store'
import { obtenerTorneo } from 'src/stores/torneo-store'
import { Notify } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  torneoId: { type: [Number, String], required: false },
  torneo: { type: Object, required: false }
})
const emit = defineEmits(['update:modelValue', 'partido-updated', 'open-organize'])

const localVisible = ref(props.modelValue)
const partidos = ref([])
const loading = ref(false)
const localTorneo = ref(props.torneo || null)
const displayTorneo = ref(localTorneo.value)
const partidosEnMarcha = computed(() => {
  return (partidos.value || []).filter(p => !p.finalizado)
})
const partidosFinalizados = computed(() => {
  // ordenar por id descendente para mostrar los más recientes primero en finalizados
  return (partidos.value || []).filter(p => !!p.finalizado).slice().sort((a, b) => {
    const ai = Number(a?.id || a?.id_equipo_local || 0)
    const bi = Number(b?.id || b?.id_equipo_local || 0)
    return bi - ai
  })
})

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
    console.error('Error al cargar partidos', err)
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
    partidos.value = (partidos.value || []).map(p => {
      // normalizar finalizado a booleano teniendo en cuenta campos existentes
      p.finalizado = Boolean(p.finalizado) || p.estado_partido === 'Finalizado' || Boolean(p.id_equipo_ganador) || Boolean(p.equipoGanador)
      if ((p.id_equipo_ganador || p.equipoGanador) && p.estado_partido !== 'Finalizado') {
        p.estado_partido = 'Finalizado'
      }
      p.goles_local = Number(p.goles_local || p.golesLocal || 0)
      p.goles_visitante = Number(p.goles_visitante || p.golesVisitante || 0)
      return p
    })
  } catch (err) {
    console.error('Error al listar partidos', err)
    partidos.value = []
  } finally {
    loading.value = false
  }
}

// permisos
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
  // sin ganador
  if (gl === 0 && gv === 0) return { label: 'Reprogramado', color: 'grey' }
  if (gl === gv && gl > 0) return { label: 'Empate', color: 'amber' }
  // fallback: si está marcado finalizado aun sin ganador
  if (p.finalizado) return { label: 'Finalizado', color: 'positive' }
  return { label: '-', color: 'grey' }
}

async function incrementGoal(p, side) {
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para modificar este partido' })
    return
  }
  if (p.finalizado === true) {
    Notify.create({ type: 'warning', message: 'No se pueden cambiar los goles de un partido finalizado' })
    return
  }
  if (side === 'local') p.goles_local = (Number(p.goles_local) || 0) + 1
  else p.goles_visitante = (Number(p.goles_visitante) || 0) + 1
  emit('partido-updated', JSON.parse(JSON.stringify(p)))
}

async function decrementGoal(p, side) {
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para modificar este partido' })
    return
  }
  if (p.finalizado === true) {
    Notify.create({ type: 'warning', message: 'No se pueden cambiar los goles de un partido finalizado' })
    return
  }
  if (side === 'local') p.goles_local = Math.max(0, (Number(p.goles_local) || 0) - 1)
  else p.goles_visitante = Math.max(0, (Number(p.goles_visitante) || 0) - 1)
  emit('partido-updated', JSON.parse(JSON.stringify(p)))
}

async function finishMatch(p, maybeOrigin) {
  if (!p) return
  if (!isEncargado.value) {
    Notify.create({ type: 'warning', message: 'No tienes permiso para finalizar este partido' })
    return
  }
  // Capturar posición del botón (si se pasa) para origin del confetti
  let savedOrigin = null
  try {
    const maybeEl = maybeOrigin
    let el = null
    if (maybeEl instanceof Element) el = maybeEl
    else if (maybeEl && (maybeEl.currentTarget || maybeEl.target)) el = maybeEl.currentTarget || maybeEl.target
    if (el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect()
      savedOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
  } catch (e) {
    void e
  }

  const golesLocal = Number(p.goles_local || p.golesLocal || 0)
  const golesVisit = Number(p.goles_visitante || p.golesVisitante || 0)
  if (golesLocal === golesVisit) {
    // abrir diálogo de reprogramación (simple confirm de browser para mantenerlo ligero)
    const ok = confirm('El partido está empatado. ¿Deseas reprogramarlo?')
    if (!ok) return
    try {
      p.equipoGanador = null
      p.id_equipo_ganador = null
      // Ajustar texto de ronda según tipo de empate, y manejar reprogramaciones repetidas
      const isZero = (golesLocal === 0 && golesVisit === 0)
      // guardar ronda antigua antes de modificarla y enviarla al backend
      const viejaRonda = p.ronda || ''
      appendOrIncrementReprogram(p, isZero ? 'Reprogramado' : 'Reprogramado por empate')
      p.ronda_antigua = viejaRonda
      // marcar como finalizado para ambos casos
      p.finalizado = true
      p.estado_partido = 'Finalizado'
      await reprogramarPartido(p)
      Notify.create({ type: 'positive', message: 'Partido reprogramado' })
      const id = displayTorneo.value?.id || props.torneoId
      if (id) await loadPartidos(id)
    } catch (err) {
      console.error('Error reprogramando partido', err)
      Notify.create({ type: 'negative', message: 'No se pudo reprogramar el partido' })
    }
    return
  }
  // determinar ganador y actualizar
  const localId = p.id_equipo_local || (p.equipoLocal && (p.equipoLocal.id || p.equipoLocal.id_equipo)) || (p.equipo_local && p.equipo_local.id)
  const visitId = p.id_equipo_visitante || (p.equipoVisitante && (p.equipoVisitante.id || p.equipoVisitante.id_equipo)) || (p.equipo_visitante && p.equipo_visitante.id)
  let winnerId = null; let winnerObj = null
  if (golesLocal > golesVisit) {
    winnerId = localId || null
    winnerObj = p.equipoLocal || p.equipo_local || null
  } else {
    winnerId = visitId || null
    winnerObj = p.equipoVisitante || p.equipo_visitante || null
  }
  p.equipoGanador = winnerObj
  p.id_equipo_ganador = (winnerObj && (winnerObj.id || winnerObj.id_equipo)) || winnerId
  p.estado_partido = 'Finalizado'
  // marcar bandera finalizado para separación clara en UI
  p.finalizado = true
  try {
    await actualizarPartido(p)
    emit('partido-updated', JSON.parse(JSON.stringify(p)))
    Notify.create({ type: 'positive', message: 'Partido finalizado' })
    try {
      triggerConfetti(savedOrigin)
    } catch {
      try { triggerConfettiAtCenter() } catch { /* ignore */ }
    }
  } catch (err) {
    console.error('Error actualizando partido', err)
    Notify.create({ type: 'negative', message: 'No se pudo finalizar el partido' })
  }
}

function triggerConfettiAtCenter() {
  if (typeof window === 'undefined') return
  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '2147483647'
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr))
  canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr))
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)
  const colors = ['#ff6b6b', '#ffd93d', '#6be4ff', '#9b8cff', '#6bff9b']
  const particles = []
  for (let i = 0; i < 60; i++) particles.push({ x: window.innerWidth / 2, y: window.innerHeight / 2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.8) * 10 - 2, size: 6 + Math.random() * 6, life: 80 + Math.random() * 60, color: colors[Math.floor(Math.random() * colors.length)], rotation: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.4 })
  let frame = 0
  function draw() {
    frame++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.vy += 0.12
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr
      p.life--
      const alpha = Math.max(0, p.life / 140)
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore()
      if (p.life <= 0 || p.y > window.innerHeight + 80) particles.splice(i, 1)
    }
    if (particles.length > 0 && frame < 600) requestAnimationFrame(draw)
    else setTimeout(() => { if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas) }, 600)
  }
  requestAnimationFrame(draw)
}

// Helper para añadir o incrementar contador de reprogramaciones en `p.ronda`.
function appendOrIncrementReprogram(p, label) {
  if (!p) return
  const current = p.ronda || ''
  if (!current.includes('Reprogramado')) {
    // si no existe, simplemente añadir con espacio si hace falta
    p.ronda = (current ? current + ' ' : '') + label
    return
  }
  // ya contiene 'Reprogramado' -> buscar si ya tiene contador de 'N vez' al final
  const m = current.match(/Reprogramado(?: por empate)?(?:\s*(\d+)\s*vez)?$/)
  if (m) {
    const hasNumber = !!m[1]
    const currentNum = hasNumber ? Number(m[1]) : 1
    const next = currentNum + 1
    // respetar si la cadena ya indica 'por empate'
    const porEmpate = /Reprogramado por empate/.test(current) || /por empate/.test(label)
    const replacement = 'Reprogramado' + (porEmpate ? ' por empate' : '') + ' ' + next + ' vez'
    p.ronda = current.replace(/Reprogramado(?: por empate)?(?:\s*(\d+)\s*vez)?$/, replacement)
  } else {
    // fallback: añadir contador 2 vez
    p.ronda = current + ' 2 vez'
  }
}

function triggerConfetti(originArg) {
  if (typeof window === 'undefined') return
  // similar to desktop: accept {x,y} or Element/Event
  let originX = window.innerWidth / 2
  let originY = window.innerHeight / 2
  try {
    if (originArg && typeof originArg.x === 'number' && typeof originArg.y === 'number') {
      originX = originArg.x
      originY = originArg.y
    } else if (originArg instanceof Element) {
      const r = originArg.getBoundingClientRect()
      originX = r.left + r.width / 2
      originY = r.top + r.height / 2
    } else if (originArg && (originArg.clientX || originArg.clientY)) {
      originX = originArg.clientX || originX
      originY = originArg.clientY || originY
    }
  } catch {
    originX = window.innerWidth / 2
    originY = window.innerHeight / 2
  }

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.left = '0'
  canvas.style.top = '0'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '2147483647'
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr))
  canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr))
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)
  const colors = ['#ff6b6b', '#ffd93d', '#6be4ff', '#9b8cff', '#6bff9b']
  const particles = []
  const count = 60
  for (let i = 0; i < count; i++) {
    particles.push({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.8) * 12 - 2,
      size: 6 + Math.random() * 6,
      life: 80 + Math.random() * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.4
    })
  }
  let frame = 0
  function draw() {
    frame++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.vy += 0.12
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr
      p.life--
      const alpha = Math.max(0, p.life / 140)
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore()
      if (p.life <= 0 || p.y > window.innerHeight + 80) particles.splice(i, 1)
    }
    if (particles.length > 0 && frame < 600) requestAnimationFrame(draw)
    else setTimeout(() => { if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas) }, 600)
  }
  requestAnimationFrame(draw)
}

function close() { localVisible.value = false }
function formatDateShort(dateString) { if (!dateString) return '—'; const d = new Date(dateString); if (Number.isNaN(d.getTime())) return '—'; const pad = (n) => String(n).padStart(2, '0'); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }

onMounted(() => {
  const id = props.torneo?.id || props.torneoId
  if (id && localVisible.value) loadPartidos(id)
})

onBeforeUnmount(() => { })
</script>

<style scoped lang="scss">
.mobile-card {
  min-width: 320px;
  max-width: 420px;
  border-radius: 10px;
}

.mobile-header {
  padding: 12px 16px;
}

.mobile-partidos {
  padding: 8px 12px
}

.m-partido-card {
  margin-bottom: 12px;
  border-radius: 8px;
}

.row-1 {
  display: flex;
  justify-content: space-between;
  gap: 8px
}

.goals-col {
  display: flex;
  align-items: center;
}

.goal-with-icons {
  display: flex;
  align-items: center;
  gap: 8px
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
  font-size: 1.25rem
}

.mobile-icons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 8px
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding-top: 8px
}

.row-3 {
  padding-top: 10px;
  display: flex;
  justify-content: center
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch
}

.list .m-partido-card {
  min-width: unset;
  flex: none;
  width: 100%
}
</style>
