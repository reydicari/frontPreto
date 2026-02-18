<template>
  <q-page class="profile-page" :class="$q.dark.isActive ? 'dark-mode' : 'light-mode'">
    <!-- Header con datos del usuario -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <q-avatar size="80px" class="user-avatar">
            <q-icon name="person" size="48px" />
          </q-avatar>
          <div class="user-info">
            <div class="page-title">
              <q-icon name="account_circle" size="32px" class="title-icon" />
              {{ userData?.persona?.nombres }} {{ userData?.persona?.apellido_paterno }}
            </div>
            <div class="page-subtitle">@{{ userData?.usuario }}</div>
            <div class="user-roles">
              <q-chip v-for="rol in userData?.rols" :key="rol.id" size="sm" color="orange-7" text-color="white"
                icon="shield">
                {{ rol.nombre }}
              </q-chip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Datos Personales -->
    <q-card class="info-card q-mb-md">
      <div class="card-header">
        <q-icon name="badge" size="24px" class="q-mr-sm" />
        <span class="card-title">Datos Personales</span>
      </div>
      <q-card-section>
        <div class="info-grid">
          <div class="info-item">
            <q-icon name="fingerprint" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">CI:</span>
            <span class="info-value">{{ userData?.persona?.ci }}{{ userData?.persona?.complemento || '' }}</span>
          </div>
          <div class="info-item">
            <q-icon name="phone" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">Teléfono:</span>
            <span class="info-value">{{ userData?.persona?.telefono }}</span>
          </div>
          <div class="info-item">
            <q-icon name="cake" size="20px" color="orange-7" class="q-mr-xs" />
            <span class="info-label">F. Nacimiento:</span>
            <span class="info-value">{{ formatDate(userData?.persona?.fecha_nacimiento) }}</span>
          </div>
          <div class="info-item">
            <q-icon name="wc" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">Género:</span>
            <span class="info-value">{{ userData?.persona?.genero === 'M' ? 'Masculino' : 'Femenino' }}</span>
          </div>
          <div class="info-item">
            <q-icon name="category" size="20px" color="orange-7" class="q-mr-xs" />
            <span class="info-label">Categoría:</span>
            <span class="info-value">{{ userData?.persona?.categoria }}</span>
          </div>
          <div class="info-item">
            <q-icon name="event" size="20px" color="green-8" class="q-mr-xs" />
            <span class="info-label">Último ingreso:</span>
            <span class="info-value">{{ formatDateTime(userData?.ultimo_ingreso) }}</span>
          </div>
        </div>
        <div v-if="userData?.persona?.biografia" class="bio-section q-mt-md">
          <q-icon name="description" size="20px" color="orange-7" class="q-mr-xs" />
          <span class="info-label">Biografía:</span>
          <p class="bio-text">{{ userData?.persona?.biografia }}</p>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Evaluaciones -->
    <q-card v-if="isNotStudent" class="evaluations-card q-mb-md">
      <div class="card-header">
        <q-icon name="star" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Evaluaciones</span>
        <q-chip size="sm" color="green-8" text-color="white">
          {{ evaluaciones.length }} evaluación(es)
        </q-chip>
        <q-space />
        <q-select v-model="limitEvaluaciones" :options="limitOptions" dense outlined map-options emit-value
          class="limit-select">
          <template v-slot:prepend>
            <q-icon name="format_list_numbered" size="16px" />
          </template>
        </q-select>
      </div>

      <!-- Filtros de evaluaciones -->
      <q-card-section class="q-pb-none">
        <div class="filters-header" @click="showEvaluacionesFilters = !showEvaluacionesFilters">
          <div class="filters-title">
            <q-icon name="filter_list" size="20px" />
            <span>Filtros</span>
          </div>
          <q-icon :name="showEvaluacionesFilters ? 'expand_less' : 'expand_more'" size="24px" />
        </div>

        <q-slide-transition>
          <div v-show="showEvaluacionesFilters" class="filters-content q-mt-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-6">
                <FiltroFechas @update:desde="filterEvaluacionesDesde = $event"
                  @update:hasta="filterEvaluacionesHasta = $event" />
              </div>

              <div class="col-12 col-sm-6 col-md-6">
                <q-select map-options emit-value option-value="value" dense outlined
                  v-model="filterEvaluacionesCualidad" :options="cualidadOptions" label="Cualidad" clearable
                  class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="star" color="green-7" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-card-section>
        <div v-if="loadingEvaluaciones" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="evaluaciones.length === 0" class="empty-state">
          <q-icon name="sentiment_satisfied" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes evaluaciones registradas</p>
        </div>
        <div v-else class="evaluations-grid">
          <q-card v-for="evaluacion in evaluaciones" :key="evaluacion.id" flat bordered class="evaluation-card">
            <q-card-section>
              <div class="eval-header">
                <span class="cualidad-name">{{ evaluacion.cualidad?.nombre }}</span>
                <q-rating v-model="evaluacion.valor" max="5" size="20px" color="orange-7" readonly icon="star" />
              </div>
              <div v-if="evaluacion.entrenamiento?.nombre" class="eval-training q-mb-sm">
                <q-icon name="fitness_center" size="16px" color="orange-7" class="q-mr-xs" />
                <span class="text-caption text-weight-medium">{{ evaluacion.entrenamiento.nombre }}</span>
              </div>
              <div class="eval-date">
                <q-icon name="event" size="16px" class="q-mr-xs" />
                {{ formatDateShort(evaluacion.fecha) }}
                <q-icon name="access_time" size="16px" class="q-ml-md q-mr-xs" />
                {{ formatTime(evaluacion.fecha) }}
              </div>
              <div v-if="evaluacion.comentario" class="eval-comment">
                <q-icon name="comment" size="16px" color="green-8" class="q-mr-xs" />
                <span>{{ evaluacion.comentario }}</span>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Inscripciones -->
    <q-card class="inscriptions-card q-mb-md">
      <div class="card-header">
        <q-icon name="school" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Inscripciones</span>
        <q-chip size="sm" color="green-8" text-color="white">
          {{ totalInscripciones }} inscripción(es)
        </q-chip>
        <q-space />
        <q-select v-model="limitInscripciones" :options="limitOptions" dense outlined map-options emit-value
          class="limit-select">
          <template v-slot:prepend>
            <q-icon name="format_list_numbered" size="16px" />
          </template>
        </q-select>
      </div>

      <!-- Filtros de inscripciones -->
      <q-card-section class="q-pb-none">
        <div class="filters-header" @click="showInscripcionesFilters = !showInscripcionesFilters">
          <div class="filters-title">
            <q-icon name="filter_list" size="20px" />
            <span>Filtros</span>
          </div>
          <q-icon :name="showInscripcionesFilters ? 'expand_less' : 'expand_more'" size="24px" />
        </div>

        <q-slide-transition>
          <div v-show="showInscripcionesFilters" class="filters-content q-mt-md">
            <div class="row q-col-gutter-md">
              <div class="col-6 col-md-3 col-lg-2">
                <FiltroFechaRango label="Vencimientos" :allow-indefinida="true"
                  @update:model-value="filterFechaFin = $event" />
              </div>

              <div class="col-6 col-md-3 col-lg-2">
                <FiltroFechaRango label="Inicios" @update:model-value="filterFechaInicio = $event" />
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select v-model="filterInscripcionesEstado" :options="estadoInscripcionOptions" label="Estado"
                  clearable emit-value map-options dense outlined class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="info" color="green-7" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select v-model="filterInscripcionesDisciplina" :options="disciplinasOptions" option-label="nombre"
                  option-value="id" emit-value map-options label="Disciplina" clearable dense outlined
                  class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="sports_martial_arts" color="green-7" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select v-model="filterInscripcionesNivel" :options="nivelOptions" option-label="nombre_nivel"
                  option-value="id" emit-value map-options label="Nivel" clearable dense outlined class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="military_tech" color="orange-7" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select v-model="filterInscripcionesPaquete" :options="paqueteOptions" option-label="nombre"
                  option-value="id" emit-value map-options label="Paquete" clearable dense outlined
                  class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="inventory_2" color="purple" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select v-model="filterInscripcionesPagos" :options="pagosInscripcionOptions" label="Estado de Pagos"
                  clearable emit-value map-options dense outlined class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="payments" color="green-7" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-card-section>
        <div v-if="loadingInscripciones" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="inscripciones.length === 0" class="empty-state">
          <q-icon name="school" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes inscripciones registradas</p>
        </div>
        <div v-else>
          <!-- Resumen de inscripciones -->
          <div class="inscription-summary q-mb-md">
            <div class="summary-item">
              <q-icon name="groups" size="24px" color="green-8" />
              <div class="summary-content">
                <div class="summary-label">Total</div>
                <div class="summary-value">{{ totalInscripciones }}</div>
              </div>
            </div>
            <div class="summary-item">
              <q-icon name="warning_amber" size="24px" color="orange-7" />
              <div class="summary-content">
                <div class="summary-label">Por vencer</div>
                <div class="summary-value">{{ porVencer }}</div>
              </div>
            </div>
            <div class="summary-item">
              <q-icon name="event_busy" size="24px" color="red-7" />
              <div class="summary-content">
                <div class="summary-label">Vencidas</div>
                <div class="summary-value">{{ vencidas }}</div>
              </div>
            </div>
            <div class="summary-item">
              <q-icon name="fiber_new" size="24px" color="green-8" />
              <div class="summary-content">
                <div class="summary-label">Nuevas este mes</div>
                <div class="summary-value">{{ nuevasEsteMes }}</div>
              </div>
            </div>
          </div>

          <!-- Lista de inscripciones -->
          <div class="inscriptions-grid">
            <q-card v-for="inscripcion in inscripciones" :key="inscripcion.id" flat bordered
              class="inscription-card-item">
              <q-card-section class="q-pa-md">
                <div class="inscription-header-row">
                  <div class="inscription-paquete">
                    <q-icon name="inventory_2" size="20px" color="purple" class="q-mr-xs" />
                    <span class="text-weight-bold">{{ inscripcion.paquete?.nombre || 'Sin paquete' }}</span>
                  </div>
                  <q-badge :color="estadoInscripcionColor(inscripcion)" :label="estadoInscripcionLabel(inscripcion)" />
                </div>

                <div v-if="inscripcion.paquete?.disciplina" class="inscription-disciplina q-mt-sm">
                  <q-icon name="sports_martial_arts" size="18px" color="green-8" class="q-mr-xs" />
                  <span class="text-weight-medium">{{ inscripcion.paquete.disciplina.nombre }}</span>
                </div>

                <div v-if="inscripcion.nivel" class="inscription-nivel q-mt-xs">
                  <q-icon name="military_tech" size="16px" color="orange-7" class="q-mr-xs" />
                  <span class="text-caption">Nivel: {{ inscripcion.nivel.nombre_nivel }}</span>
                </div>

                <q-separator class="q-my-sm" />

                <!-- Fechas -->
                <div class="inscription-dates">
                  <div class="date-row">
                    <q-icon name="play_arrow" size="16px" color="green-7" class="q-mr-xs" />
                    <span class="date-label">Inicio:</span>
                    <span class="date-value">{{ formatDateShort(inscripcion.fecha_inicio) }}</span>
                  </div>
                  <div v-if="inscripcion.fecha_fin" class="date-row">
                    <q-icon name="stop" size="16px" color="orange-7" class="q-mr-xs" />
                    <span class="date-label">Fin:</span>
                    <span class="date-value">{{ formatDateShort(inscripcion.fecha_fin) }}</span>
                  </div>
                  <div v-else class="date-row">
                    <q-icon name="all_inclusive" size="16px" color="blue-7" class="q-mr-xs" />
                    <span class="date-label">Duración:</span>
                    <span class="date-value">Indefinida</span>
                  </div>
                </div>

                <!-- Horarios -->
                <div v-if="inscripcion.paquete?.horarios && inscripcion.paquete.horarios.length > 0"
                  class="inscription-horarios q-mt-sm">
                  <div class="horarios-header">
                    <q-icon name="schedule" size="16px" color="green-7" class="q-mr-xs" />
                    <span class="text-caption text-weight-medium">Horarios:</span>
                  </div>
                  <div class="horarios-list">
                    <q-chip v-for="(horario, idx) in inscripcion.paquete.horarios" :key="idx" size="sm" color="green-1"
                      text-color="green-9" dense>
                      {{ horario.dia }} {{ horario.hora_inicio }}-{{ horario.hora_fin }}
                    </q-chip>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Pagos -->
    <q-card class="payments-card q-mb-md">
      <div class="card-header">
        <q-icon name="payments" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Pagos</span>
        <q-chip size="sm" color="green-8" text-color="white">
          {{ pagos.length }} pago(s)
        </q-chip>
        <q-space />
        <q-select v-model="limitPagos" :options="limitOptions" dense outlined map-options emit-value
          class="limit-select">
          <template v-slot:prepend>
            <q-icon name="format_list_numbered" size="16px" />
          </template>
        </q-select>
        <div style="margin-left: 12px">
          <q-btn dense flat color="white" icon="picture_as_pdf" label="Generar reporte" @click="generarReportePagos" />
        </div>
      </div>

      <!-- Filtros de pagos -->
      <q-card-section class="q-pb-none">
        <div class="filters-header" @click="showPagosFilters = !showPagosFilters">
          <div class="filters-title">
            <q-icon name="filter_list" size="20px" />
            <span>Filtros</span>
            <q-badge v-if="activeFiltersCount > 0" :label="activeFiltersCount" color="orange-7" class="q-ml-sm" />
          </div>
          <q-icon :name="showPagosFilters ? 'expand_less' : 'expand_more'" size="24px" />
        </div>

        <q-slide-transition>
          <div v-show="showPagosFilters" class="filters-content q-mt-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-4">
                <FiltroFechas @update:desde="filterPagosDesde = $event" @update:hasta="filterPagosHasta = $event" />
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select map-options emit-value option-value="value" dense outlined v-model="filterEstado"
                  :options="estadoOptions" label="Estado" clearable class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="toggle_on" color="green-7" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-sm-6 col-md-4">
                <q-select map-options emit-value option-value="value" dense outlined v-model="filterPagosCategoria"
                  :options="categoriaOptions" label="Categoría de Pago" clearable class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="category" color="green-7" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-card-section>
        <div v-if="loadingPagos" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="pagos.length === 0" class="empty-state">
          <q-icon name="payment" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes pagos registrados</p>
        </div>
        <div v-else>
          <!-- Resumen financiero -->
          <div class="payment-summary q-mb-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="summary-item">
                  <q-icon name="account_balance_wallet" size="24px" color="green-8" />
                  <div class="summary-content">
                    <div class="summary-label">Total Pagos</div>
                    <div class="summary-value">Bs {{ totalPagos.toFixed(2) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="summary-item">
                  <q-icon name="warning" size="24px" color="orange-7" />
                  <div class="summary-content">
                    <div class="summary-label">Total Deudas</div>
                    <div class="summary-value">Bs {{ totalDeudas.toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de pagos -->
          <div class="payments-grid">
            <q-card v-for="pago in pagos" :key="pago.id" flat bordered class="payment-card-item">
              <q-card-section class="q-pa-md">
                <div class="payment-header-row">
                  <div class="payment-date-info">
                    <q-icon name="event" size="18px" color="green-8" class="q-mr-xs" />
                    <span>{{ formatDateShort(pago.fecha) }}</span>
                  </div>
                  <q-badge :color="estadoColor(pago.estado)" :label="estadoLabel(pago.estado)" />
                </div>

                <div v-if="pago.detalle" class="payment-detail-info q-mt-sm">
                  <q-icon name="description" size="18px" color="orange-7" class="q-mr-xs" />
                  <span class="text-weight-medium">{{ pago.detalle }}</span>
                </div>

                <div v-if="pago.categorium" class="payment-category-info q-mt-xs">
                  <q-icon name="category" size="16px" color="green-7" class="q-mr-xs" />
                  <span class="text-caption">{{ pago.categorium.nombre || pago.categorium }}</span>
                </div>

                <div v-if="pago.metodo" class="payment-method-info q-mt-xs">
                  <q-icon name="credit_card" size="16px" color="green-7" class="q-mr-xs" />
                  <span class="text-caption">{{ pago.metodo.nombre || pago.metodo }}</span>
                </div>

                <q-separator class="q-my-sm" />

                <!-- Montos -->
                <template v-if="pago.descuento && pago.descuento > 0">
                  <div class="payment-amounts">
                    <div class="amount-row">
                      <span class="amount-label">Monto:</span>
                      <span class="amount-value">Bs {{ pago.monto }}</span>
                    </div>
                    <div class="amount-row discount">
                      <span class="amount-label">Descuento:</span>
                      <span class="amount-value">Bs {{ pago.descuento }}</span>
                    </div>
                    <div class="amount-row total">
                      <span class="amount-label">Total:</span>
                      <span class="amount-value">Bs {{ (pago.monto - pago.descuento).toFixed(2) }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="payment-total-simple">
                    <span class="total-label">{{ pago.estado === 1 ? 'Total Pagado' : 'Monto' }}:</span>
                    <span class="total-value">Bs {{ pago.monto }}</span>
                  </div>
                </template>

                <div v-if="pago.estado === 2 && pago.saldo > 0" class="payment-saldo-info q-mt-sm">
                  <q-icon name="warning" size="18px" color="orange-7" class="q-mr-xs" />
                  <span class="text-weight-bold">Saldo pendiente: Bs {{ pago.saldo }}</span>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Progresos -->
    <q-card class="progress-card">
      <div class="card-header">
        <q-icon name="trending_up" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Progresos</span>
        <q-space />
        <q-select v-model="limitProgresos" :options="limitOptions" dense outlined map-options emit-value
          class="limit-select">
          <template v-slot:prepend>
            <q-icon name="format_list_numbered" size="16px" />
          </template>
        </q-select>
        <!-- Input de búsqueda por ID solo para Administrador -->
        <div v-if="isAdmin" class="search-progress" style="margin-left: 12px;">
          <q-input v-model.number="searchProgressId" label="Buscar por ID de Progreso" outlined dense
            @update:model-value="buscarProgreso" type="number">
            <template v-slot:prepend>
              <q-icon name="search" color="orange-7" />
            </template>
          </q-input>
        </div>
      </div>

      <!-- Filtros de progresos -->
      <q-card-section class="q-pb-none">
        <div class="filters-header" @click="showProgresosFilters = !showProgresosFilters">
          <div class="filters-title">
            <q-icon name="filter_list" size="20px" />
            <span>Filtros</span>
          </div>
          <q-icon :name="showProgresosFilters ? 'expand_less' : 'expand_more'" size="24px" />
        </div>

        <q-slide-transition>
          <div v-show="showProgresosFilters" class="filters-content q-mt-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-6">
                <FiltroFechas @update:desde="filterProgresosDesde = $event"
                  @update:hasta="filterProgresosHasta = $event" />
              </div>

              <div class="col-12 col-sm-6 col-md-6">
                <q-select map-options emit-value option-value="value" dense outlined v-model="filterProgresosCualidad"
                  :options="cualidadOptions" label="Cualidad" clearable class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="star" color="green-7" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-card-section>
        <div v-if="loadingProgresos" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="progresos.length === 0" class="empty-state">
          <q-icon name="show_chart" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes progresos registrados</p>
        </div>
        <div v-else>
          <!-- Gráfica tipo radar (tela de araña) -->
          <div class="radar-container">
            <div ref="radarChart" class="radar-chart"></div>
          </div>

          <!-- Grid de progresos -->
          <div class="progress-grid q-mt-md">
            <q-card v-for="prog in progresos" :key="prog.id" flat bordered class="progress-item">
              <q-card-section class="q-pa-md">
                <div class="progress-header">
                  <q-chip size="sm" color="orange-7" text-color="white" icon="tag">
                    ID: {{ prog.id }}
                  </q-chip>
                  <q-badge color="green-8" :label="`${prog.valor}/5`" />
                </div>
                <div class="cualidad-name q-mt-sm">{{ prog.cualidad?.nombre }}</div>
                <div class="progress-date">
                  <q-icon name="event" size="16px" class="q-mr-xs" />
                  {{ formatDateShort(prog.fecha) }}
                  <q-icon name="access_time" size="16px" class="q-ml-md q-mr-xs" />
                  {{ formatTime(prog.fecha) }}
                </div>
                <div v-if="prog.comentario" class="progress-comment q-mt-sm">
                  <q-icon name="comment" size="16px" color="orange-7" class="q-mr-xs" />
                  <span>{{ prog.comentario }}</span>
                </div>
                <div v-if="prog.usuario" class="progress-user q-mt-sm">
                  <q-icon name="person" size="16px" color="green-8" class="q-mr-xs" />
                  <span class="text-caption">
                    Registrado por: <strong>@{{ prog.usuario.usuario }}</strong>
                    ({{ prog.usuario.persona?.nombres }} {{ prog.usuario.persona?.apellido_paterno }} {{
                      prog.usuario.persona?.apellido_materno }})
                  </span>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Mis Gastos -->
    <q-card v-if="isNotStudent" class="expenses-card q-mb-md">
      <div class="card-header">
        <q-icon name="receipt_long" size="24px" class="q-mr-sm" />
        <span class="card-title">Mis Gastos</span>
        <q-chip size="sm" color="green-8" text-color="white">
          {{ gastos.length }} gasto(s)
        </q-chip>
        <q-space />
        <q-select v-model="limitGastos" :options="limitOptions" dense outlined map-options emit-value
          class="limit-select">
          <template v-slot:prepend>
            <q-icon name="format_list_numbered" size="16px" />
          </template>
        </q-select>
      </div>

      <!-- Filtros de gastos -->
      <q-card-section class="q-pb-none">
        <div class="filters-header" @click="showGastosFilters = !showGastosFilters">
          <div class="filters-title">
            <q-icon name="filter_list" size="20px" />
            <span>Filtros</span>
          </div>
          <q-icon :name="showGastosFilters ? 'expand_less' : 'expand_more'" size="24px" />
        </div>

        <q-slide-transition>
          <div v-show="showGastosFilters" class="filters-content q-mt-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-6">
                <FiltroFechas @update:desde="filterGastosDesde = $event" @update:hasta="filterGastosHasta = $event" />
              </div>

              <div class="col-12 col-sm-6 col-md-6">
                <q-select map-options emit-value option-value="value" dense outlined v-model="filterGastosCategoria"
                  :options="categoriaOptions" label="Categoría" clearable class="filter-input">
                  <template v-slot:prepend>
                    <q-icon name="category" color="green-7" />
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-card-section>
        <div v-if="loadingGastos" class="text-center q-pa-md">
          <q-spinner color="green-8" size="40px" />
        </div>
        <div v-else-if="gastos.length === 0" class="empty-state">
          <q-icon name="receipt_long" size="64px" color="grey-5" />
          <p class="text-grey-7">No tienes gastos registrados</p>
        </div>
        <div v-else>
          <!-- Resumen de gastos -->
          <div class="expense-summary q-mb-md">
            <div class="summary-item">
              <q-icon name="money_off" size="24px" color="orange-7" />
              <div class="summary-content">
                <div class="summary-label">Total Gastado</div>
                <div class="summary-value">Bs {{ totalGastos.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- Grid de gastos -->
          <div class="expenses-grid">
            <q-card v-for="gasto in gastos" :key="gasto.id" flat bordered class="expense-card-item"
              :class="`expense-estado-${gasto.estado !== undefined ? gasto.estado : 1}`">
              <q-card-section class="q-pa-md">
                <!-- Header con estado y monto -->
                <div class="expense-header-row">
                  <q-chip :color="!gasto.estado ? 'red-7' : 'primary'" text-color="white" size="sm"
                    :icon="!gasto.estado ? 'block' : 'check_circle'">
                    {{ !gasto.estado ? 'Anulado' : 'Válido' }}
                  </q-chip>
                  <q-space />
                  <div class="expense-amount">
                    <q-icon name="payments" size="20px" color="orange-7" class="q-mr-xs" />
                    <span class="amount-text">Bs {{ gasto.monto }}</span>
                  </div>
                </div>

                <!-- Detalle del gasto -->
                <div v-if="gasto.detalle" class="expense-detail-info q-mt-md">
                  <q-icon name="description" size="20px" color="orange-7" class="q-mr-xs" />
                  <span class="text-weight-bold">{{ gasto.detalle }}</span>
                </div>

                <!-- Información adicional -->
                <div class="expense-meta-info q-mt-md">
                  <div class="expense-date-info">
                    <q-icon name="event" size="16px" color="green-7" class="q-mr-xs" />
                    <span class="text-caption">{{ formatDateShort(gasto.fecha) }}</span>
                    <q-icon name="access_time" size="16px" color="green-7" class="q-ml-sm q-mr-xs" />
                    <span class="text-caption">{{ formatTime(gasto.fecha) }}</span>
                  </div>

                  <div v-if="gasto.categorium" class="expense-category-info q-mt-xs">
                    <q-icon name="category" size="16px" color="green-7" class="q-mr-xs" />
                    <span class="text-caption">{{ gasto.categorium.nombre || gasto.categorium }}</span>
                  </div>

                  <div v-if="gasto.usuario" class="expense-user-info q-mt-xs">
                    <q-icon name="person" size="16px" color="green-7" class="q-mr-xs" />
                    <span class="text-caption"><strong>@{{ gasto.usuario.usuario || 'Usuario' }}</strong></span>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { listarEvaluaciones } from 'src/stores/evaluacion-store'
import { listarProgreso } from 'src/stores/progreso-store'
import { listarPagos } from 'src/stores/pago_store.js'
import { listarGastos } from 'src/stores/gasto-store'
import { reportePagosParams } from 'src/stores/reportes.js'
import { listar as listarInscripciones } from 'src/stores/inscripcion-store'
import { listarCategorias } from 'src/stores/categoria-store.js'
import { listar as listarCualidades } from 'src/stores/cualidad-store.js'
import { listarDisciplinas } from 'src/stores/disciplina-store.js'
import { listarNiveles } from 'src/stores/nivel.js'
import { listarPaquetes } from 'src/stores/paquete-store.js'
import FiltroFechaRango from 'src/components/FiltroFechaRango.vue'
import * as echarts from 'echarts'

const $q = useQuasar()

// Usuario actual
const userData = ref(null)
const evaluaciones = ref([])
const progresos = ref([])
const pagos = ref([])
const totalPagos = ref(0)
const totalDeudas = ref(0)
const inscripciones = ref([])
const totalInscripciones = ref(0)
const porVencer = ref(0)
const vencidas = ref(0)
const nuevasEsteMes = ref(0)
const loadingEvaluaciones = ref(false)
const loadingProgresos = ref(false)
const loadingPagos = ref(false)
const loadingInscripciones = ref(false)
const radarChart = ref(null)
const radarData = ref([])
let chartInstance = null

// Búsqueda de progreso por ID (solo para admin)
const searchProgressId = ref(null)

// Opciones de límite
const limitOptions = [
  { label: 'Ver 10', value: 10 },
  { label: 'Ver 20', value: 20 },
  { label: 'Ver 50', value: 50 },
  { label: 'Todos', value: null }
]

// Límites por sección
const limitEvaluaciones = ref(10)
const limitInscripciones = ref(10)
const limitPagos = ref(10)
const limitProgresos = ref(10)
const limitGastos = ref(10)

// Filtros de evaluaciones
const filterEvaluacionesDesde = ref(null)
const filterEvaluacionesHasta = ref(null)
const filterEvaluacionesCualidad = ref(null)
const showEvaluacionesFilters = ref(false)

// Filtros de inscripciones
const filterInscripcionesEstado = ref(null)
const filterInscripcionesDisciplina = ref(null)
const filterInscripcionesNivel = ref(null)
const filterFechaFin = ref('vacio')
const filterFechaInicio = ref('vacio')
const filterInscripcionesPaquete = ref(null)
const filterInscripcionesPagos = ref(null)
const showInscripcionesFilters = ref(false)

const estadoInscripcionOptions = [
  { label: 'Todos', value: null },
  { label: 'Activas', value: 1 },
  { label: 'Suspendidas', value: 0 }
]

const pagosInscripcionOptions = [
  { label: 'Al Día', value: 1 },
  { label: 'Debidas', value: 2 }
]

const disciplinasOptions = ref([])
const nivelOptions = ref([])
const paqueteOptions = ref([])

// Filtros de pagos
const filterPagosDesde = ref(null)
const filterPagosHasta = ref(null)
const filterEstado = ref(null)
const filterPagosCategoria = ref(null)
const categoriaOptions = ref([])
const cualidadOptions = ref([])
const showPagosFilters = ref(false)

// Filtros de progresos
const filterProgresosDesde = ref(null)
const filterProgresosHasta = ref(null)
const filterProgresosCualidad = ref(null)
const showProgresosFilters = ref(false)

// Filtros de gastos (solo visible si no es estudiante)
const filterGastosDesde = ref(null)
const filterGastosHasta = ref(null)
const filterGastosCategoria = ref(null)
const showGastosFilters = ref(false)
const gastos = ref([])
const totalGastos = ref(0)
const loadingGastos = ref(false)

const estadoOptions = [
  { label: 'Todos', value: null },
  { label: 'Anulado', value: 0 },
  { label: 'Valido', value: 1 },
  { label: 'Deuda', value: 2 }
]

// Computed para verificar si es administrador
const isAdmin = computed(() => {
  return userData.value?.rols?.some(rol => rol.id === 4 && rol.nombre === 'Administrador')
})

// Computed para verificar si NO es estudiante
const isNotStudent = computed(() => {
  const savedRoleId = sessionStorage.getItem('selectedRoleId')
  return savedRoleId !== '3'
})

// Cargar categorías (para gastos, pagos, inscripciones)
const loadCategorias = async () => {
  try {
    const res = await listarCategorias()
    categoriaOptions.value = (Array.isArray(res) ? res : [])
      .map(c => ({ label: c.nombre, value: c.id }))
  } catch (e) {
    console.error('Error cargando categorías:', e)
  }
}

// Cargar cualidades (para evaluaciones y progresos)
const loadCualidades = async () => {
  try {
    const res = await listarCualidades()
    cualidadOptions.value = (Array.isArray(res) ? res : [])
      .map(c => ({ label: c.nombre, value: c.id }))
  } catch (e) {
    console.error('Error cargando cualidades:', e)
  }
}

// Cargar disciplinas (para inscripciones)
const loadDisciplinas = async () => {
  try {
    const res = await listarDisciplinas()
    disciplinasOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('Error cargando disciplinas:', e)
    disciplinasOptions.value = []
  }
}

// Cargar niveles (para inscripciones)
const loadNiveles = async () => {
  try {
    const res = await listarNiveles()
    nivelOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('Error cargando niveles:', e)
    nivelOptions.value = []
  }
}

// Cargar paquetes (para inscripciones)
const loadPaquetes = async () => {
  try {
    const res = await listarPaquetes()
    paqueteOptions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('Error cargando paquetes:', e)
    paqueteOptions.value = []
  }
}

// Cargar datos del usuario
onMounted(async () => {
  const current = JSON.parse(sessionStorage.getItem('user'))
  console.log('usuario actual: ', current)
  userData.value = current

  if (current?.persona?.id) {
    await loadCategorias()
    await loadCualidades()
    await loadDisciplinas()
    await loadNiveles()
    await loadPaquetes()
    if (isNotStudent.value) {
      await cargarEvaluaciones(current.persona.id)
    }
    await cargarProgresos({ id_persona: current.persona.id })
    await cargarPagos()
    await cargarInscripciones()
    if (isNotStudent.value) {
      await cargarGastos()
    }
  }
})

// Watch para renderizar el chart cuando cambien los progresos y el loading termine
watch([progresos, loadingProgresos], ([newProgresos, isLoading]) => {
  console.log('👀 Watch activado - Progresos:', newProgresos.length, 'Loading:', isLoading)
  if (!isLoading && newProgresos.length > 0) {
    console.log('✅ Condiciones cumplidas, intentando renderizar...')
    // Pequeño delay para asegurar que el DOM se actualice
    setTimeout(() => {
      console.log('⏰ Ejecutando renderRadarChart después del timeout')
      renderRadarChart()
    }, 100)
  }
})

// Cargar evaluaciones
const cargarEvaluaciones = async (idPersona = null) => {
  loadingEvaluaciones.value = true
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const params = {
      id_persona: idPersona || current?.persona?.id,
      limit: limitEvaluaciones.value,
      desde: filterEvaluacionesDesde.value,
      hasta: filterEvaluacionesHasta.value,
      id_cualidad: filterEvaluacionesCualidad.value,
      page: 1
    }
    const res = await listarEvaluaciones(params)
    evaluaciones.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (error) {
    console.error('Error cargando evaluaciones:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar evaluaciones' })
  } finally {
    loadingEvaluaciones.value = false
  }
}

// Cargar progresos
const cargarProgresos = async (params = {}) => {
  loadingProgresos.value = true
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const fullParams = {
      id_persona: params.id_persona || current?.persona?.id,
      limit: limitProgresos.value,
      desde: filterProgresosDesde.value,
      hasta: filterProgresosHasta.value,
      id_cualidad: filterProgresosCualidad.value,
      page: 1,
      ...params
    }
    const res = await listarProgreso(fullParams)
    console.log('📊 Respuesta de listarProgreso:', res)
    // Extraer datos del radar del backend (si están disponibles)
    radarData.value = res?.radarData || []

    // Extraer lista de progresos
    progresos.value = Array.isArray(res) ? res : (res?.progresos || res?.data || [])

    console.log('🔍 Array de progresos:', progresos.value)
    console.log('📊 Total de progresos:', progresos.value.length)
    console.log('📈 Datos del radar desde backend:', radarData.value)
    if (progresos.value.length > 0) {
      console.log('📋 Primer progreso de ejemplo:', progresos.value[0])
    }
  } catch (error) {
    console.error('Error cargando progresos:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar progresos' })
  } finally {
    loadingProgresos.value = false
  }
}

// Buscar progreso por ID (solo admin)
const buscarProgreso = async () => {
  const current = JSON.parse(sessionStorage.getItem('user'))
  if (searchProgressId.value) {
    await cargarProgresos({ id: searchProgressId.value })
  } else {
    await cargarProgresos({ id_persona: current?.persona?.id })
  }
}

// Cargar pagos
const cargarPagos = async () => {
  loadingPagos.value = true
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const params = {
      desde: filterPagosDesde.value,
      hasta: filterPagosHasta.value,
      id_persona: current?.persona?.id,
      estado: filterEstado.value,
      id_categoria: filterPagosCategoria.value,
      page: 1,
      limit: limitPagos.value
    }
    const res = await listarPagos(params)
    // Extraer totalPagos, totalDeudas y lista del backend
    totalPagos.value = res?.totalPagos || 0
    totalDeudas.value = res?.totalDeudas || 0
    pagos.value = res?.lista || []
  } catch (error) {
    console.error('Error cargando pagos:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar pagos' })
  } finally {
    loadingPagos.value = false
  }
}

// Generar reporte PDF con los parámetros actuales
const generarReportePagos = async () => {
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const params = {
      desde: filterPagosDesde.value,
      hasta: filterPagosHasta.value,
      id_persona: current?.persona?.id,
      estado: filterEstado.value,
    }
    $q.notify({ type: 'info', message: 'Generando reporte...' })
    await reportePagosParams(params)
  } catch (error) {
    console.error('Error generando reporte de pagos:', error)
    $q.notify({ type: 'negative', message: 'Error al generar el reporte' })
  }
}

// Watch para filtros de pagos
watch([limitPagos, filterPagosDesde, filterPagosHasta, filterEstado, filterPagosCategoria], () => {
  if (userData.value?.persona?.id) {
    cargarPagos()
  }
})

// Watch para filtros de evaluaciones
watch([limitEvaluaciones, filterEvaluacionesDesde, filterEvaluacionesHasta, filterEvaluacionesCualidad], () => {
  if (userData.value?.persona?.id && isNotStudent.value) {
    cargarEvaluaciones()
  }
})

// Watch para filtros de inscripciones
watch([filterInscripcionesEstado, filterInscripcionesDisciplina, filterInscripcionesNivel, filterFechaFin, filterFechaInicio, filterInscripcionesPaquete, filterInscripcionesPagos], () => {
  cargarInscripciones()
})

// Watch para filtros de progresos
watch([limitProgresos, filterProgresosDesde, filterProgresosHasta, filterProgresosCualidad], () => {
  if (userData.value?.persona?.id) {
    cargarProgresos()
  }
})

// Watch para filtros de gastos
watch([limitGastos, filterGastosDesde, filterGastosHasta, filterGastosCategoria], () => {
  if (userData.value?.persona?.id && isNotStudent.value) {
    cargarGastos()
  }
})

// Cargar gastos
const cargarGastos = async () => {
  loadingGastos.value = true
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const params = {
      id_usuario_gasta: current?.id,
      limit: limitGastos.value,
      desde: filterGastosDesde.value,
      hasta: filterGastosHasta.value,
      id_categoria: filterGastosCategoria.value,
      page: 1
    }
    const res = await listarGastos(params)
    const data = res?.data || res
    totalGastos.value = data?.totalGastos || 0
    gastos.value = data?.lista || []
    console.log('gastos.-----------------------------', gastos.value);

  } catch (error) {
    console.error('Error cargando gastos:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar gastos' })
  } finally {
    loadingGastos.value = false
  }
}

