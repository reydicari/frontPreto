<template>
  <q-dialog v-model="localVisible" persistent>
    <q-card style="width: min(920px, 96vw); max-width: 920px;">
      <q-card-section>
        <!-- Encabezado único: título + nombre del torneo (centrados) -->
        <div class="organize-header column items-center justify-center q-pa-sm text-center">
          <div class="text-h6">Ordenar partidos</div>
          <div class="text-h5 text-primary q-mt-xs"><strong>{{ torneoNombre || '—' }}</strong></div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8 d-flex">
            <q-card flat bordered class="matches-container q-pa-sm">
              <q-card-section>
                <div class="q-mt-xs">
                  <div class="text-h5 text-primary q-mt-xs"><strong>{{ phaseName || 'No especificada' }}</strong></div>
                </div>
                <div class="row items-center q-mt-sm">
                  <!-- El botón 'Mezclar' se muestra solo en la sección de tipo 4 debajo del icono de ayuda. -->
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section>
                <div v-if="loading" class="row items-center justify-center q-pa-md">
                  <q-spinner-dots size="28px" />
                </div>
                <div v-else>
                  <div v-if="!matches.length" class="text-caption">
                    <div v-if="torneoType === 4" class="row column items-center justify-center q-pa-xl">
                      <q-icon name="sports_soccer" size="56px" class="q-mb-md text-grey" />
                      <div class="text-h6">Aún no hay desafíos generados</div>
                      <div class="text-caption q-mt-sm">Ingrese la cantidad de desafíos y genere la distribución.</div>
                    </div>
                    <div v-else>No se generaron partidos.</div>
                  </div>
                  <div v-else class="matches-grid q-gutter-sm">
                    <q-card v-for="(m, idx) in displayedMatches" :key="`m-${idx}`" flat bordered
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
                  <!-- Para tipo 4 añadimos input 'cantidad de desafios' y habilitamos botones según su valor -->
                  <div v-if="torneoType === 4" class="row q-col-gutter-sm">
                    <q-input dense v-model.number="desafiosCount" type="number" min="1" max="5" class="col"
                      label="Cantidad de desafíos" autofocus hint="Ingrese valor 1-5"
                      :rules="[val => desafiosRule(val)]" :readonly="desafiosLocked" />
                  </div>

                  <q-btn v-if="torneoType !== 2 && torneoType !== 4" dense unelevated color="secondary"
                    class="full-width" label="por orden de registro" @click="paresConImpares" />
                  <q-btn dense unelevated color="orange" class="full-width" label="Sortear aleatorio"
                    @click="sortearAleatorio" :disable="torneoType === 4 ? !desafiosValid : false" />
                  <q-btn v-if="torneoType !== 2 || torneoType === 4" dense unelevated
                    :color="manualMode ? 'primary' : 'accent'" :outline="!manualMode"
                    class="full-width q-pa-md text-weight-bold"
                    :label="manualMode ? 'Salir modo manual' : 'orden manual'" :icon="manualMode ? 'close' : 'edit'"
                    @click="organizarManual" :disable="torneoType === 4 ? !desafiosValid : false" />
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
                    <!-- Tipo 4: selección especial de desafiador y desafiados -->
                    <div v-if="torneoType === 4">
                      <div class="text-caption q-mb-sm">
                        <template v-if="!desafiador">Elegir quién desafía</template>
                        <template v-else>Elegir equipos desafiados ({{ desafiados.length }} / {{ desafiosCount || 0
                        }})</template>
                      </div>
                      <div class="row q-gutter-sm items-start">
                        <q-chip v-for="t in teamsForTipo4" :key="t.id" dense
                          :disable="!manualMode || (!desafiador && completedTeams.has(t.id))" clickable
                          :outline="desafiador !== t.id" :color="desafiador === t.id ? 'primary' : undefined"
                          @click="selectForTipo4(t.id)" @keyup.enter="selectForTipo4(t.id)" :class="{
                            'cursor-pointer': manualMode,
                            'selected-desafiado': desafiados.indexOf(t.id) !== -1,
                            // pintar de rojo sólo cuando NO hay un desafiador seleccionado (estamos eligiendo el desafiador)
                            'completed-red': completedTeams.has(t.id) && !desafiador,
                            'disabled-by-complete': !desafiador && completedTeams.has(t.id)
                          }" tabindex="0" :aria-pressed="desafiador === t.id || desafiados.indexOf(t.id) !== -1">
                          {{ t.nombre }}
                        </q-chip>
                      </div>
                      <div class="text-caption q-mt-xs">Active "orden manual" y seleccione primero el desafiador, luego
                        hasta la
                        cantidad indicada de desafiados. Para reemplazar un desafiado, desmárcalo y elige otro.</div>
                      <q-banner v-if="manualMode" class="q-mt-sm" dense inline-actions>
                        <template v-slot:avatar>
                          <q-icon name="sports_kabaddi" />
                        </template>
                        <div class="column">
                          <q-banner v-if="readyForFinalize && conflictCount > 0" dense
                            class="bg-red-2 text-white q-mt-sm">
                            <div>Atención: hay <strong>{{ conflictCount }}</strong> desafío(s) seleccionados que ya
                              existen como partido
                              y no serán duplicados.</div>
                          </q-banner>
                          <div class="q-mt-sm">
                            <q-btn v-if="displayedMatches.length >= 2" dense flat icon="shuffle" label="Mezclar"
                              @click.stop="mezclarMatches" class="q-ml-xs">
                              <q-tooltip v-if="hasIncomplete">Hay equipos que aún no completan sus N
                                enfrentamientos</q-tooltip>
                              <q-tooltip v-else>Mezclar el orden de los partidos</q-tooltip>
                            </q-btn>
                          </div>
                        </div>
                        <!-- eliminamos el boton 'Desafío listo'; la selección se aplica automáticamente al completar N desafiados -->
                      </q-banner>
                    </div>

                    <!-- Otros tipos: selección por pares (existente) -->
                    <div v-else>
                      <div class="row q-gutter-sm items-start">
                        <q-chip v-for="t in unpairedTeams" :key="t.id" dense :disable="!manualMode" clickable
                          :outline="selectedTeam !== t.id" :color="selectedTeam === t.id ? 'primary' : undefined"
                          @click="selectTeam(t.id)" @keyup.enter="selectTeam(t.id)"
                          :class="{ 'cursor-pointer': manualMode }" tabindex="0" :aria-pressed="selectedTeam === t.id">
                          {{ t.nombre }}
                        </q-chip>
                      </div>
                      <div class="text-caption q-mt-xs">Haga click en "Organizar manualmente" y luego seleccione dos
                        equipos para crear
                        un par.</div>
                      <q-banner v-if="manualMode" class="q-mt-sm" dense inline-actions>
                        <template v-slot:avatar>
                          <q-icon name="edit" />
                        </template>
                        <div>Modo manual activo — seleccione dos equipos (o pulse ESC para cancelar).</div>
                      </q-banner>
                    </div>
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
        <q-btn color="primary" label="Confirmar partidos" @click="confirm" :disable="matches.length === 0" />
      </q-card-actions>
    </q-card>

    <!-- Diálogo que advierte sobre equipos incompletos o combinaciones faltantes -->
    <q-dialog v-model="showIncompleteDialog" persistent>
      <q-card style="min-width:420px; max-width:560px;">
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>Confirmar acción</q-toolbar-title>
        </q-toolbar>
        <q-card-section>
          <div v-if="incompleteDialogInfo.type === 4">
            <div>Hay <strong>{{ incompleteDialogInfo.count }}</strong> equipos que no completaron sus desafíos (N = {{
              desafiosCount }}).</div>
            <div class="q-mt-sm text-caption">¿Desea continuar de todas formas y comenzar el torneo?</div>
            <div v-if="incompleteDialogInfo.teams && incompleteDialogInfo.teams.length" class="q-mt-sm">
              <div class="text-subtitle2">Equipos:</div>
              <ul>
                <li v-for="t in incompleteDialogInfo.teams.slice(0, 5)" :key="t.id">{{ t.nombre }} ({{ t.actual }}
                  partidos)
                </li>
              </ul>
            </div>
          </div>
          <div v-else-if="incompleteDialogInfo.type === 2">
            <div>Faltan <strong>{{ incompleteDialogInfo.count }}</strong> combinaciones por generar para completar la
              liga.
            </div>
            <div class="q-mt-sm text-caption">¿Desea continuar de todas formas y comenzar el torneo?</div>
          </div>
          <div v-else-if="incompleteDialogInfo.type === 1">
            <div>Se detectaron equipos sin participación en la generación actual.</div>
            <div class="q-mt-sm">Equipos totales: <strong>{{ incompleteDialogInfo.totalTeams }}</strong>. Partidos
              generados: <strong>{{ incompleteDialogInfo.actualMatches }}</strong>. Partidos esperados: <strong>{{
                incompleteDialogInfo.expectedMatches }}</strong>.</div>
            <div class="q-mt-sm text-caption">Algunos equipos no participan. Se recomienda volver a ordenar/sortear o
              continuar de todas formas.</div>
            <div v-if="incompleteDialogInfo.teams && incompleteDialogInfo.teams.length" class="q-mt-sm">
              <div class="text-subtitle2">Equipos sin participación:</div>
              <ul>
                <li v-for="t in incompleteDialogInfo.teams.slice(0, 10)" :key="t.id">{{ t.nombre }}</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="secondary" @click="cancelIncompleteDialog" />
          <q-btn v-if="incompleteDialogInfo.type === 1" flat label="Re-sortear" color="primary"
            @click="reSortFromDialog" />
          <q-btn unelevated label="Continuar" color="negative" @click="proceedDespiteIncomplete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { listarBorradores } from 'src/stores/borrador-store'
