import type { en } from "./en";

export const es: typeof en = {
  "api": {
    "generic_error": "Algo salió mal.",
    "field_name": "nombre",
    "field_description": "descripción",
    "field_ingredients": "ingredientes",
    "field_preferred_days": "días preferidos",
    "field_quantity": "cantidad",
    "field_unit": "unidad",
    "network_error": "No se pudo conectar. Intenta de nuevo."
  },
  "app": {
    "not_found": {
      "title": "Página no encontrada",
      "help": "Esta página no existe. Vuelve a tu menú semanal.",
      "go_to_menu": "Ir a mi menú"
    },
    "title": "Comal — Planificador de comidas",
    "description": "Planea una semana deliciosa, una comida a la vez."
  },
  "app_header": {
    "home": "Inicio de Comal",
    "planning": "Planeando",
    "plan_week": "Planear semana",
    "open_actions": "Abrir acciones",
    "actions": "Acciones",
    "add_meal_action": "Agregar una comida",
    "language": "Idioma"
  },
  "common": {
    "close": "Cerrar",
    "demo_mode": "Modo de demostración · conecta la API de Rails para usar tus propias comidas.",
    "try_again": "Intentar de nuevo",
    "collection": "Tu colección",
    "edit": "Editar",
    "optional": "(opcional)",
    "cancel": "Cancelar",
    "saving": "Guardando…",
    "edit_name": "Editar %{name}",
    "weekly_table": "Tu mesa semanal",
    "ingredients": "Ingredientes"
  },
  "ingredients": {
    "form": {
      "ingredient_required": "Escribe el nombre del ingrediente.",
      "ingredient_example": "p. ej., Tomate",
      "rename_ingredient_help": "Cambiar el nombre de este ingrediente lo actualiza en todas las comidas que lo usan.",
      "meals_using": "Comidas que usan este ingrediente",
      "unused_ingredient": "Aún no se usa en ninguna comida.",
      "deleting": "Eliminando…",
      "delete_ingredient": "Eliminar ingrediente",
      "save_ingredient": "Guardar ingrediente",
      "edit_ingredient": "Editar ingrediente",
      "add_ingredient_title": "Agregar ingrediente",
      "name": "Nombre del ingrediente"
    },
    "screen": {
      "add_ingredient": "+ Agregar ingrediente",
      "unused_badge": "Aún no se usa en ninguna comida",
      "ingredients_intro": "Consulta y administra los ingredientes de tus comidas.",
      "search_ingredients": "Buscar ingredientes",
      "ingredient_catalog": "Catálogo de ingredientes",
      "no_ingredients_found": "No se encontraron ingredientes",
      "no_ingredients": "Aún no hay ingredientes",
      "try_search": "Prueba otra búsqueda.",
      "first_ingredient": "Agrega tu primer ingrediente aquí o al crear una comida.",
      "clear_search": "Limpiar búsqueda",
      "loading_ingredients_label": "Cargando ingredientes",
      "loading_ingredients": "Cargando ingredientes…",
      "count": {
        "one": "%{shown} de %{count} ingrediente",
        "other": "%{shown} de %{count} ingredientes"
      },
      "load_error": "No se pudieron cargar los ingredientes.",
      "retry": "Reintentar ingredientes"
    },
    "usage": {
      "one": "Se usa en %{count} comida",
      "other": "Se usa en %{count} comidas"
    }
  },
  "meals": {
    "details": {
      "preferred_days_prefix": "Días preferidos: ",
      "no_meal_ingredients": "Aún no se han agregado ingredientes.",
      "open_recipe": "Abrir receta",
      "edit_meal": "Editar comida",
      "loading_meal": "Cargando comida…",
      "load_meal_error": "No se pudo cargar la comida.",
      "retry_meal": "Reintentar comida"
    },
    "dialog": {
      "loading_options": "Cargando opciones de comida…",
      "new_favorite": "Un nuevo favorito",
      "add_to_library": "Agrega a tu colección",
      "update_library": "Actualiza tu colección",
      "on_table": "En tu mesa",
      "in_library": "En tu colección"
    },
    "form": {
      "meal_required": "Agrega un nombre, una descripción y al menos un horario de comida.",
      "ingredient_selection_required": "Elige un ingrediente o selecciona Crear para cada nombre escrito.",
      "ingredient_amount_required": "Completa la cantidad y la unidad de cada ingrediente.",
      "name": "Nombre de la comida",
      "meal_example": "p. ej., Tacos de papa",
      "description": "Descripción",
      "description_help": "¿Qué la hace deliciosa?",
      "recipe_url": "Enlace de la receta",
      "meal_time": "Horario de comida",
      "update_meal": "Actualizar comida",
      "save_meal": "Guardar comida"
    },
    "ingredient_manager": {
      "add_ingredient": "+ Agregar ingrediente",
      "ingredient_help": "Agrega lo que necesitas para preparar esta comida.",
      "choose_ingredient_help": "Elige un ingrediente o selecciona Crear para agregar uno.",
      "load_ingredients_error": "No se pudieron cargar los ingredientes.",
      "retry_ingredients": "Reintentar ingredientes",
      "ingredient_name": "Nombre del ingrediente",
      "choose_or_create": "Elegir o crear",
      "quantity": "Cantidad",
      "quantity_short": "Cant.",
      "unit": "Unidad",
      "preparation_note": "Nota de preparación",
      "note_optional": "Nota (opcional)",
      "remove_ingredient": "Quitar %{name}",
      "ingredient": "ingrediente",
      "create_ingredient": "Crear ingrediente “%{name}”",
      "empty_options": "No se encontraron opciones.",
      "loading_options_list": "Cargando opciones…",
      "creating_option": "Creando opción…",
      "create_option_error": "No se pudo crear la opción.",
      "options_available": {
        "one": "%{count} opción disponible.",
        "other": "%{count} opciones disponibles."
      },
      "can_create_option": "También puedes crear una opción."
    },
    "preferred_days": {
      "preferred_days": "Días preferidos",
      "select_all": "Seleccionar todos",
      "clear_all": "Limpiar todos",
      "preferred_days_help": "Prefiere estos días. Déjalo vacío para permitir cualquier día.",
      "any_day": "Cualquier día",
      "workweek": "Entre semana (lunes a jueves)",
      "weekend": "Fin de semana (viernes a domingo)"
    },
    "row": {
      "view_meal": "Ver %{type}: %{name}"
    },
    "screen": {
      "meal_library": "Tu colección de comidas",
      "search_meals": "Buscar comidas",
      "add_meal": "+ Agregar comida",
      "all_meals": "Todas las comidas",
      "no_meals": "No se encontraron comidas.",
      "try_meals": "Prueba otra búsqueda o agrega algo nuevo.",
      "loading_meals_label": "Cargando comidas",
      "loading_meals": "Cargando comidas…"
    }
  },
  "menu": {
    "day_card": {
      "today": "Hoy",
      "day_number": "Día %{number}"
    },
    "hero": {
      "next_menu": "Tu próximo menú",
      "finding_menu": "Buscando tu menú…",
      "menu_intro": "Un poco de orden y mucho sabor. Planea una semana de desayunos, comidas y cenas con tus recetas.",
      "today": "Menú de hoy",
      "no_today": "No hay un plan para hoy.",
      "week_planned": "Tu semana, planeada.",
      "fresh_week": "Planea una nueva semana para llevar algo delicioso a la mesa.",
      "browse_or_plan": "Consulta tu menú guardado abajo o planea una nueva semana.",
      "make_week": "Haz que esta semana",
      "delicious": "sea deliciosa."
    },
    "notices": {
      "preference_fallback": "Fue necesario ajustar algunas preferencias de días."
    },
    "saved": {
      "saved_intro": "Consulta tus próximos planes, el menú de esta semana y las semanas anteriores.",
      "loading_saved": "Cargando menús guardados…",
      "no_saved": "Aún no hay menús guardados",
      "saved_help": "Tus planes semanales aparecerán aquí cuando se guarden.",
      "saved_weeks": "Semanas guardadas",
      "upcoming": "Próximo",
      "current": "Actual",
      "past": "Anterior"
    },
    "screen": {
      "no_current_week": "No hay un plan para esta semana.",
      "browse_plans_help": "Consulta tus planes próximos y anteriores en Menús guardados.",
      "browse_saved": "Ver menús guardados",
      "weekly_menu": "Menú semanal"
    }
  },
  "navigation": {
    "primary_navigation": "Navegación principal",
    "my_menu": "Mi menú",
    "my_menu_mobile": "Mi menú",
    "my_meals": "Mis comidas",
    "my_meals_mobile": "Mis comidas",
    "my_ingredients": "Mis ingredientes",
    "saved_menus": "Menús guardados"
  },
  "reference": {
    "meal_types": {
      "breakfast": "Desayuno",
      "lunch": "Comida",
      "dinner": "Cena"
    },
    "weekdays": {
      "monday": "Lunes",
      "tuesday": "Martes",
      "wednesday": "Miércoles",
      "thursday": "Jueves",
      "friday": "Viernes",
      "saturday": "Sábado",
      "sunday": "Domingo"
    },
    "units": {
      "g": "g",
      "kg": "kg",
      "ml": "ml",
      "l": "l",
      "pieza": "piezas",
      "taza": "tazas",
      "cucharada": "cucharadas",
      "cucharadita": "cucharaditas",
      "diente": "dientes"
    }
  }
};