// Utilidades para pagos
const estadoColor = (estado) => {
  switch (estado) {
    case 0: return 'negative'
    case 1: return 'positive'
    case 2: return 'orange-7'
    default: return 'grey'
  }
}

const estadoLabel = (estado) => {
  switch (estado) {
    case 0: return 'Anulado'
    case 1: return 'Pagado'
    case 2: return 'Parcial'
    default: return 'Desconocido'
  }
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterPagosDesde.value) count++
  if (filterPagosHasta.value) count++
  if (filterEstado.value !== null && filterEstado.value !== undefined) count++
  if (filterPagosCategoria.value) count++
  return count
})

// Cargar inscripciones
const cargarInscripciones = async () => {
  loadingInscripciones.value = true
  try {
    const current = JSON.parse(sessionStorage.getItem('user'))
    const params = {
      id_persona: current?.persona?.id || undefined,
      estado: filterInscripcionesEstado.value !== null ? filterInscripcionesEstado.value : undefined,
      id_disciplina: filterInscripcionesDisciplina.value || undefined,
      id_nivel: filterInscripcionesNivel.value || undefined,
      fecha_fin: filterFechaFin.value || undefined,
      fecha_inicio: filterFechaInicio.value || undefined,
      id_paquete: filterInscripcionesPaquete.value || undefined,
      pagos: filterInscripcionesPagos.value || undefined,
      page: 1,
      limit: limitInscripciones.value
    }

    // Eliminar undefined
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k])

    const res = await listarInscripciones(params)
    const data = res?.data || res
    totalInscripciones.value = data?.totalInscripciones || 0
    porVencer.value = data?.porVencer || 0
    vencidas.value = data?.vencidas || 0
    nuevasEsteMes.value = data?.nuevasEsteMes || 0
    inscripciones.value = data?.lista || []
  } catch (error) {
    console.error('Error cargando inscripciones:', error)
    $q.notify({ type: 'negative', message: 'Error al cargar inscripciones' })
  } finally {
    loadingInscripciones.value = false
  }
}

