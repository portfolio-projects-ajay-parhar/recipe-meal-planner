import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/* ---------- helpers: build Spoonacular-shaped JSON ---------- */

let ingId = 100000;
function ing(name: string, aisle: string, amount: number, unit: string) {
  ingId += 1;
  return {
    id: ingId,
    aisle,
    name,
    nameClean: name.toLowerCase(),
    original: `${amount} ${unit} ${name}`,
    originalName: name,
    amount,
    unit,
    measures: {
      us: { amount, unitShort: unit, unitLong: unit },
      metric: { amount, unitShort: unit, unitLong: unit },
    },
  };
}

function nutrition(calories: number, protein: number, fat: number, carbs: number) {
  const total = protein * 4 + fat * 9 + carbs * 4 || 1;
  const pct = (grams: number, mult: number) => Math.round(((grams * mult) / total) * 100);
  return {
    nutrients: [
      { name: 'Calories', amount: calories, unit: 'kcal', percentOfDailyNeeds: Math.round((calories / 2000) * 100) },
      { name: 'Protein', amount: protein, unit: 'g', percentOfDailyNeeds: pct(protein, 4) },
      { name: 'Fat', amount: fat, unit: 'g', percentOfDailyNeeds: pct(fat, 9) },
      { name: 'Carbohydrates', amount: carbs, unit: 'g', percentOfDailyNeeds: pct(carbs, 4) },
    ],
    caloricBreakdown: {
      percentProtein: pct(protein, 4),
      percentFat: pct(fat, 9),
      percentCarbs: pct(carbs, 4),
    },
  };
}

// [title, cuisines, dishTypes, diets, readyInMinutes, servings, summary,
//  instructions, ingredients: [name, aisle, amount, unit][], nutrition: [cal, p, f, c]]
type RecipeTuple = [
  number, string, string[], string[], string[], number, number, string, string,
  [string, string, number, string][], [number, number, number, number]
];

const RECIPE_TUPLES: RecipeTuple[] = [
  [716429, 'Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs',
    ['Italian'], ['lunch', 'main course', 'dinner'], ['vegetarian'], 45, 2,
    'A quick vegetarian pasta tossed with roasted cauliflower, garlic, scallions and toasted breadcrumbs.',
    '1. Cook pasta according to package directions.\n2. Roast cauliflower with olive oil until golden.\n3. Toss pasta with garlic, scallions and cauliflower.\n4. Top with toasted breadcrumbs and serve.',
    [['Spaghetti', 'Pasta and Rice', 8, 'oz'], ['Cauliflower', 'Produce', 1, 'head'], ['Garlic', 'Produce', 3, 'cloves'], ['Scallions', 'Produce', 4, 'stalks'], ['Breadcrumbs', 'Bakery/Bread', 0.5, 'cup']],
    [584, 19, 22, 78]],
  [715538, 'Bruschetta Style Pork & Pasta',
    ['Italian'], ['lunch', 'main course', 'dinner'], [], 35, 4,
    'Skillet pork served over pasta with a fresh tomato-basil bruschetta topping.',
    '1. Season and sear pork chops.\n2. Cook pasta until al dente.\n3. Combine tomatoes, basil and olive oil.\n4. Serve pork over pasta topped with bruschetta mix.',
    [['Pork Chops', 'Meat', 1, 'lb'], ['Penne Pasta', 'Pasta and Rice', 12, 'oz'], ['Cherry Tomatoes', 'Produce', 2, 'cups'], ['Fresh Basil', 'Produce', 0.25, 'cup']],
    [512, 34, 18, 52]],
  [644387, 'Chunky Chicken Vegetable Soup',
    ['American'], ['lunch', 'soup', 'dinner'], ['gluten free', 'dairy free'], 40, 6,
    'Hearty chicken soup loaded with carrots, celery and potatoes in a savory broth.',
    '1. Saute onions, carrots and celery.\n2. Add broth, potatoes and chicken.\n3. Simmer 25 minutes until vegetables are tender.\n4. Shred chicken and stir back in.',
    [['Chicken Breast', 'Meat', 1, 'lb'], ['Carrots', 'Produce', 3, 'medium'], ['Celery', 'Produce', 3, 'stalks'], ['Yukon Gold Potatoes', 'Produce', 2, 'cups'], ['Chicken Broth', 'Soups', 6, 'cups']],
    [289, 27, 6, 31]],
  [663157, 'Sheet Pan Salmon with Asparagus',
    ['American'], ['dinner', 'main course'], ['gluten free', 'ketogenic', 'pescatarian'], 25, 2,
    'One-pan weeknight salmon roasted alongside lemony asparagus.',
    '1. Preheat oven to 400F.\n2. Place salmon and asparagus on a sheet pan.\n3. Drizzle with olive oil and lemon.\n4. Roast 12-15 minutes.',
    [['Salmon Fillets', 'Seafood', 2, 'fillets'], ['Asparagus', 'Produce', 1, 'lb'], ['Lemon', 'Produce', 1, 'whole'], ['Olive Oil', 'Oil, Vinegar, Salad Dressing', 2, 'tbsp']],
    [421, 36, 27, 7]],
];

