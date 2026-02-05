<template>
  <q-dialog v-model="show" persistent>
    <q-card class="expense-dialog responsive-dialog scrollable-dialog">
      <q-card-section class="expense-header">
        <div class="header-title-expense">
          <q-icon name="receipt" size="32px" class="q-mr-sm" />
          <div class="text-h5 text-weight-bold">Registrar Gasto</div>
        </div>
      </q-card-section>

      <q-separator class="separator-gradient" />

      <q-card-section class="expense-form">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model.number="local.monto" type="number" label="Monto *" prefix="Bs " outlined dense step="0.01"
              class="form-input" :rules="[val => val > 0 || 'El monto debe ser mayor a 0']">
              <template v-slot:prepend>
                <q-icon name="attach_money" color="green-7" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input v-model="local.fecha" label="Fecha *" outlined dense readonly class="form-input">
              <template v-slot:prepend>
                <q-icon name="event" color="green-7" />
              </template>
              <template v-slot:append>
                <q-icon name="calendar_month" class="cursor-pointer" />
              </template>
              <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date v-model="local.fecha" mask="YYYY-MM-DD HH:mm:ss">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="OK" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-input>
          </div>

          <div class="col-12">
            <q-select v-model="local.id_categoria" :options="categoriaOptions" option-value="id" option-label="nombre"
              map-options emit-value label="Categoría *" outlined dense class="form-input"
              :rules="[val => !!val || 'Seleccione una categoría']">
              <template v-slot:prepend>
                <q-icon name="category" color="green-7" />
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <q-input v-model="local.observacion" label="Observación (opcional)" outlined dense type="textarea" rows="3"
              class="form-input" counter maxlength="100">
              <template v-slot:prepend>
                <q-icon name="notes" color="green-7" />
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <q-file v-model="comprobanteFile" accept="image/*" label="Comprobante (imagen opcional)" outlined dense
              class="form-input" counter>
              <template v-slot:prepend>
                <q-icon name="image" color="green-7" />
              </template>
              <template v-slot:append>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrar" class="action-btn" />
        <q-btn unelevated label="Guardar" color="green-7" @click="guardar" :loading="loading" class="action-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { agregarGasto } from 'stores/gasto-store'
import { listarCategorias } from 'stores/categoria-store'

const props = defineProps({
  modelValue: Boolean,
  gasto: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const comprobanteFile = ref(null)
const categoriaOptions = ref([])

const local = reactive({
  monto: null,
  fecha: today(),
  id_categoria: null,
  observacion: '',
  id_usuario_gasta: null
})

function today() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function getCurrentUserId() {
  try {
    const raw = sessionStorage.getItem('user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.id || ''
  } catch { return '' }
}

function resetLocal() {
  local.monto = null
  local.fecha = today()
  local.id_categoria = null
  local.observacion = ''
  local.id_usuario_gasta = getCurrentUserId()
  comprobanteFile.value = null
}

async function cargarCategorias() {
  try {
    const res = await listarCategorias()
    categoriaOptions.value = res || []
  } catch (error) {
    console.error('Error cargando categorías:', error)
  }
}

async function guardar() {
  if (!local.monto || local.monto <= 0) {
    return
  }
  if (!local.id_categoria) {
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('monto', parseFloat(local.monto).toFixed(2))
    formData.append('fecha', local.fecha)
    formData.append('id_categoria', local.id_categoria)
    formData.append('id_usuario_gasta', local.id_usuario_gasta)
    formData.append('estado', 'true')

    if (local.observacion) {
      formData.append('observacion', local.observacion)
    }

    if (comprobanteFile.value) {
      formData.append('comprobante', comprobanteFile.value)
    }

    const res = await agregarGasto(formData)
    console.log('verificando el res: ', res);

    if (res.data.ok) {
      resetLocal()
      cerrar()
      emit('saved')
    }
  } catch (error) {
    console.error('Error al guardar gasto:', error)
  } finally {
    loading.value = false
  }
}

function cerrar() {
  show.value = false
  resetLocal()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetLocal()
    cargarCategorias()
  }
}, { immediate: true })
</script>

<style scoped>
.expense-dialog {
  width: 100%;
  max-width: 500px;

  .expense-header {
    background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
    color: white;
    padding: 20px 24px;
  }

  .header-title-expense {
    display: flex;
    align-items: center;
  }

  .separator-gradient {
    height: 3px;
    background: linear-gradient(90deg, #2e7d32, #66bb6a, #2e7d32);
  }

  .expense-form {
    padding: 24px;
  }

  .form-input {
    margin-bottom: 4px;
  }

  .action-btn {
    min-width: 100px;
    font-weight: 500;
  }

  .scrollable-dialog {
    max-height: 85vh;
    overflow-y: auto;
  }

  .responsive-dialog {
    max-width: 95vw;
  }

  @media (max-width: 599px) {
    .expense-dialog {
      max-width: 100%;
      margin: 0;
      border-radius: 0;
    }

    .expense-header {
      padding: 16px;
    }

    .expense-form {
      padding: 16px;
    }
  }
}
</style>