// Utilidades para inscripciones
const normalizeDate = (dateInput) => {
  if (!dateInput) return null
  const d = new Date(dateInput)
  if (isNaN(d)) return null
  d.setHours(0, 0, 0, 0)
  return d
}

const getInscripcionStatus = (row) => {
  if (!row) return { label: 'Desconocido', color: 'grey' }

  if (row.estado === 0) {
    return { label: 'Suspendida', color: 'negative' }
  }

  if (row.estado === 1) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fin = normalizeDate(row.fecha_fin)

    if (!fin) {
      return { label: 'En marcha', color: 'positive' }
    }

    const diffDays = Math.floor((fin - hoy) / 86400000)

    if (diffDays < 0) {
      return { label: 'Vencida', color: 'grey-7' }
    }

    if (diffDays <= 7) {
      return { label: 'Por vencer', color: 'warning' }
    }

    return { label: 'En marcha', color: 'positive' }
  }

  return { label: 'Desconocido', color: 'grey' }
}

const estadoInscripcionColor = (row) => {
  return getInscripcionStatus(row).color
}

const estadoInscripcionLabel = (row) => {
  return getInscripcionStatus(row).label
}

// Renderizar gráfica radar
const renderRadarChart = () => {
  console.log('🎨 Renderizando gráfica radar...')
  console.log('📍 Elemento radarChart:', radarChart.value)
  console.log('📈 Datos del radar desde backend:', radarData.value)

  if (!radarChart.value) {
    console.log('⚠️ No se puede renderizar: elemento faltante')
    return
  }

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(radarChart.value)

  let indicator = []
  let values = []

  // Si el backend envió datos del radar, usarlos
  if (radarData.value && radarData.value.length > 0) {
    console.log('✅ Usando datos del radar desde el backend')
    indicator = radarData.value.map(item => ({
      name: item.cualidad || item.nombre,
      max: 5
    }))
    values = radarData.value.map(item => parseFloat(item.promedio || 0))
  } else {
    // Fallback: calcular en el frontend si el backend no envió datos
    console.log('⚠️ Backend no envió radarData, calculando en frontend...')

    if (progresos.value.length === 0) {
      console.log('⚠️ No hay progresos para calcular')
      return
    }

    const cualidadesMap = new Map()
    progresos.value.forEach(prog => {
      const nombre = prog.cualidad?.nombre || 'Sin nombre'
      if (!cualidadesMap.has(nombre)) {
        cualidadesMap.set(nombre, [])
      }
      cualidadesMap.get(nombre).push(prog.valor)
    })

    const promedios = new Map()
    cualidadesMap.forEach((valores, nombre) => {
      const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length
      promedios.set(nombre, promedio.toFixed(2))
    })

    indicator = Array.from(promedios.keys()).map(nombre => ({
      name: nombre,
      max: 5
    }))

    values = Array.from(promedios.values()).map(v => parseFloat(v))
  }

  console.log('📊 Indicadores para radar:', indicator)
  console.log('💯 Valores para radar:', values)

  const option = {
    title: {
      text: 'Evolución de Cualidades',
      left: 'center',
      top: 10,
      textStyle: {
        color: '#2e7d32',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const cualidad = params.name
        const valor = typeof params.value === 'number' ? params.value.toFixed(2) : params.value
        return `${cualidad}: ${valor}/5 (promedio)`
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '15%',
      bottom: '5%',
      containLabel: true
    },
    radar: {
      center: ['50%', '55%'],
      radius: '60%',
      indicator: indicator,
      shape: 'polygon',
      splitNumber: 5,
      name: {
        textStyle: {
          color: '#558b2f',
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      splitLine: {
        lineStyle: {
          color: ['#c8e6c9', '#c8e6c9', '#c8e6c9', '#c8e6c9', '#c8e6c9']
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(200, 230, 201, 0.1)', 'rgba(200, 230, 201, 0.2)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#7cb342'
        }
      }
    },
    series: [{
      name: 'Progresos',
      type: 'radar',
      data: [{
        value: values,
        name: 'Mis Progresos',
        areaStyle: {
          color: 'rgba(255, 152, 0, 0.3)'
        },
        lineStyle: {
          color: '#ff9800',
          width: 2
        },
        itemStyle: {
          color: '#ff9800'
        }
      }]
    }]
  }

  chartInstance.setOption(option)

  // Redimensionar cuando cambie el tamaño de la ventana
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
}

// Normalizar string de fecha a forma ISO entendible por Date: 'YYYY-MM-DDTHH:mm:ss'
const normalizeToISO = (dateStr) => {
  if (!dateStr) return null
  let s = String(dateStr).trim()
  // Si ya viene con 'T' lo dejamos, si viene con espacio lo convertimos
  if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T')
  // Si solo es fecha 'YYYY-MM-DD', añadimos hora 00:00:00
  if (!s.includes('T')) s = `${s}T00:00:00`
  return s
}

// Formatear fecha completa (mantiene comportamiento actual mostrando solo la fecha legible)
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const iso = normalizeToISO(dateStr)
  const date = iso ? new Date(iso) : new Date(dateStr)
  if (isNaN(date)) return String(dateStr)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Formatear fecha corta (misma que formatDate)
const formatDateShort = (dateStr) => formatDate(dateStr)

// Formatear hora: extrae parte horaria si existe
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const s = String(dateStr).trim()
  if (s.includes(' ')) return s.split(' ')[1] || ''
  if (s.includes('T')) return s.split('T')[1] || ''
  return ''
}

// Formatear fecha y hora: combina la representación de fecha legible y la hora extraída
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const datePart = formatDate(dateStr)
  const timePart = formatTime(dateStr)
  return timePart ? `${datePart} ${timePart}` : datePart
}
</script>

<style scoped lang="scss">
@import 'src/css/quasar.variables.scss';

// Paleta de colores
$color-forest-dark: #1b5e20;
$color-forest: #2e7d32;
$color-moss: #558b2f;
$color-leaf: #7cb342;
$color-lime: #9ccc65;
$color-orange: #ff9800;
$color-orange-light: #ffb74d;
$color-orange-dark: #f57c00;
$pastel-mint: #c8e6c9;
$pastel-sage: #f1f8e9;
$pastel-orange: #ffe0b2;

// ===== PÁGINA PRINCIPAL =====
.profile-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%);
  min-height: 100vh;
  transition: all 0.3s ease;

  &.dark-mode {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }
}

