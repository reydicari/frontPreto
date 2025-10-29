import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { buscarCiRepetido } from "src/stores/persona-store.js";
dayjs.extend(customParseFormat);

/**
 * @description Un composable de Vue 3 para proporcionar reglas de validación reutilizables para Quasar Framework.
 * Cada función representa una regla que puede ser usada directamente en la propiedad :rules de los componentes de Quasar.
 */
export function useValidation() {
  // --- REGLAS GENERALES Y DE CADENAS ---

  /**
   * @description Verifica si un campo no está vacío.
   * @param {string} val - El valor del campo.
   * @returns {boolean|string} - `true` si es válido, o un mensaje de error.
   */
  const required = (val) => {
    return (
      (!!val && String(val).trim().length > 0) || "Este campo es requerido"
    );
  };

  /**
   * @description Verifica si la longitud de una cadena es mayor o igual a un mínimo.
   * @param {string} val - El valor del campo.
   * @param {number} min - El número mínimo de caracteres.
   * @returns {boolean|string}
   */
  const minLength = (min) => (val) => {
    return (
      String(val).length >= min || `Debe contener al menos ${min} caracteres`
    );
  };

  /**
   * @description Verifica si la longitud de una cadena es menor o igual a un máximo.
   * @param {string} val - El valor del campo.
   * @param {number} max - El número máximo de caracteres.
   * @returns {boolean|string}
   */
  const maxLength = (max) => (val) => {
    return (
      String(val).length <= max ||
      !val ||
      `No debe exceder los ${max} caracteres`
    );
  };

  /**
   * @description Valida un formato de correo electrónico.
   * @param {string} val - El valor del campo.
   * @returns {boolean|string}
   */
  const isEmail = (val) => {
    const emailPattern =
      /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;
    return (
      emailPattern.test(val) ||
      "Por favor, introduce un correo electrónico válido"
    );
  };

  /**
   * @description Verifica si el valor de un campo coincide con el de otro (ej: confirmar contraseña).
   * @param {*} val - El valor del campo actual (ej: confirmación).
   * @param {*} otherVal - El valor del campo original (ej: contraseña).
   * @returns {boolean|string}
   */
  const matchesField = (val, otherVal) => {
    return val === otherVal || "Los campos no coinciden";
  };

  // --- REGLAS NUMÉRICAS ---

  /**
   * @description Verifica si el valor es un número válido.
   * @param {*} val - El valor del campo.
   * @returns {boolean|string}
   */
  const isNumber = (val) => {
    return (
      (!isNaN(parseFloat(val)) && isFinite(val)) || "Debe ser un valor numérico"
    );
  };

  /**
   * @description Verifica si un número es mayor que el valor de otro campo (ej: precio máximo > precio mínimo).
   * @param {number} val - El valor del campo actual (máximo).
   * @param {number} otherVal - El valor del otro campo (mínimo).
   * @returns {boolean|string}
   */
  const isGreaterThan = (val, otherVal) => {
    // Solo valida si ambos campos tienen valores numéricos para evitar errores prematuros
    if ((!val && val !== 0) || (!otherVal && otherVal !== 0)) {
      return true;
    }
    return (
      parseFloat(val) > parseFloat(otherVal) ||
      "Debe ser mayor que el valor mínimo"
    );
  };

  /**
   * @description Verifica si un número se encuentra dentro de un rango (min y max incluidos).
   * @param {number} val - El valor del campo.
   * @param {number} min - El valor mínimo permitido.
   * @param {number} max - El valor máximo permitido.
   * @returns {boolean|string}
   */
  const inRange = (val, min, max) => {
    const numericVal = parseFloat(val);
    if (isNaN(numericVal)) return "Debe ser un valor numérico";
    return (
      (numericVal >= min && numericVal <= max) ||
      `El valor debe estar entre ${min} y ${max}`
    );
  };

  // --- REGLAS DE FECHAS ---

  /**
   * @description Verifica si una cadena es una fecha válida en formato YYYY/MM/DD (formato de Quasar).
   * @param {string} val - La fecha en formato de cadena.
   * @returns {boolean|string}
   */
  const isDate = (val) => {
    // Regex para validar el formato YYYY/MM/DD
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(val))
      return "Formato de fecha inválido (use AAAA/MM/DD)";

    const date = new Date(val);
    const [year, month, day] = val.split("/").map(Number);

    // Verifica que la fecha creada sea coherente (ej: no es 31 de febrero)
    const isValidDate =
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day;

    return (!isNaN(date.getTime()) && isValidDate) || "Fecha inválida";
  };

  /**
   * @description Verifica si una fecha es posterior a otra (ej: fecha de fin > fecha de inicio).
   * @param {string} val - La fecha del campo actual (fecha de fin).
   * @param {string} otherDate - La fecha del otro campo (fecha de inicio).
   * @returns {boolean|string}
   */
  const isAfterDate = (val, otherDate) => {
    // No valida si la fecha de inicio aún no está seleccionada
    if (!val || !otherDate) {
      return true;
    }
    // Compara los objetos Date
    return (
      new Date(val) > new Date(otherDate) ||
      "La fecha debe ser posterior a la fecha de inicio"
    );
  };

  /**
   * @description Verifica que el valor final de un rango sea mayor que el inicial.
   * @param {number} endVal - El valor del campo 'rango final'.
   * @param {number} startVal - El valor del campo 'rango inicial'.
   * @returns {boolean|string}
   */
  const endIsGreaterThanStart = (endVal, startVal) => {
    // Solo valida si ambos tienen valor para evitar errores prematuros
    if ((!endVal && endVal !== 0) || (!startVal && startVal !== 0)) {
      return true;
    }
    return (
      parseFloat(endVal) > parseFloat(startVal) ||
      "El rango final debe ser mayor que el inicial"
    );
  };

  /**
   * @description Verifica que el rango de un item no se cruce con ningún otro en la lista.
   * @param {number} currentIndex - El índice del item actual que se está validando.
   * @param {Array<Object>} list - La lista completa de items (ej: la lista de precios).
   * @returns {boolean|string}
   */
  const noRangeOverlap = (currentIndex, list) => {
    const currentItem = list[currentIndex];
    // Si los valores no son numéricos, otras reglas se encargarán.
    const startA = parseFloat(currentItem.rangoInicial);
    const endA = parseFloat(currentItem.rangoFinal);

    if (isNaN(startA) || isNaN(endA)) {
      return true; // No validar cruce si los datos básicos no están.
    }

    for (let i = 0; i < list.length; i++) {
      // No comparar el item consigo mismo
      if (i === currentIndex) continue;

      const otherItem = list[i];
      const startB = parseFloat(otherItem.rangoInicial);
      const endB = parseFloat(otherItem.rangoFinal);

      if (isNaN(startB) || isNaN(endB)) continue;

      // La condición de cruce es: El inicio de A es antes del final de B Y el final de A es después del inicio de B.
      if (startA < endB && endA > startB) {
        return `Este rango (${startA} - ${endA}) se cruza con otro rango (${startB} - ${endB})`;
      }
    }

    return true; // No se encontraron cruces
  };
  const minValue = (min) => (val) => val >= min || `El valor minimo es ${min}!`;

  const maxValue = (max) => (val) => val <= max || `El valor maximo es ${max}!`;
  const noConsecutiveSpaces = (val) => {
    return (
      !/(\s\s+|^\s+|\s+$)/.test(val) || "No se permiten espacios consecutivos"
    );
  };
  const letrasNumeros = (val) =>
    /^[a-zA-Z0-9]+$/.test(val) ||
    "El nombre solo puede contener letras y números";
  const numberWords = (val, num) => {
    // Limpiar espacios extra y dividir en palabras
    const words = val.trim().split(/\s+/);
    // Verificar cantidad de palabras y que sean válidas
    if (words.length <= num && words) {
      return true;
    }
    return `Solo se permiten hasta ${num} palabras`;
  };
  const noSpaceInString = (val) => {
    return !/\s/.test(val) || "No se permiten espacios";
  };
  const existUsername = async (val) => {
    //validador si existe un usuarios con el mismo nombre deusuario
    //const usuarioStore = useUsuarioStore()
    let response = false;
    if (val && val.length >= 5) {
      //response = await usuarioStore.findUserWizardByUsername(val)
      existUsername.value = response;
    }
    return !response || "El nombre de usuario ya existe elija otro";
  };
  const existCi = async (val) => {
    //validador si existe un usuarios con el mismo carnet de identidad
    let response = false;
    if (val && val.length >= 6) {
      response = await buscarCiRepetido(val);
    }
    return !response.existe || "El carnet de identidad ya existe";
  };
  const noFullSpace = (val) => {
    return (val && val.trim().length > 0) || "No puede contener solo espacios";
  };
  const onlyLetters = (val) => {
    const regex = /^[\p{L}\s]+$/u;
    if (!val) return true;
    return regex.test(val) || "Solo se permiten letras";
  };
  const onlyNumbers = (val) => {
    const regex = /^[0-9]+$/;
    if (!val) return true;
    return regex.test(val) || "Solo se permiten números";
  };
  return {
    minValue,
    maxValue,
    required,
    minLength,
    maxLength,
    isEmail,
    matchesField,
    isNumber,
    isGreaterThan,
    inRange,
    isDate,
    isAfterDate,
    endIsGreaterThanStart,
    noRangeOverlap,
    letrasNumeros,
    onlyLetters,
    numberWords,
    noSpaceInString,
    existUsername,
    noFullSpace,
    noConsecutiveSpaces,
    onlyNumbers,
    existCi,
  };
}