import { obtenerTorneo, listarFases, confirmarInicioTorneo } from 'src/stores/torneo-store'
import { Notify } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  torneoId: { type: [Number, String], required: true },
  // Equipos iniciales opcionales: [{ id, nombre }, ...]
  initialTeams: { type: Array, required: false }
});
const emit = defineEmits(['update:modelValue', 'generatedMatches', 'started'])

const loading = ref(false)
const matches = ref([])
const phaseName = ref('')
const torneoNombre = ref('')
const phaseId = ref(null)
const tipoLabel = ref('Jornada')
const borradores = ref([])
const manualMode = ref(false)
const selectedTeam = ref(null)
const torneoType = ref(null)
const desafiador = ref(null)
const desafiados = ref([])
const fasesForDesafio = ref([])
const pendingMatches = ref([]) // selección temporal en modo manual para tipo 4
const desafiosLocked = ref(false)
const showIncompleteDialog = ref(false)
const incompleteDialogInfo = ref({ type: null, count: 0, teams: [] })

const localVisible = ref(props.modelValue)

const desafiosCount = ref(null)
const desafiosValid = computed(() => {
  const v = Number(desafiosCount.value)
  return Number.isInteger(v) && v >= 1 && v <= 5
})

const hasIncomplete = computed(() => {
  if (torneoType.value !== 4) return false
  if (!desafiosValid.value) return false
  // equipos que no han completado N
  const totalTeams = (teamsForTipo4.value || []).map(t => t.id)
  const n = Number(desafiosCount.value) || 0
  for (const id of totalTeams) {
    const cnt = desafiosCompletedMap.value.get(id) || 0
    if (cnt < n) return true
  }
  return false
})

