// Composable para iniciar una guía interactiva usando driver.js (Driver)
// Uso: const { startPosicionesTour, attachToIcon } = useDrive()
// startPosicionesTour() -> inicia la guía para la tabla de posiciones
// attachToIcon(selector) -> añade listener click a un icono para disparar la guía
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function useDrive() {
  // Inicia la guía para la tabla de posiciones usando la API factory `driver()`
  async function startPosicionesTour(
    targetSelector = ".standings-table",
    mode = undefined,
  ) {
    // Si se recibe un Event (p. ej. por binding directo @click), ignorarlo
    try {
      if (typeof Event !== "undefined" && targetSelector instanceof Event) {
        targetSelector = ".standings-table";
      }
    } catch {
      // ignore environments without Event
    }
    try {
      const config = {
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0,0,0,0.6)",
        closeBtnText: "Cerrar",
        nextBtnText: "Siguiente",
        prevBtnText: "Anterior",
        doneBtnText: "Listo",
        allowClose: true,
        overlayClickNext: false,
      };

      const drv = driver(config);

      // Esperar a que el DOM esté completamente renderizado
      const waitForElement = async (selector, maxAttempts = 50) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const element = document.querySelector(selector);
          if (element) return element;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`Elemento no encontrado: ${selector}`);
      };

      // Primero esperar a que la tabla exista
      await waitForElement(targetSelector);

      const mainTitle =
        mode === "tipo4"
          ? "Tabla de Posiciones (Tipo desafío - Victorias)"
          : "Tabla de Posiciones";
      const mainDesc =
        mode === "tipo4"
          ? "En este torneo la clasificación se basa en número de victorias. Las empates no cuentan. La tabla muestra Partidos Jugados, Goles, Diferencia y el total de victorias (VICTS)."
          : "Aquí se muestra la clasificación: cada victoria suma 3 puntos, empate 1 punto, derrota 0 puntos. La tabla resume Partidos jugados, victorias, empates, derrotas, goles, diferencia y puntos.";

      const steps = [
        {
          element: targetSelector,
          popover: {
            title: mainTitle,
            description: mainDesc,
            side: "bottom",
            align: "start",
          },
        },
      ];

      // Definir las columnas a explicar - usando las clases exactas que tienes
      // Column definitions adapt según el modo. Para 'tipo4' incluimos la columna VICTS
      let columns = [];
      if (mode === "tipo4") {
        columns = [
          {
            cls: "PJ",
            title: "PJ",
            text: "Partidos Jugados: total de partidos contabilizados para el equipo.",
          },
          {
            cls: "GF",
            title: "GF",
            text: "Goles a Favor: total de goles marcados por el equipo.",
          },
          {
            cls: "GC",
            title: "GC",
            text: "Goles en Contra: total de goles recibidos por el equipo.",
          },
          {
            cls: "DG",
            title: "DG",
            text: "Diferencia de Goles: GF - GC (criterio de desempate secundario).",
          },
          {
            cls: "VICTS",
            title: "VICTS",
            text: "Victorias: número de partidos ganados (criterio principal de clasificación en torneos tipo desafio).",
          },
        ];
      } else {
        columns = [
          {
            cls: "PJ",
            title: "PJ",
            text: "Partidos Jugados: total de partidos contabilizados para el equipo.",
          },
          {
            cls: "G",
            title: "G",
            text: "Ganados: número de victorias (3 puntos cada una).",
          },
          {
            cls: "E",
            title: "E",
            text: "Empates: número de empates (1 punto cada uno).",
          },
          {
            cls: "P",
            title: "P",
            text: "Perdidos: número de derrotas (0 puntos).",
          },
          {
            cls: "GF",
            title: "GF",
            text: "Goles a Favor: total de goles marcados por el equipo.",
          },
          {
            cls: "GC",
            title: "GC",
            text: "Goles en Contra: total de goles recibidos por el equipo.",
          },
          {
            cls: "DG",
            title: "DG",
            text: "Diferencia de Goles: GF - GC (criterio de desempate secundario).",
          },
          {
            cls: "PTS",
            title: "PTS",
            text: "Puntos: total (3 × Ganados + 1 × Empates).",
          },
        ];
      }

      // Buscar cada elemento por su clase específica
      for (const column of columns) {
        const selector = `${targetSelector} th.${column.cls}`;
        try {
          const element = await waitForElement(selector);
          steps.push({
            element: element,
            popover: {
              title: column.title,
              description: column.text,
              side: "bottom",
              align: "start",
            },
          });
        } catch (error) {
          console.log(error);
          console.log(`No se pudo encontrar el elemento para: ${selector}`);
          // Si no encuentra el elemento específico, añadir un paso sin elemento
          steps.push({
            popover: {
              title: column.title,
              description: `${column.text} (Columna no visible en este momento)`,
            },
          });
        }
      }

      // Configurar y iniciar el tour
      drv.setSteps(steps);
      drv.drive();

      return drv;
    } catch (err) {
      console.warn("No se pudo iniciar la guía interactiva:", err);
      if (typeof window !== "undefined") {
        window.alert(
          "Guía interactiva no disponible. Asegúrate de que la tabla de posiciones esté cargada correctamente.",
        );
      }
      return null;
    }
  }

  function attachToIcon(iconSelector = ".help-posiciones") {
    if (typeof document === "undefined") return;

    // Esperar a que el DOM esté listo
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        const el = document.querySelector(iconSelector);
        if (el) {
          el.addEventListener("click", (ev) => {
            ev.preventDefault();
            startPosicionesTour().catch(() => {});
          });
        }
      });
    } else {
      const el = document.querySelector(iconSelector);
      if (el) {
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          startPosicionesTour().catch(() => {});
        });
      }
    }
  }

  return { startPosicionesTour, attachToIcon };
}

export default useDrive;