RECIPE_TUPLES.push(
  [654959, 'Avocado Toast with Poached Egg',
    ['American'], ['breakfast', 'brunch'], ['vegetarian'], 15, 1,
    'Crusty sourdough topped with smashed avocado, chili flakes and a perfectly poached egg.',
    '1. Toast bread.\n2. Smash avocado with salt and lemon.\n3. Poach egg 3 minutes.\n4. Assemble and season with chili flakes.',
    [['Sourdough Bread', 'Bakery/Bread', 2, 'slices'], ['Avocado', 'Produce', 1, 'whole'], ['Egg', 'Dairy and Eggs', 2, 'eggs'], ['Red Pepper Flakes', 'Spices and Seasonings', 1, 'tsp']],
    [380, 16, 24, 26]],
  [660306, 'Vegetable Stir Fry with Tofu',
    ['Asian'], ['dinner', 'lunch', 'main course'], ['vegan', 'vegetarian', 'dairy free'], 30, 3,
    'Crispy tofu and colorful vegetables wok-tossed in a ginger-soy sauce.',
    '1. Press and cube tofu, pan-fry until crisp.\n2. Stir fry bell peppers, broccoli and snap peas.\n3. Add ginger-soy sauce and toss.\n4. Serve over rice.',
    [['Firm Tofu', 'Refrigerated', 14, 'oz'], ['Broccoli', 'Produce', 2, 'cups'], ['Bell Peppers', 'Produce', 2, 'whole'], ['Snap Peas', 'Produce', 1, 'cup'], ['Soy Sauce', 'Ethnic Foods', 3, 'tbsp']],
    [345, 21, 14, 36]],
  [637999, 'Classic Beef Tacos',
    ['Mexican'], ['dinner', 'lunch'], [], 25, 4,
    'Weeknight beef tacos with lettuce, cheddar and salsa in crunchy shells.',
    '1. Brown ground beef with taco seasoning.\n2. Warm taco shells.\n3. Fill shells with beef and toppings.',
    [['Ground Beef', 'Meat', 1, 'lb'], ['Taco Shells', 'Bakery/Bread', 8, 'shells'], ['Shredded Lettuce', 'Produce', 2, 'cups'], ['Cheddar Cheese', 'Dairy and Eggs', 1, 'cup'], ['Salsa', 'Canned and Jarred', 1, 'cup']],
    [467, 26, 24, 35]],
  [632857, 'Berry Banana Smoothie Bowl',
    [], ['breakfast', 'snack'], ['vegan', 'vegetarian', 'gluten free', 'dairy free'], 10, 2,
    'Thick blended smoothie bowl topped with fresh berries, banana slices and granola.',
    '1. Blend frozen berries, banana and almond milk.\n2. Pour into bowls.\n3. Top with berries, banana and granola.',
    [['Frozen Mixed Berries', 'Frozen', 2, 'cups'], ['Banana', 'Produce', 2, 'whole'], ['Almond Milk', 'Dairy and Eggs', 0.5, 'cup'], ['Granola', 'Cereal', 0.5, 'cup']],
    [265, 5, 6, 51]],
);

function buildRecipe([id, title, cuisines, dishTypes, diets, minutes, servings, summary, instructions, ingredients, nut]: RecipeTuple) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id, title,
    image: `https://img.spoonacular.com/recipes/${id}-636x393.jpg`,
    imageType: 'jpg',
    servings, readyInMinutes: minutes,
    sourceUrl: `https://spoonacular.com/recipes/${slug}-${id}`,
    summary, instructions, cuisines, dishTypes, diets,
    extendedIngredients: ingredients.map(([n, a, amt, u]) => ing(n, a, amt, u)) as any,
    nutrition: nutrition(...nut) as any,
    cachedAt: new Date(),
  };
}