// ===== HEADER =====
.page-header {
  background: linear-gradient(135deg, $color-forest-dark 0%, $color-forest 50%, $color-moss 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(27, 94, 32, 0.25);
  animation: slideInDown 0.6s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.user-avatar {
  background: linear-gradient(135deg, $color-orange 0%, $color-orange-light 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 152, 0, 0.4);
}

.user-info {
  flex: 1;
}

.page-title {
  color: white;
  font-size: 1.8em;
  font-weight: 800;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

  .title-icon {
    animation: pulse 3s ease infinite;
  }
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1em;
  font-weight: 500;
  margin: 0 0 12px 0;
}

.user-roles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// ===== CARDS =====
.info-card,
.evaluations-card,
.payments-card,
.progress-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border-color: $color-leaf;
  }
}

.card-header {
  background: linear-gradient(135deg, $color-forest 0%, $color-moss 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.card-title {
  font-size: 1.2em;
  font-weight: 700;
  flex: 1;
}

.limit-select {
  width: 130px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;

  :deep(.q-field__control) {
    color: white;

    &:before {
      border-color: rgba(255, 255, 255, 0.3);
    }
  }

  :deep(.q-field__label) {
    color: rgba(255, 255, 255, 0.9);
  }

  :deep(.q-field__native) {
    color: white;
  }

  :deep(.q-icon) {
    color: rgba(255, 255, 255, 0.9);
  }
}

// ===== DATOS PERSONALES =====
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba($color-forest, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($color-forest, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba($color-forest, 0.1);
    border-color: $color-leaf;
    transform: translateY(-2px);
  }
}

.info-label {
  font-weight: 600;
  color: $color-forest;
  min-width: 100px;
}

.info-value {
  font-weight: 500;
  color: $color-moss;
}

.bio-section {
  padding: 16px;
  background: rgba($color-orange, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($color-orange, 0.2);
}

.bio-text {
  margin: 8px 0 0 28px;
  color: $color-moss;
  line-height: 1.6;
}

// ===== EVALUACIONES =====
.evaluations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.evaluation-card {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-orange;
    box-shadow: 0 4px 12px rgba($color-orange, 0.2);
    transform: translateY(-4px);
  }
}

.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.eval-training {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: rgba($color-orange, 0.08);
  border-radius: 6px;
  border-left: 3px solid $color-orange;

  span {
    color: $color-orange-dark;
  }
}

.cualidad-name {
  font-weight: 700;
  font-size: 1.05em;
  color: $color-forest;
}

.eval-date,
.progress-date {
  display: flex;
  align-items: center;
  font-size: 0.85em;
  color: $color-moss;
  margin-top: 8px;
}

.eval-comment,
.progress-comment {
  margin-top: 12px;
  padding: 12px;
  background: rgba($color-orange, 0.1);
  border-radius: 8px;
  border-left: 3px solid $color-orange;
  font-size: 0.9em;
  color: $color-moss;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

// ===== INSCRIPCIONES =====
.inscription-summary {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba($color-forest, 0.05) 0%, rgba($color-orange, 0.05) 100%);
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.1);
}

.inscriptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.inscription-card-item {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-orange;
    box-shadow: 0 4px 12px rgba($color-orange, 0.2);
    transform: translateY(-4px);
  }
}

