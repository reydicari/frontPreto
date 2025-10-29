<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="min-width: 700px">
      <q-card-section>
        <div class="text-h6">Pagos de Inscripción #{{ inscripcion?.id }}</div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="inscripcion?.pagos || []"
          :columns="columns"
          row-key="id"
          dense
        >
          <template v-slot:top>
            <q-btn
              color="primary"
              icon="add"
              label="Nuevo Pago"
              @click="showPagoDialog(null)"
            />
          </template>

          <template v-slot:body-cell-monto="props">
            <q-td :props="props">
              ${{ props.row.monto.toLocaleString() }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cerrar" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  inscripcion: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left'
  },
  {
    name: 'fecha',
    label: 'Fecha',
    field: 'fecha',
    align: 'left'
  },
  {
    name: 'monto',
    label: 'Monto',
    field: 'monto',
    align: 'right'
  },
  {
    name: 'meses_cubiertos',
    label: 'Meses',
    field: 'meses_cubiertos',
    align: 'center'
  },
  {
    name: 'metodo',
    label: 'Método',
    field: 'metodo',
    align: 'left'
  }
]

function showPagoDialog(pago) {
  // Lógica para mostrar diálogo de pago
}
</script>
