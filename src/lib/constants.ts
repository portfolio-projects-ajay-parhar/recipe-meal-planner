export const CUISINES = [
  'African', 'American', 'British', 'Cajun', 'Caribbean',
  'Chinese', 'Eastern European', 'European', 'French', 'German',
  'Greek', 'Indian', 'Irish', 'Italian', 'Japanese',
  'Jewish', 'Korean', 'Latin American', 'Mediterranean',
  'Mexican', 'Middle Eastern', 'Nordic', 'Southern',
  'Spanish', 'Thai', 'Vietnamese',
] as const;

export const DIETS = [
  'Gluten Free', 'Ketogenic', 'Vegetarian', 'Lacto-Vegetarian',
  'Ovo-Vegetarian', 'Vegan', 'Pescetarian', 'Paleo',
  'Primal', 'Low FODMAP', 'Whole30',
] as const;

export const MEAL_TYPES = [
  'main course', 'side dish', 'dessert', 'appetizer',
  'salad', 'bread', 'breakfast', 'soup', 'beverage',
  'sauce', 'marinade', 'fingerfood', 'snack', 'drink',
] as const;

export const INTOLERANCES = [
  'Dairy', 'Egg', 'Gluten', 'Grain', 'Peanut',
  'Seafood', 'Sesame', 'Shellfish', 'Soy',
  'Sulfite', 'Tree Nut', 'Wheat',
] as const;

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'healthiness', label: 'Healthiness' },
  { value: 'time', label: 'Cooking Time' },
  { value: 'calories', label: 'Calories' },
  { value: 'price', label: 'Price' },
] as const;

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
] as const;

export const MEAL_TYPE_ORDER = [
  'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK',
] as const;
