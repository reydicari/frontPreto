<template>
  <div ref="chartContainer" style="width: 100%; height: 100%; min-height: 300px;"></div>
</template>

<script setup>
defineOptions({
  name: 'GraficaDisciplinas'
})
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const chartContainer = ref(null)
let chartInstance = null

const colores = ['#2e7d32', '#558b2f', '#7cb342', '#9ccc65', '#8bc34a', '#c8e6c9']

const actualizarGrafica = () => {
  if (!chartInstance) return

  const datosGrafica = props.data.length > 0
    ? props.data.map((item, index) => ({
      value: item.cantidad,
      name: item.nombre,
      itemStyle: { color: colores[index % colores.length] }
    }))
    : [

    ]

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(46, 125, 50, 0.95)',
      borderColor: '#2e7d32',
      borderWidth: 2,
      textStyle: {
        color: '#ffffff',
        fontSize: 13
      },
      formatter: '{b}: {c} estudiantes ({d}%)'
    },
    legend: {
      show: false
    },
    series: [
      {
        name: 'Estudiantes',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          fontSize: 11,
          fontWeight: '600',
          color: '#424242'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: datosGrafica,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return idx * 100
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

onMounted(() => {
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value)
    actualizarGrafica()

    // Ajustar tamaño al cambiar la ventana
    window.addEventListener('resize', () => chartInstance.resize())
  }
})

watch(() => props.data, () => {
  actualizarGrafica()
}, { deep: true })

onBeforeUnmount(() => {
  if (chartInstance) {
    window.removeEventListener('resize', () => chartInstance.resize())
    chartInstance.dispose()
  }
})
</script>

<style scoped lang="scss">
// Estilos opcionales para el contenedor</style>