.inscription-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inscription-paquete {
  display: flex;
  align-items: center;
  color: $color-forest;
  font-size: 1.05em;
}

.inscription-disciplina,
.inscription-nivel {
  display: flex;
  align-items: center;
  color: $color-moss;
}

.inscription-dates {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9em;
}

.date-label {
  color: $color-moss;
  font-weight: 600;
  min-width: 50px;
}

.date-value {
  color: $color-forest;
  font-weight: 500;
}

.inscription-horarios {
  padding: 8px;
  background: rgba($color-forest, 0.05);
  border-radius: 8px;
}

.horarios-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  color: $color-forest;
}

.horarios-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

// ===== PAGOS =====
.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba($color-forest, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($color-forest, 0.1);
  }
}

.filters-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: $color-forest;
}

.filters-content {
  padding: 8px 0;
}

.filter-input {
  background: white;
}

.payment-summary {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba($color-forest, 0.05) 0%, rgba($color-orange, 0.05) 100%);
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.1);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.85em;
  color: $color-moss;
  font-weight: 600;
}

.summary-value {
  font-size: 1.5em;
  font-weight: 800;
  color: $color-forest;
}

.payments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.payment-card-item {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-orange;
    box-shadow: 0 4px 12px rgba($color-orange, 0.2);
    transform: translateY(-4px);
  }
}

