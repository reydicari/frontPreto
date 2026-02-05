<template>
  <div ref="chartContainer" style="width: 100%; height: 100%; min-height: 300px;"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({ meses: [], valores: [] })
  }
})

const chartContainer = ref(null)
let chartInstance = null

const actualizarGrafica = () => {
  if (!chartInstance) return

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(46, 125, 50, 0.95)',
      borderColor: '#2e7d32',
      borderWidth: 2,
      textStyle: {
        color: '#ffffff',
        fontSize: 13
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(46, 125, 50, 0.1)'
        }
      }
    },
    legend: {
      data: ['Inscripciones'],
      top: '5%',
      textStyle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#424242'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.meses || ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      axisLabel: {
        color: '#616161',
        fontSize: 12,
        fontWeight: '500'
      },
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#616161',
        fontSize: 12,
        fontWeight: '500'
      },
      splitLine: {
        lineStyle: {
          color: '#f5f5f5',
          type: 'dashed'
        }
      }
    },
    series: [{
      name: 'Inscripciones',
      type: 'bar',
      data: props.data.valores || [45, 52, 48, 65, 58, 72],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2e7d32' },
          { offset: 1, color: '#7cb342' }
        ]),
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1b5e20' },
            { offset: 1, color: '#558b2f' }
          ])
        }
      },
      barWidth: '50%',
      animationDelay: function (idx) {
        return idx * 100
      }
    }],
    animationEasing: 'elasticOut',
    animationDelayUpdate: function (idx) {
      return idx * 50
    }
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