export const required = () => (val) => !!val || "Campo obligatorio!";

export const maxLength = (max) => (val) =>
  (val || "").length <= max || `El numero maximo de caracteres es ${max}!`;

export const minLength = (min) => (val) =>
  (val || "").length >= min || `El numero minimo de caracteres es ${min}!`;

export const exactLength = (ex) => (val) =>
  (val || "").length === ex || `El numero de caracteres necesario es ${ex}!`;

export const numeroCelular = () => (val) =>
  /^[678][0-9]{7}$/.test(val) || "No es un numero de celular valido.";

export const maxValue = (max) => (val) =>
  val <= max || `El valor maximo es ${max}!`;

export const minValue = (min) => (val) =>
  val >= min || `El valor minimo es ${min}!`;

export const isCapacitor = () => process.env.MODE === "capacitor";

export const formDataGen = (data, processArr = false) => {
  const fdata = new FormData();

  for (const prop in data) {
    if (data[prop] instanceof Array) {
      if (processArr)
        for (const it of data[prop]) {
          fdata.append(prop, it);
        }
    } else fdata.append(prop, data[prop]);
  }

  return fdata;
};

const getTimeBetweenDates = (startDate, endDate) => {
  const seconds = Math.floor((endDate - startDate) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return { seconds, minutes, hours, days };
};

export const getLiteralDiffDate = (startDate, endDate) => {
  const diff = getTimeBetweenDates(startDate, endDate);
  if (diff.days > 28) return dayjs(startDate).format("DD/MM/YYYY");
  else if (diff.days < 1) {
    if (diff.hours < 1) {
      if (diff.minutes < 1) {
        return `reciente`;
      } else return `Hace ${diff.minutes} min(s)`;
    } else return `Hace ${diff.hours} hora(s)`;
  } else return `Hace ${diff.days} dia(s)`;
};

export const processDate = (fecha) => {
  if (!fecha) return "Invalid";
  return getLiteralDiffDate(
    dayjs(fecha, "DD/MM/YYYY HH:mm:ss").subtract(4, "hour"),
    new Date(),
  );
};
