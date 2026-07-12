import { Injectable, computed, signal } from '@angular/core';

export type ApplicationLanguage = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'beer-designer.language';

const ENGLISH_UI: Record<string, string> = {
  Recetas: 'Recipes',
  Ingredientes: 'Ingredients',
  Perfiles: 'Profiles',
  'Tu espacio de elaboración': 'Your brewing workspace',
  'Buenas recetas empiezan con un buen plan.': 'Great recipes start with a good plan.',
  'Revisa lo último, prepara el próximo lote y sigue creando.':
    'Review recent work, prepare the next batch and keep creating.',
  'Nueva receta': 'New recipe',
  'Planificar elaboración': 'Plan brew day',
  'Recetas recientes': 'Recent recipes',
  'Continúa donde lo dejaste': 'Continue where you left off',
  'Ver todas': 'View all',
  'Próximos 7 días': 'Next 7 days',
  'Agenda de elaboración': 'Brewing schedule',
  'Abrir agenda': 'Open schedule',
  'Agenda despejada': 'Schedule clear',
  'No hay elaboraciones programadas para los próximos 60 días.':
    'No brew days are scheduled for the next 60 days.',
  'Programar un lote': 'Schedule a batch',
  'Biblioteca local': 'Local library',
  'Organiza y mueve tus recetas arrastrando las tarjetas.':
    'Organize and move recipes by dragging their cards.',
  'Nueva carpeta': 'New folder',
  'Arrastrar carpeta': 'Drag folder',
  Renombrar: 'Rename',
  Eliminar: 'Delete',
  'Arrastrar receta': 'Drag recipe',
  Receta: 'Recipe',
  'Estilo sin identificar': 'Unidentified style',
  'Suelta aquí una receta': 'Drop a recipe here',
  'Esta carpeta está vacía.': 'This folder is empty.',
  'Guía de referencia': 'Reference guide',
  'Consulta parámetros, perfiles sensoriales y categorías sin salir de tu espacio de trabajo.':
    'Browse parameters, sensory profiles and categories without leaving your workspace.',
  'Diseñar una receta': 'Design a recipe',
  'Buscar estilo': 'Search styles',
  Categoría: 'Category',
  'Todas las categorías': 'All categories',
  'estilos encontrados': 'styles found',
  Todos: 'All',
  'No hay estilos con esos filtros': 'No styles match these filters',
  'Prueba con otra categoría o búsqueda.': 'Try another category or search.',
  'Catálogo editable': 'Editable catalog',
  'Nuevo ingrediente': 'New ingredient',
  'Tipo de ingrediente': 'Ingredient type',
  Lúpulos: 'Hops',
  Maltas: 'Malts',
  Levaduras: 'Yeasts',
  Adjuntos: 'Adjuncts',
  Sales: 'Salts',
  'Buscar ingrediente': 'Search ingredients',
  'Nombre, marca, ID o distribuidor...': 'Name, brand, ID or supplier...',
  'Importar XML': 'Import XML',
  'Sin coincidencias': 'No matches',
  'Prueba con otro nombre, marca, ID o distribuidor.': 'Try another name, brand, ID or supplier.',
  Guardar: 'Save',
  Nombre: 'Name',
  Marca: 'Brand',
  País: 'Country',
  Tipo: 'Type',
  Formato: 'Format',
  Descripción: 'Description',
  Distribuidor: 'Supplier',
  'URL distribuidor': 'Supplier URL',
  Laboratorio: 'Laboratory',
  'Perfil sensorial': 'Sensory profile',
  'Uso recomendado': 'Recommended use',
  'Configuración cervecera': 'Brewing configuration',
  'Guarda configuraciones reutilizables para tu equipo y tus procesos.':
    'Save reusable configurations for your equipment and processes.',
  'Nuevo perfil': 'New profile',
  'Tipos de perfil': 'Profile types',
  Equipos: 'Equipment',
  Macerado: 'Mash',
  Carbonatación: 'Carbonation',
  Fermentación: 'Fermentation',
  'Perfil editable': 'Editable profile',
  Duplicar: 'Duplicate',
  Notas: 'Notes',
  'Herramientas de elaboración': 'Brewing tools',
  'Calculadoras cerveceras': 'Brewing calculators',
  'Alcohol y atenuación': 'Alcohol and attenuation',
  'Corrección de densidad': 'Gravity correction',
  Hidrómetro: 'Hydrometer',
  'Volumen + gravedad': 'Volume + gravity',
  'Estima ABV, atenuación aparente y puntos fermentados.':
    'Estimate ABV, apparent attenuation and fermented points.',
  'Ajusta una lectura tomada a temperatura distinta de calibración.':
    'Correct a reading taken at a temperature different from calibration.',
  'Calcula gramos aproximados de azúcar para botella o barril.':
    'Calculate approximate priming sugar for bottles or kegs.',
  'Calcula agua a añadir para alcanzar una densidad objetivo.':
    'Calculate the water needed to reach a target gravity.',
  'Alcohol y atenuación aparente': 'Alcohol and apparent attenuation',
  'Densidad inicial OG': 'Original gravity OG',
  'Densidad final FG': 'Final gravity FG',
  'ABV estimado': 'Estimated ABV',
  'Atenuación aparente': 'Apparent attenuation',
  'Puntos fermentados': 'Fermented points',
  'Corrección de densidad por temperatura': 'Temperature gravity correction',
  'Lectura observada': 'Observed reading',
  'Temperatura muestra C': 'Sample temperature C',
  'Calibración hidrómetro C': 'Hydrometer calibration C',
  'Densidad corregida': 'Corrected gravity',
  Diferencia: 'Difference',
  'Azúcar de carbonatación': 'Priming sugar',
  'Volumen cerveza L': 'Beer volume L',
  'Temperatura cerveza C': 'Beer temperature C',
  'CO2 objetivo vol': 'Target CO2 vol',
  Azúcar: 'Sugar',
  Sacarosa: 'Sucrose',
  Dextrosa: 'Dextrose',
  'Azúcar total': 'Total sugar',
  'Azúcar por litro': 'Sugar per litre',
  'CO2 residual': 'Residual CO2',
  'CO2 a generar': 'CO2 to generate',
  'Dilución de mosto': 'Wort dilution',
  'Volumen actual L': 'Current volume L',
  'Densidad actual': 'Current gravity',
  'Densidad objetivo': 'Target gravity',
  'Agua a añadir': 'Water to add',
  'Volumen final': 'Final volume',
  'Eficiencia de macerado': 'Mash efficiency',
  'Volumen mosto L': 'Wort volume L',
  Densidad: 'Gravity',
  'Grano total kg': 'Total grain kg',
  'Potencial medio': 'Average potential',
  Eficiencia: 'Efficiency',
  'Puntos recogidos': 'Collected points',
  'Puntos teóricos': 'Potential points',
  'Agenda y hoja de elaboración': 'Schedule and brew sheet',
  'Día de elaboración': 'Brew day',
  'Mostrar agenda': 'Show schedule',
  'Minimizar agenda': 'Minimize schedule',
  'Nueva elaboración': 'New brew day',
  'Eliminar elaboración': 'Delete brew day',
  'Imprimir hoja': 'Print sheet',
  'Guardar hoja': 'Save sheet',
  'Número de lote': 'Batch number',
  Fecha: 'Date',
  Inicio: 'Start',
  Fin: 'End',
  Estado: 'Status',
  Responsable: 'Brewer',
  Título: 'Title',
  'Objetivos y resultados': 'Targets and results',
  'Agua y pH': 'Water and pH',
  'Maltas y adjuntos': 'Malts and fermentables',
  'Adjuntos y adiciones de proceso': 'Adjuncts and process additions',
  'Levaduras e inoculación': 'Yeasts and pitching',
  'Registro de proceso': 'Process log',
  'Plan posterior': 'Post-brew plan',
  Añadir: 'Add',
  'Añadir tarea': 'Add task',
  'Notas generales': 'General notes',
  Ingrediente: 'Ingredient',
  'Lote proveedor': 'Supplier batch',
  Observaciones: 'Notes',
  Uso: 'Use',
  Unidad: 'Unit',
  Cantidad: 'Amount',
  Versión: 'Version',
  'Escalar receta': 'Scale recipe',
  'Eliminar receta': 'Delete recipe',
  'Guardar receta': 'Save recipe',
  'Datos base y selector BJCP': 'Recipe basics and BJCP selector',
  'Selector de maltas': 'Malt selector',
  'Añadir malta': 'Add malt',
  'Lúpulos, adjuntos y plan de hervido': 'Hops, adjuncts and boil schedule',
  'Añadir lúpulo': 'Add hop',
  'Añadir adjunto': 'Add adjunct',
  'Añadir levadura': 'Add yeast',
  'Perfil y tratamiento de agua': 'Water profile and treatment',
  'Agua base': 'Base water',
  'Plan de macerado': 'Mash schedule',
  'Plan de hervido': 'Boil schedule',
  'Añadir paso': 'Add step',
  'Plan de fermentación por etapas': 'Fermentation schedule',
  'Dry hop y maduración': 'Dry hop and conditioning',
  'Maduración y envasado': 'Conditioning and packaging',
  'Etiqueta o imagen de la cerveza': 'Beer label or image',
  'Resumen final': 'Final summary',
  'Color SRM': 'SRM colour',
  Vaso: 'Glassware',
  'Vaso de Sidra Asturiana': 'Asturian Cider Glass',
  'Comparación BJCP': 'BJCP comparison',
  Cancelar: 'Cancel',
  Quitar: 'Remove',
};

