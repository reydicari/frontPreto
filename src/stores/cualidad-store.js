import { api } from "boot/axios.js";

const URL_PART = "/api/cualidad";

// Intenta obtener las cualidades desde el backend; si falla, devuelve datos de fallback
export const listar = async (params = {}) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar cualidades desde API, devolviendo fallback",
      error?.response || error,
    );
    // Fallback para desarrollo / pruebas
    return [
      { id: 1, nombre: "Técnica" },
      { id: 2, nombre: "Actitud" },
      { id: 3, nombre: "Puntualidad" },
    ];
  }
};