.payment-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-date-info {
  display: flex;
  align-items: center;
  font-size: 0.9em;
  color: $color-moss;
  font-weight: 600;
}

.payment-detail-info,
.payment-category-info,
.payment-method-info {
  display: flex;
  align-items: center;
  color: $color-moss;
}

.payment-amounts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;

  &.discount {
    color: $color-orange-dark;
    font-weight: 600;
  }

  &.total {
    padding-top: 8px;
    border-top: 2px solid rgba($color-forest, 0.2);
    font-weight: 700;
    font-size: 1.1em;
    color: $color-forest;
  }
}

.amount-label {
  color: $color-moss;
}

.amount-value {
  font-weight: 600;
}

.payment-total-simple {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-weight: 700;
  font-size: 1.1em;
  color: $color-forest;
}

.payment-saldo-info {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba($color-orange, 0.1);
  border-radius: 8px;
  border-left: 3px solid $color-orange;
  color: $color-orange-dark;
}

// ===== GASTOS =====
.expenses-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  }
}

.expense-summary {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba($color-forest, 0.05) 0%, rgba($color-orange, 0.05) 100%);
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.1);
}

.expenses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.expense-card-item {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, $color-forest 0%, $color-moss 100%);
    transition: width 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(46, 125, 50, 0.2);
    border-color: $color-forest;

    &::before {
      width: 6px;
    }
  }

  &.expense-estado-0 {
    opacity: 0.7;
    border-color: rgba(#9e9e9e, 0.3);

    &::before {
      background: linear-gradient(180deg, #757575 0%, #9e9e9e 100%);
    }

    &:hover {
      border-color: #9e9e9e;
    }
  }
}

.expense-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expense-amount {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba($color-orange, 0.1) 0%, rgba($color-orange-light, 0.1) 100%);
  padding: 8px 12px;
  border-radius: 8px;

  .amount-text {
    font-size: 1.2em;
    font-weight: bold;
    color: $color-orange-dark;
  }
}