function desafiosRule(val) {
  if (val === null || val === undefined || val === '') return true
  const n = Number(val)
  if (!Number.isInteger(n)) return 'Debe ser un número entero'
  if (n < 1) return 'No puede ser menor a 1'
  if (n > 5) return 'No puede ser mayor a 5'
  return true
}

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
  // reset lock state al preparar la organización
  desafiosLocked.value = false
  try {
    const t = await obtenerTorneo(props.torneoId).catch(() => null)
    const tor = t || null
    torneoNombre.value = tor?.nombre || ''
    // etiqueta para las rondas: usar el nombre del tipo de torneo si está disponible
    tipoLabel.value = (tor && tor.tipo_torneo && tor.tipo_torneo.nombre) ? tor.tipo_torneo.nombre : 'Jornada'
    // cargar borradores. Si se pasaron equipos iniciales, úsalos como borradores
    if (props.initialTeams && Array.isArray(props.initialTeams) && props.initialTeams.length > 0) {
      borradores.value = props.initialTeams.map(t => ({ id: t.id, nombre: t.nombre || t.nombre_corto || '' }))
    } else {
      const borr = await listarBorradores(props.torneoId).catch(() => [])
      borradores.value = Array.isArray(borr) ? borr : (borr?.data || [])
    }

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
        matches.value.push({ id_equipo_local: a?.id ?? null, id_equipo_visitante: b?.id ?? null, id_fase: phaseId.value, id_torneo: props.torneoId, ronda: phaseName.value, _phaseName: phaseName.value })
      }
    } else if (tor && tor.id_tipo_torneo === 2) {
      // tipo 2: liga. Generar calendario Round-Robin balanceado (dirigido: cada par en ambas orientaciones)
      const fases = await listarFases(props.torneoId).catch(() => [])
      await generateDirectedRoundRobin(borradores.value || [], fases)
    } else if (tor && tor.id_tipo_torneo === 4) {
      console.log('tipo de torneo: 4');

      // tipo 4: modo de desafíos — inicialmente no generar partidos; el usuario define 'cantidad de desafíos' y actúa
      matches.value = []
      phaseName.value = ''
      phaseId.value = null
      desafiador.value = null
      desafiados.value = []
      fasesForDesafio.value = []
      // si este torneo tiene un tipo de desafío 2 -> obtener fases (similar a liga)
      if (tor.id_tipo_torneo === 4) {
        const fases = await listarFases(props.torneoId).catch(() => [])
        fasesForDesafio.value = Array.isArray(fases) ? fases : (fases?.data || [])
        phaseName.value = fasesForDesafio.value.length > 0 ? fasesForDesafio.value[0].nombre || '' : ''
      }
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

// Nota: generateRoundRobin fue reemplazada por generateDirectedRoundRobin para tipo 2

async function generateDirectedRoundRobin(teamsOrig, fases) {
  // Genera un calendario dirigido donde cada equipo juega contra todos los otros en ambas orientaciones.
  // Usa el algoritmo round-robin para crear emparejamientos por ronda y luego duplica con lados invertidos
  matches.value = []
  const teams = (teamsOrig || []).slice()
  // eliminar equipos sin id
  const realTeams = teams.filter(t => t && t.id != null)
  if (realTeams.length === 0) return
  // si impar -> añadir BYE a la lógica de round-robin temporal
  const temp = realTeams.slice()
  if (temp.length % 2 === 1) temp.push({ id: null, nombre: 'BYE' })
  const n = temp.length
  const rounds = n - 1
  const half = n / 2

  // crear emparejamientos undirected por ronda
  const rot = temp.slice()
  const undirectedRounds = []
  for (let r = 0; r < rounds; r++) {
    const thisRound = []
    for (let i = 0; i < half; i++) {
      const t1 = rot[i]
      const t2 = rot[n - 1 - i]
      if (!t1 || !t2) continue
      if (t1.id == null || t2.id == null) continue
      thisRound.push({ id_equipo_local: t1.id, id_equipo_visitante: t2.id, ronda: r + 1 })
    }
    undirectedRounds.push(thisRound)
    // rotación
    const fixed = rot[0]
    const rest = rot.slice(1)
    rest.unshift(rest.pop())
    rot.length = 0
    rot.push(fixed)
    rot.push(...rest)
  }

  // construir rounds dirigidos: primero undirectedRounds as-is, luego la versión invertida
  const directedRounds = []
  undirectedRounds.forEach((rnd, idx) => {
    directedRounds.push(rnd.map(m => ({ ...m, ronda: idx + 1 })))
  })
  undirectedRounds.forEach((rnd, idx) => {
    directedRounds.push(rnd.map(m => ({ id_equipo_local: m.id_equipo_visitante, id_equipo_visitante: m.id_equipo_local, ronda: rounds + idx + 1 })))
  })

  // Asignar fases por ronda si se pasaron
  directedRounds.forEach((rnd, rIdx) => {
    const phase = (Array.isArray(fases) && fases[rIdx]) ? fases[rIdx] : (Array.isArray(fases) && fases.length > 0 ? fases[rIdx % fases.length] : null)
    const baseName = (phase && phase.nombre) ? phase.nombre : 'Jornada'
    const label = `${baseName} ${rIdx + 1}`
    rnd.forEach(m => {
      m.id_fase = phase?.id ?? null
      m._phaseName = label
    })
  })

  // aplanar
  directedRounds.forEach(rnd => {
    rnd.forEach(m => matches.value.push({ id_equipo_local: m.id_equipo_local, id_equipo_visitante: m.id_equipo_visitante, id_fase: m.id_fase, id_torneo: props.torneoId, ronda: m.ronda, _phaseName: m._phaseName }))
  })

  // set phaseName/phaseId from first match if any
  if (matches.value.length > 0) {
    const first = matches.value[0]
    phaseName.value = first._phaseName || ''
    phaseId.value = first.id_fase ?? phaseId.value
  }

  // Para tipo 2, sobreescribir/establecer campo 'ronda' agrupando partidos de a 2
  if (torneoType.value === 2 && matches.value.length > 0) {
    for (let i = 0; i < matches.value.length; i++) {
      const roundIndex = Math.floor(i / 2) + 1
      const label = `${tipoLabel.value} ${roundIndex}`
      matches.value[i].ronda = label
      // también ajustar _phaseName para mostrar coherente en la UI
      matches.value[i]._phaseName = label
    }
    // actualizar phaseName y phaseId basados en el primer partido
    phaseName.value = matches.value[0]._phaseName || phaseName.value
    phaseId.value = matches.value[0].id_fase ?? phaseId.value
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

function setRondaForMatches(arr) {
  if (!arr || !Array.isArray(arr)) return
  for (let i = 0; i < arr.length; i++) {
    const m = arr[i]
    if (!m) continue
    // no sobreescribimos si ya tiene ronda definida
    if (m.ronda) continue
    if (torneoType.value === 2) {
      const roundIndex = Math.floor(i / 2) + 1
      // para tipo 2 recortamos el último caracter de la etiqueta (p.e. 'Jornadas' -> 'Jornada')
      const baseLabelRaw = tipoLabel.value || ''
      const baseLabel = baseLabelRaw && baseLabelRaw.length > 1 ? baseLabelRaw.slice(0, -1) : baseLabelRaw
      const label = `${baseLabel} ${roundIndex}`
      m.ronda = label
      m._phaseName = label
    } else if (torneoType.value === 1) {
      // usar nombre de la fase tal cual
      m.ronda = phaseName.value || 'Fase'
      m._phaseName = phaseName.value || 'Fase'
    } else if (torneoType.value === 4) {
      // para desafíos, numerar secuencialmente (Desafío 1, ...)
      const label = `Desafío ${i + 1}`
      m.ronda = label
      m._phaseName = label
    } else {
      // fallback genérico
      const label = `${tipoLabel.value} ${Math.floor(i / 2) + 1}`
      m.ronda = label
      m._phaseName = label
    }
  }
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

const teamsForTipo4 = computed(() => {
  // mostrar todos los borradores reales (sin BYE)
  return (borradores.value || []).filter(t => t && t.id != null)
})

// mapa teamId -> cantidad de desafíos iniciados por ese equipo (id_equipo_local)
const desafiosCompletedMap = computed(() => {
  const map = new Map()
    ; (matches.value || []).forEach(m => {
      if (m.id_equipo_local != null) {
        const prev = map.get(m.id_equipo_local) || 0
        map.set(m.id_equipo_local, prev + 1)
      }
    })
  return map
})

// conjunto de equipos que ya completaron N desafiados (según el input)
const completedTeams = computed(() => {
  const set = new Set()
  if (!desafiosValid.value) return set
  const n = Number(desafiosCount.value) || 0
  desafiosCompletedMap.value.forEach((cnt, id) => {
    if (cnt >= n) set.add(id)
  })
  return set
})

const displayedMatches = computed(() => {
  // cuando estamos en modo manual y hay pendingMatches, mostrar primero los pendientes para que el usuario
  // vea la selección en curso; luego los matches ya aplicados
  if (torneoType.value === 4 && manualMode.value && (pendingMatches.value || []).length > 0) {
    return pendingMatches.value.concat(matches.value || [])
  }
  return matches.value || []
})

function rebuildDesafioMatches() {
  // Para tipo 4, crear matches: desafiador vs cada desafiado
  if (!desafiador.value) {
    // vaciar selección temporal si antes tenía
    pendingMatches.value = []
    return
  }
  const newMatches = []
  desafiados.value.forEach((id, idx) => {
    const m = { id_equipo_local: desafiador.value, id_equipo_visitante: id, id_fase: phaseId.value, id_torneo: props.torneoId }
    // si hay fases específicas para desafíos, asignar ronda como 'fase.nombre X'
    if (Array.isArray(fasesForDesafio.value) && fasesForDesafio.value.length > 0) {
      const phase = fasesForDesafio.value[idx] || fasesForDesafio.value[0]
      m.ronda = `${phase?.nombre || 'Jornada'} ${idx + 1}`
      // también asignar id_fase si existe
      m.id_fase = phase?.id ?? m.id_fase
    }
    newMatches.push(m)
  })
  // mantener como selección temporal hasta que se finalice
  pendingMatches.value = newMatches
}

function selectForTipo4(id) {
  if (!manualMode.value) {
    Notify.create({ type: 'warning', message: 'Active "Organizar manualmente" para asignar desafíos' })
    return
  }
  // si no hay desafiador definido -> este click marca al desafiador
  if (!desafiador.value) {
    // Si el equipo ya completó sus N desafiados no puede ser desafiador ahora
    if (completedTeams.value.has(id)) {
      Notify.create({ type: 'warning', message: 'Este equipo ya completó sus desafíos y no puede iniciar más desafíos.' })
      return
    }
    desafiador.value = id
    desafiados.value = []
    rebuildDesafioMatches()
    return
  }
  // si se clickea el mismo desafiador -> desmarcar todo
  if (desafiador.value === id) {
    desafiador.value = null
    desafiados.value = []
    pendingMatches.value = []
    return
  }
  // ahora manejamos clics sobre posibles desafiados
  const idx = desafiados.value.indexOf(id)
  if (idx >= 0) {
    // estaba seleccionado -> desmarcar
    desafiados.value.splice(idx, 1)
    rebuildDesafioMatches()
    return
  }
  // si ya alcanzó el máximo, no permitir más (según requerimiento: no funciona al intentar agregar de más)
  const max = Number(desafiosCount.value) || 0
  if (desafiados.value.length >= max) {
    // hacer nada; usuario debe desmarcar alguno antes de elegir otro
    Notify.create({ type: 'warning', message: `Ya seleccionó ${max} desafiados. Desmárquelos para elegir otros.` })
    return
  }
  // agregar
  desafiados.value.push(id)
  rebuildDesafioMatches()

  // si alcanza el máximo, aplicar automáticamente la selección (sin salir del modo manual)
  const count = Number(desafiosCount.value) || 0
  if (desafiados.value.length === count) {
    // mover los pendingMatches al arreglo principal matches (evitar duplicados exactos)
    const existing = new Set();
    (matches.value || []).forEach(m => {
      if (m.id_equipo_local != null && m.id_equipo_visitante != null) existing.add(`${m.id_equipo_local}|${m.id_equipo_visitante}`)
    })
    let added = 0
    pendingMatches.value.forEach(m => {
      const key = `${m.id_equipo_local}|${m.id_equipo_visitante}`
      if (!existing.has(key)) {
        matches.value.push(m)
        existing.add(key)
        added++
      }
    })
    if (added > 0) Notify.create({ type: 'positive', message: `Se agregaron ${added} desafíos` })
    // limpiar pending pero mantener en modo manual para permitir más acciones
    pendingMatches.value = []
    // limpiar selección para permitir nuevas asignaciones sin salir del modo manual
    desafiador.value = null
    desafiados.value = []
  }
}

const conflictCount = computed(() => {
  if (!desafiador.value || !desafiados.value.length) return 0
  const existing = new Set();
  (matches.value || []).forEach(m => {
    if (m.id_equipo_local != null && m.id_equipo_visitante != null) existing.add(pairKey(m.id_equipo_local, m.id_equipo_visitante))
  })
  let c = 0
  desafiados.value.forEach(d => {
    if (existing.has(pairKey(desafiador.value, d))) c++
  })
  return c
})

const readyForFinalize = computed(() => {
  if (!desafiador.value) return false
  const count = Number(desafiosCount.value) || 0
  return desafiosValid.value && desafiados.value.length === count
})



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

function mezclarMatches() {
  // Mezcla el orden de los partidos visibles. Si hay pendingMatches (tipo4 manual), mezclarlos por separado.
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
    }
  }
  if (torneoType.value === 4 && manualMode.value && (pendingMatches.value || []).length > 1) {
    shuffleArray(pendingMatches.value)
    Notify.create({ type: 'info', message: 'Partidos pendientes mezclados' })
    // asegurar ronda para pendingMatches
    setRondaForMatches(pendingMatches.value)
    return
  }
  if ((matches.value || []).length > 1) {
    shuffleArray(matches.value)
    Notify.create({ type: 'info', message: 'Partidos mezclados' })
    // re-asignar rondas coherentes tras mezclar
    setRondaForMatches(matches.value)
    return
  }
}

function close() {
  localVisible.value = false
  // limpiar estado tipo 4 al cerrar
  desafiador.value = null
  desafiados.value = []
  pendingMatches.value = []
  // desbloquear input al cerrar
  desafiosLocked.value = false
}

async function confirm() {
  // Log de la lista de partidos generados para cualquier tipo de torneo
  try {
    console.log('Generated matches for torneo', props.torneoId, JSON.parse(JSON.stringify(matches.value)))
  } catch {
    console.log('Generated matches for torneo', props.torneoId, matches.value)
  }
  // Antes de confirmar, validar condiciones por tipo
  // preparar listado combinado de partidos (incluye pending si aplica)
  const combined = [].concat(matches.value || [], pendingMatches.value || [])

  // Caso: tipo 4 -> verificar que todos los equipos alcanzaron N desafíos
  if (torneoType.value === 4) {
    const N = Number(desafiosCount.value) || 0
    if (!desafiosValid.value || N <= 0) {
      Notify.create({ type: 'warning', message: 'Ingrese una cantidad válida de desafíos antes de confirmar.' })
      return
    }
    const countMap = new Map()
    combined.forEach(m => {
      if (m && m.id_equipo_local != null) {
        countMap.set(m.id_equipo_local, (countMap.get(m.id_equipo_local) || 0) + 1)
      }
    })
    const missingTeams = [];
    ; (teamsForTipo4.value || []).forEach(t => {
      const cnt = countMap.get(t.id) || 0
      if (cnt < N) missingTeams.push({ id: t.id, nombre: t.nombre || `#${t.id}`, actual: cnt })
    })
    if (missingTeams.length > 0) {
      incompleteDialogInfo.value = { type: 4, count: missingTeams.length, teams: missingTeams }
      showIncompleteDialog.value = true
      return
    }
    // todo OK -> emitir y llamar al store. Emitimos generatedMatches primero, y solo cuando
    // confirmarInicioTorneo se resuelva emitimos 'started' para que el padre (Borradores) pueda
    // cerrar su diálogo, recargar la lista principal y abrir seguimiento de forma fiable.

    emit('generatedMatches', { torneoId: props.torneoId, matches: combined })
    try {

      await confirmarInicioTorneo(props.torneoId, combined)
      Notify.create({ type: 'positive', message: 'Torneo iniciado' })
      // informar al padre que el torneo fue iniciado (persistido)
      emit('started', { torneoId: props.torneoId })
    } catch (err) {
      console.error('Error iniciando torneo', err)
      Notify.create({ type: 'negative', message: 'Error iniciando torneo' })
    }
    localVisible.value = false
    desafiosLocked.value = false
    return
  }

  // Caso: tipo 2 -> si faltan combinaciones mostrar dialogo de confirmación, si no -> iniciar
  if (torneoType.value === 2) {
    const missing = missingCount.value || 0
    if (missing > 0) {
      incompleteDialogInfo.value = { type: 2, count: missing, teams: [] }
      showIncompleteDialog.value = true
      return
    }
    // ok -> emitir y llamar al store (tipo 2). Emitir 'started' al resolverse.
    emit('generatedMatches', { torneoId: props.torneoId, matches: combined })
    try {
      await confirmarInicioTorneo(props.torneoId, combined)
      Notify.create({ type: 'positive', message: 'Torneo iniciado' })
      emit('started', { torneoId: props.torneoId })
    } catch (err) {
      console.error('Error iniciando torneo', err)
      Notify.create({ type: 'negative', message: 'Error iniciando torneo' })
    }
    localVisible.value = false
    desafiosLocked.value = false
    return
  }

  // Caso: tipo 1 -> verificar que todos los equipos participen (N equipos -> N/2 partidos esperados)
  if (torneoType.value === 1) {
    const totalTeams = (borradores.value || []).length || 0
    const expectedMatches = Math.floor(totalTeams / 2)
    const actualMatches = (combined || []).length
    // determinar equipos que no aparecen en ningun partido
    const appeared = new Set()
    combined.forEach(m => {
      if (m && m.id_equipo_local != null) appeared.add(m.id_equipo_local)
      if (m && m.id_equipo_visitante != null) appeared.add(m.id_equipo_visitante)
    })
    const missingTeams = (borradores.value || []).filter(t => !appeared.has(t.id)).map(t => ({ id: t.id, nombre: t.nombre || `#${t.id}` }))

    if (actualMatches !== expectedMatches || missingTeams.length > 0) {
      incompleteDialogInfo.value = { type: 1, count: missingTeams.length, teams: missingTeams, totalTeams, expectedMatches, actualMatches }
      showIncompleteDialog.value = true
      return
    }
    // ok -> emitir y llamar al store (tipo 1). Emitir 'started' al resolverse.
    emit('generatedMatches', { torneoId: props.torneoId, matches: combined })
    try {
      console.log('despues de generated matchesssssssssssssssssssssss dentro de rty');

      await confirmarInicioTorneo(props.torneoId, combined)
      Notify.create({ type: 'positive', message: 'Torneo iniciado' })
      emit('started', { torneoId: props.torneoId })
      console.log('despues de started');

    } catch (err) {
      console.error('Error iniciando torneo', err)
      Notify.create({ type: 'negative', message: 'Error iniciando torneo' })
    }
    localVisible.value = false
    desafiosLocked.value = false
    return
  }

  // demás tipos: comportamiento previo
  emit('generatedMatches', { torneoId: props.torneoId, matches: matches.value })
  localVisible.value = false
  // desbloquear input al confirmar
  desafiosLocked.value = false
}

async function proceedDespiteIncomplete() {
  // emitir y forzar inicio del torneo
  const combined = [].concat(matches.value || [], pendingMatches.value || [])
  emit('generatedMatches', { torneoId: props.torneoId, matches: combined })
  try {
    await confirmarInicioTorneo(props.torneoId, combined)
    Notify.create({ type: 'positive', message: 'Torneo iniciado' })
    emit('started', { torneoId: props.torneoId })
  } catch (err) {
    console.error('Error iniciando torneo', err)
    Notify.create({ type: 'negative', message: 'Error iniciando torneo' })
  }
  showIncompleteDialog.value = false
  localVisible.value = false
  desafiosLocked.value = false
}

function cancelIncompleteDialog() {
  showIncompleteDialog.value = false
}

function reSortFromDialog() {
  // intentamos sortear aleatoriamente de nuevo y cerrar el diálogo
  showIncompleteDialog.value = false
  sortearAleatorio()
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
  // asignar rondas coherentes
  setRondaForMatches(matches.value)
}

async function sortearAleatorio() {
  // Si es liga (tipo 2) barajar el orden de equipos y regenerar Round-Robin
  if (torneoType.value === 2) {
    // Nuevo comportamiento: generar partidos dirigidos (cada equipo contra todos los otros)
    const fases = await listarFases(props.torneoId).catch(() => [])
    const teams = (borradores.value || []).filter(t => t && t.id != null).slice()
    if (teams.length < 2) {
      Notify.create({ type: 'warning', message: 'Se necesitan al menos 2 equipos para generar el sorteo' })
      return
    }
    // shuffle equipos para aleatoriedad
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = teams[i]; teams[i] = teams[j]; teams[j] = tmp
    }
    // Construir opponentsMap: para cada equipo local, una lista aleatoria de visitantes (todos los demás)
    const opponentsMap = new Map()
    teams.forEach(t => {
      const others = teams.filter(o => o.id !== t.id).map(o => o.id)
      // shuffle opponents list
      for (let a = others.length - 1; a > 0; a--) {
        const b = Math.floor(Math.random() * (a + 1))
        const tmp = others[a]; others[a] = others[b]; others[b] = tmp
      }
      opponentsMap.set(t.id, others)
    })

    // Interleave matches by columnas para que las apariciones de un mismo local queden espaciadas
    const locals = teams.map(t => t.id)
    // mezclar orden de locales para evitar siempre la misma secuencia
    for (let a = locals.length - 1; a > 0; a--) {
      const b = Math.floor(Math.random() * (a + 1))
      const tmp = locals[a]; locals[a] = locals[b]; locals[b] = tmp
    }

    const maxLen = teams.length - 1
    const newMatches = []
    for (let k = 0; k < maxLen; k++) {
      for (let li = 0; li < locals.length; li++) {
        const localId = locals[li]
        const opps = opponentsMap.get(localId) || []
        const visit = opps[k]
        if (visit != null) {
          newMatches.push({ id_equipo_local: localId, id_equipo_visitante: visit, id_fase: null, id_torneo: props.torneoId })
        }
      }
    }

    // asignar fases/rondas agrupando partidos de a 2 por ronda. Usar label base recortado para tipo 2
    const baseLabelRaw = tipoLabel.value || ''
    const baseLabel = baseLabelRaw && baseLabelRaw.length > 1 ? baseLabelRaw.slice(0, -1) : baseLabelRaw
    if (Array.isArray(fases) && fases.length > 0) {
      newMatches.forEach((m, idx) => {
        const roundIndex = Math.floor(idx / 2)
        const phase = fases[roundIndex] || fases[roundIndex % fases.length]
        const label = `${baseLabel} ${roundIndex + 1}`
        m.ronda = label
        m._phaseName = label
        m.id_fase = phase?.id ?? null
      })
    } else {
      newMatches.forEach((m, idx) => {
        const roundIndex = Math.floor(idx / 2)
        const label = `${baseLabel} ${roundIndex + 1}`
        m.ronda = label
        m._phaseName = label
      })
    }

    matches.value = newMatches
    Notify.create({ type: 'positive', message: `Generados ${newMatches.length} partidos (dirigidos)` })
    return
  }

  // Tipo 4: desafíos aleatorios respetando 'desafiosCount'
  if (torneoType.value === 4) {
    if (!desafiosValid.value) {
      Notify.create({ type: 'warning', message: 'Ingrese una cantidad válida de desafíos (1-5)' })
      return
    }
    // bloquear la edición del input de 'desafiosCount' cuando se genera aleatoriamente
    desafiosLocked.value = true
    const N = Math.max(0, Math.min(Number(desafiosCount.value), Math.max(0, (borradores.value || []).length - 1)))
    const teams = (borradores.value || []).filter(t => t && t.id != null).slice()
    if (teams.length < 2) {
      Notify.create({ type: 'warning', message: 'Se necesitan al menos 2 equipos para generar desafíos' })
      return
    }

    // Shuffle teams for randomness
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = teams[i]; teams[i] = teams[j]; teams[j] = tmp
    }

    const pairSet = new Set(); // key local|visitante to avoid exact duplicates

    // mapa localId -> array de visitantes (oponentes) para luego intercalar
    const opponentsMap = new Map();
    teams.forEach(t => opponentsMap.set(t.id, []));

    // Para cada equipo, intentar añadir hasta N oponentes únicos
    teams.forEach(localTeam => {
      let attempts = 0;
      let added = 0;
      const localList = opponentsMap.get(localTeam.id);
      while (added < N && attempts < N * 20) {
        attempts++;
        const candidate = teams[Math.floor(Math.random() * teams.length)];
        if (!candidate || candidate.id === localTeam.id) continue;
        const key = `${localTeam.id}|${candidate.id}`;
        if (pairSet.has(key)) continue;
        pairSet.add(key);
        localList.push(candidate.id);
        added++;
      }
    });

    // Asegurar que cada equipo aparezca al menos una vez (como local o visitante)
    const appeared = new Set();
    opponentsMap.forEach((arr, localId) => {
      if (arr.length > 0) appeared.add(localId);
      arr.forEach(v => appeared.add(v));
    });
    const missing = teams.map(t => t.id).filter(id => !appeared.has(id));

    // Para cada missing, asignarlo como visitante de un local aleatorio (tratando de evitar duplicados)
    missing.forEach(mId => {
      // shuffle copy of teams to try varios locales
      const shuffled = teams.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }
      let placed = false;
      for (let k = 0; k < shuffled.length; k++) {
        const pick = shuffled[k];
        if (pick.id === mId) continue;
        const key = `${pick.id}|${mId}`;
        if (!pairSet.has(key)) {
          pairSet.add(key);
          opponentsMap.get(pick.id).push(mId);
          placed = true;
          break;
        }
      }
      // si no se pudo evitar duplicado, lo colocamos con el primer posible pick
      if (!placed) {
        const fallback = teams.find(t => t.id !== mId) || teams[0];
        const key = `${fallback.id}|${mId}`;
        pairSet.add(key);
        opponentsMap.get(fallback.id).push(mId);
      }
    });

    // Ahora construir la lista intercalando: tomar por "columnas" (k) y para cada k recorrer los locales en orden aleatorio
    const locals = Array.from(opponentsMap.keys());
    // mezclar orden de locales para evitar siempre la misma secuencia
    for (let i = locals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = locals[i]; locals[i] = locals[j]; locals[j] = tmp;
    }

    const maxLen = Math.max(0, ...Array.from(opponentsMap.values()).map(a => a.length));
    const interleaved = [];
    for (let k = 0; k < maxLen; k++) {
      for (let li = 0; li < locals.length; li++) {
        const localId = locals[li];
        const arr = opponentsMap.get(localId) || [];
        if (arr[k] != null) {
          interleaved.push({ id_equipo_local: localId, id_equipo_visitante: arr[k], id_fase: phaseId.value, id_torneo: props.torneoId });
        }
      }
    }

    // Asignar fases/ronda si corresponde
    if (Array.isArray(fasesForDesafio.value) && fasesForDesafio.value.length > 0) {
      interleaved.forEach((m, idx) => {
        const phase = fasesForDesafio.value[idx] || fasesForDesafio.value[0];
        m.ronda = `${phase?.nombre || 'Jornada'} ${idx + 1}`;
        m.id_fase = phase?.id ?? m.id_fase;
      });
    }

    matches.value = interleaved;
    Notify.create({ type: 'positive', message: `Generados ${interleaved.length} desafíos aleatorios` });
    return;
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
  // asignar rondas tras sorteo aleatorio
  setRondaForMatches(matches.value)
  Notify.create({ type: 'positive', message: 'Equipos sorteados aleatoriamente' })
}