const SHELL_TRANSLATIONS = {
  es: {
    subtitle: 'Recetas BJCP',
    dashboard: 'Dashboard',
    recipes: 'Recetas',
    brewing: 'Elaboración',
    ingredients: 'Ingredientes',
    profiles: 'Perfiles',
    styles: 'Estilos BJCP',
    calculators: 'Calculadoras',
    applicationMenu: 'Menú de aplicación',
    settings: 'Configuración',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    currentLanguage: 'Idioma actual',
    closeNotification: 'Cerrar notificación',
  },
  en: {
    subtitle: 'BJCP Recipes',
    dashboard: 'Dashboard',
    recipes: 'Recipes',
    brewing: 'Brewing',
    ingredients: 'Ingredients',
    profiles: 'Profiles',
    styles: 'BJCP Styles',
    calculators: 'Calculators',
    applicationMenu: 'Application menu',
    settings: 'Settings',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    currentLanguage: 'Current language',
    closeNotification: 'Dismiss notification',
  },
} as const;

export type ShellTranslationKey = keyof typeof SHELL_TRANSLATIONS.es;

@Injectable({ providedIn: 'root' })
export class ApplicationSettingsService {
  readonly language = signal<ApplicationLanguage>(this.readLanguage());
  readonly text = computed(() => SHELL_TRANSLATIONS[this.language()]);

  constructor() {
    this.applyDocumentLanguage(this.language());
  }

  setLanguage(language: ApplicationLanguage): void {
    this.language.set(language);
    try {
      globalThis.localStorage?.setItem?.(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The preference remains active for this session when storage is unavailable.
    }
    this.applyDocumentLanguage(language);
  }

  translate(source: string): string {
    return this.language() === 'en' ? (ENGLISH_UI[source] ?? source) : source;
  }

  private readLanguage(): ApplicationLanguage {
    try {
      const stored = globalThis.localStorage?.getItem?.(LANGUAGE_STORAGE_KEY);
      return stored === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  }

  private applyDocumentLanguage(language: ApplicationLanguage): void {
    document.documentElement.lang = language;
  }
}