.expense-detail-info {
  display: flex;
  align-items: center;
  color: $color-forest;
  font-size: 1.05em;
  line-height: 1.4;
}

.expense-meta-info {
  padding: 12px;
  background: rgba($color-forest, 0.03);
  border-radius: 8px;
  border-left: 3px solid $color-forest;
}

.expense-date-info {
  display: flex;
  align-items: center;
  color: $color-moss;
}

.expense-category-info,
.expense-user-info {
  display: flex;
  align-items: center;
  color: $color-moss;
}

// ===== PROGRESOS =====
.search-progress {
  min-width: 250px;
}

.radar-container {
  overflow-x: auto;
  padding: 10px 0;
  margin: 20px 0;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: $pastel-sage;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-orange;
    border-radius: 4px;

    &:hover {
      background: $color-orange-dark;
    }
  }
}

.radar-chart {
  width: 100%;
  min-width: 500px;
  height: 450px;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.progress-item {
  border-radius: 12px;
  border: 2px solid rgba($color-forest, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(46, 125, 50, 0.2);
    border-color: $color-forest;
  }
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-user {
  padding: 8px 12px;
  background: rgba($color-forest, 0.05);
  border-radius: 8px;
  border-left: 3px solid $color-leaf;
}

// ===== EMPTY STATE =====
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

// ===== ANIMACIONES =====
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

// ===== RESPONSIVO =====
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
    margin-bottom: 20px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.4em;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .evaluations-grid {
    grid-template-columns: 1fr;
  }

  .inscriptions-grid {
    grid-template-columns: 1fr;
  }

  .payments-grid {
    grid-template-columns: 1fr;
  }

  .expenses-grid {
    grid-template-columns: 1fr;
  }

  .progress-grid {
    grid-template-columns: 1fr;
  }

  .radar-container {
    overflow-x: auto;
  }

  .radar-chart {
    min-width: 450px;
    height: 280px;
  }

  .search-progress {
    min-width: 100%;
    margin-top: 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }
}

// ===== RESPONSIVO TABLET =====
@media (max-width: 1200px) and (min-width: 769px) {
  .progress-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

// ===== MODO OSCURO =====
:deep(.body--dark) {
  .profile-page {
    background: linear-gradient(135deg, #1a1a1a 0%, #0d1f13 100%);
  }

  .info-card,
  .evaluations-card,
  .payments-card,
  .progress-card,
  .expenses-card {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  .info-item {
    background: rgba($color-forest, 0.15);
    border-color: rgba($color-forest, 0.3);
  }

  .info-label {
    color: $color-leaf;
  }

  .info-value {
    color: #e0e0e0;
  }

  .evaluation-card,
  .inscription-card-item,
  .payment-card-item,
  .expense-card-item,
  .progress-item {
    background: #333;
    border-color: rgba($color-forest, 0.3);
  }

  .cualidad-name {
    color: $color-leaf;
  }

  .filter-input {
    background: #2a2a2a;
  }
}
</style>