function organizarManual() {
  manualMode.value = !manualMode.value
  // bloquear el input cuando entramos a modo manual (tipo 4)
  if (torneoType.value === 4 && manualMode.value) {
    desafiosLocked.value = true
  } else if (torneoType.value === 4 && !manualMode.value) {
    // si salimos del modo manual, desbloquear
    desafiosLocked.value = false
  }
  // Si activamos el modo manual y estamos en tipo 4 -> borrar la lista generada por el aleatorio
  if (manualMode.value) {
    if (torneoType.value === 4) {
      matches.value = []
      pendingMatches.value = []
      desafiador.value = null
      desafiados.value = []
      selectedTeam.value = null
    }
  } else {
    // desactivando modo manual -> limpiar selección temporal
    selectedTeam.value = null
    desafiador.value = null
    desafiados.value = []
    pendingMatches.value = []
  }
  Notify.create({ type: 'info', message: manualMode.value ? 'Modo manual activado' : 'Modo manual desactivado' })
}

function handleKeydown(e) {
  if (e.key === 'Escape' && manualMode.value) {
    manualMode.value = false
    selectedTeam.value = null
    desafiador.value = null
    desafiados.value = []
    matches.value = []
    pendingMatches.value = []
    // desbloquear el input al cancelar manual
    desafiosLocked.value = false
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

.selected-desafiado {
  border: 2px solid var(--q-color-secondary) !important;
  box-shadow: 0 0 0 4px rgba(144, 202, 249, 0.08);
  background: transparent !important;
}

.completed-red {
  background: #ffecec !important;
  color: #b71c1c !important;
  border: 1px solid #ffb3b3 !important;
}

.disabled-by-complete {
  opacity: 0.6;
  pointer-events: auto;
  /* keep pointer events so chip can show tooltip if needed */
}

.matches-container {
  height: 100%;
  flex: 1 1 auto;
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