function mondayOfWeek(offsetWeeks = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  d.setDate(d.getDate() + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding database...');

  // Wipe all tables in FK-safe order
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.mealPlanEntry.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.cachedRecipe.deleteMany();
  await prisma.user.deleteMany();

  // Users (password for all: "password123")
  const passwordHash = await bcrypt.hash('password123', 12);
  const [demo, alex, sam] = await Promise.all([
    prisma.user.create({ data: { email: 'demo@example.com', name: 'Demo Chef', passwordHash, emailVerified: new Date() } }),
    prisma.user.create({ data: { email: 'alex@example.com', name: 'Alex Kim', passwordHash } }),
    prisma.user.create({ data: { email: 'sam@example.com', name: 'Sam Lee', passwordHash } }),
  ]);
  console.log(`Users: ${[demo, alex, sam].map((u) => u.email).join(', ')}`);

  // Account + Session rows (app uses JWT strategy; seeded so every model has data)
  await prisma.account.create({
    data: { userId: demo.id, type: 'oauth', provider: 'google', providerAccountId: 'seed-google-demo', access_token: 'seed-access-token', token_type: 'Bearer', scope: 'openid email profile' },
  });
  await prisma.session.create({
    data: { userId: demo.id, sessionToken: 'seed-session-token', expires: new Date(Date.now() + 30 * 86400000) },
  });

  // Recipes (fresh cachedAt so the app's 24h TTL cache serves them without API calls)
  const recipes = await Promise.all(RECIPE_TUPLES.map((t) => prisma.cachedRecipe.create({ data: buildRecipe(t) })));
  const ids = recipes.map((r) => r.id);
  console.log(`Recipes: ${recipes.length}`);

  // Favorites
  await prisma.favorite.createMany({
    data: [
      { userId: demo.id, recipeId: ids[0] },
      { userId: demo.id, recipeId: ids[3] },
      { userId: demo.id, recipeId: ids[7] },
      { userId: alex.id, recipeId: ids[1] },
      { userId: alex.id, recipeId: ids[5] },
    ],
  });
  console.log('Favorites: 5');

  // Meal plans + entries
  const thisWeek = await prisma.mealPlan.create({ data: { userId: demo.id, name: 'This Week', weekStart: mondayOfWeek(0) } });
  const lastWeek = await prisma.mealPlan.create({ data: { userId: demo.id, name: 'Last Week (archived)', weekStart: mondayOfWeek(-1) } });
  const alexPlan = await prisma.mealPlan.create({ data: { userId: alex.id, name: 'Alex Week', weekStart: mondayOfWeek(0) } });

  await prisma.mealPlanEntry.createMany({
    data: [
      { mealPlanId: thisWeek.id, recipeId: ids[4], dayOfWeek: 0, mealType: 'BREAKFAST', servings: 1 },
      { mealPlanId: thisWeek.id, recipeId: ids[2], dayOfWeek: 0, mealType: 'LUNCH', servings: 1 },
      { mealPlanId: thisWeek.id, recipeId: ids[6], dayOfWeek: 0, mealType: 'DINNER', servings: 2 },
      { mealPlanId: thisWeek.id, recipeId: ids[5], dayOfWeek: 2, mealType: 'LUNCH', servings: 1 },
      { mealPlanId: thisWeek.id, recipeId: ids[3], dayOfWeek: 2, mealType: 'DINNER', servings: 2 },
      { mealPlanId: thisWeek.id, recipeId: ids[0], dayOfWeek: 4, mealType: 'DINNER', servings: 2 },
      { mealPlanId: thisWeek.id, recipeId: ids[7], dayOfWeek: 6, mealType: 'SNACK', servings: 1 },
      { mealPlanId: lastWeek.id, recipeId: ids[1], dayOfWeek: 1, mealType: 'DINNER', servings: 2 },
      { mealPlanId: lastWeek.id, recipeId: ids[6], dayOfWeek: 3, mealType: 'DINNER', servings: 2 },
      { mealPlanId: alexPlan.id, recipeId: ids[5], dayOfWeek: 0, mealType: 'DINNER', servings: 1 },
      { mealPlanId: alexPlan.id, recipeId: ids[2], dayOfWeek: 4, mealType: 'LUNCH', servings: 1 },
    ],
  });
  console.log('Meal plans: 3 (11 entries)');

  // Shopping lists + items
  const groceries = await prisma.shoppingList.create({ data: { userId: demo.id, name: 'Weekly Groceries' } });
  const pantry = await prisma.shoppingList.create({ data: { userId: alex.id, name: 'Pantry Restock' } });
  await prisma.shoppingListItem.createMany({
    data: [
      { shoppingListId: groceries.id, name: 'Salmon fillets', amount: 2, unit: 'lb', aisle: 'Seafood', checked: false },
      { shoppingListId: groceries.id, name: 'Asparagus', amount: 1, unit: 'bunch', aisle: 'Produce', checked: true },
      { shoppingListId: groceries.id, name: 'Spaghetti', amount: 16, unit: 'oz', aisle: 'Pasta and Rice', checked: false },
      { shoppingListId: groceries.id, name: 'Cherry tomatoes', amount: 1, unit: 'pint', aisle: 'Produce', checked: false },
      { shoppingListId: groceries.id, name: 'Ground beef', amount: 1, unit: 'lb', aisle: 'Meat', checked: true },
      { shoppingListId: groceries.id, name: 'Greek yogurt', amount: 32, unit: 'oz', aisle: 'Dairy and Eggs', checked: false },
      { shoppingListId: pantry.id, name: 'Olive oil', amount: 1, unit: 'bottle', aisle: 'Oil, Vinegar, Salad Dressing', checked: false },
      { shoppingListId: pantry.id, name: 'Soy sauce', amount: 1, unit: 'bottle', aisle: 'Ethnic Foods', checked: false },
      { shoppingListId: pantry.id, name: 'Rice', amount: 5, unit: 'lb', aisle: 'Pasta and Rice', checked: false },
    ],
  });
  console.log('Shopping lists: 2 (9 items)');
  console.log('Done! Login with demo@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

