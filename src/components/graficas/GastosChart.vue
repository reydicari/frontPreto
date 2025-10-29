<template>
  <div ref="chartContainer" style="width: 100%; height: 100%;"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const chartContainer = ref(null)

onMounted(() => {
  const chart = echarts.init(chartContainer.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['Materiales', 'Salarios', 'Servicios', 'Mantenimiento', 'Otros']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [1200, 3500, 800, 450, 300],
      type: 'bar',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      },
      itemStyle: {
        color: function(params) {
          const colorList = ['#c23531','#2f4554','#61a0a8','#d48265','#91c7ae']
          return colorList[params.dataIndex]
        }
      }
    }]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
})
</script>
