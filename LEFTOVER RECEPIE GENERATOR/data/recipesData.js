export const recipes = [
    {
        id: 1,
        name: "Egg Fried Rice",
        category: "Rice",
        ingredients: ["rice", "egg", "garlic", "soy sauce", "onion"],
        instructions: "1. Heat oil in a pan and sauté minced garlic and chopped onion until fragrant.\n2. Push them to the side, crack the eggs into the pan, and scramble them.\n3. Add cooked rice and soy sauce. Toss everything together on high heat for 3 minutes.\n4. Serve hot.",
        substitutions: {
            "soy sauce": "tamari or coconut aminos",
            "egg": "scrambled tofu",
            "rice": "cauliflower rice"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        allergens: ["egg", "soy", "gluten"]
    },
    {
        id: 2,
        name: "Garlic Butter Pasta",
        category: "Pasta",
        ingredients: ["pasta", "garlic", "butter", "cheese", "black pepper"],
        instructions: "1. Boil pasta in salted water until al dente, then drain and reserve some pasta water.\n2. Melt butter in a skillet, add sliced garlic, and cook until golden.\n3. Toss in the pasta, cheese, and black pepper. Add a splash of pasta water to create a creamy sauce.\n4. Garnish with more cheese and serve.",
        substitutions: {
            "butter": "olive oil or margarine",
            "cheese": "nutritional yeast or vegan cheese",
            "pasta": "gluten-free pasta"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        allergens: ["dairy", "gluten"]
    },
    {
        id: 3,
        name: "Tomato Spinach Omelette",
        category: "Egg",
        ingredients: ["egg", "tomato", "spinach", "onion", "cheese"],
        instructions: "1. Whisk eggs in a bowl with a pinch of salt and pepper.\n2. Sauté chopped tomato and onion in a non-stick pan until soft.\n3. Add spinach and cook until wilted. Pour the whisked eggs over the vegetables.\n4. Sprinkle cheese on top, cook until the bottom is set, fold in half, and serve.",
        substitutions: {
            "egg": "chickpea flour batter",
            "cheese": "vegan cheese"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["egg", "dairy"]
    },
    {
        id: 4,
        name: "Chicken Stir Fry",
        category: "Chicken",
        ingredients: ["chicken", "broccoli", "carrot", "soy sauce", "garlic", "ginger"],
        instructions: "1. Heat oil in a wok. Add minced garlic and grated ginger.\n2. Add bite-sized chicken pieces and stir-fry until cooked through.\n3. Add broccoli florets and sliced carrots. Pour soy sauce over everything.\n4. Stir-fry for another 5 minutes until veggies are tender-crisp.",
        substitutions: {
            "chicken": "tofu or tempeh",
            "soy sauce": "tamari or coconut aminos"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        allergens: ["soy", "gluten"]
    },
    {
        id: 5,
        name: "Beef Broccoli",
        category: "Beef",
        ingredients: ["beef", "broccoli", "garlic", "soy sauce", "onion"],
        instructions: "1. Sauté sliced onion and garlic in a hot pan.\n2. Add thin beef slices and cook until browned.\n3. Add broccoli florets and soy sauce. Simmer for 3-5 minutes until broccoli is cooked.\n4. Serve hot with rice.",
        substitutions: {
            "beef": "mushroom or tofu",
            "soy sauce": "coconut aminos"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        allergens: ["soy", "gluten"]
    },
    {
        id: 6,
        name: "Creamy Mushroom Pasta",
        category: "Pasta",
        ingredients: ["pasta", "mushroom", "milk", "cheese", "garlic"],
        instructions: "1. Cook pasta according to package instructions.\n2. Sauté sliced mushrooms and garlic in butter/oil until browned.\n3. Pour in milk and simmer gently. Stir in cheese until melted and creamy.\n4. Toss pasta in the mushroom sauce and serve with fresh pepper.",
        substitutions: {
            "milk": "coconut milk or oat milk",
            "cheese": "vegan parmesan",
            "pasta": "gluten-free pasta"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        allergens: ["dairy", "gluten"]
    },
    {
        id: 7,
        name: "Vegetable Curry",
        category: "Vegetarian",
        ingredients: ["potato", "carrot", "tomato", "onion", "ginger", "spinach"],
        instructions: "1. Sauté chopped onion, ginger, and garlic in oil.\n2. Add chopped tomatoes and cook until soft.\n3. Stir in cubed potatoes and sliced carrots with curry spices. Add water and cover.\n4. Simmer until veggies are tender, throw in spinach until wilted, and serve.",
        substitutions: {
            "spinach": "cabbage or broccoli"
        },
        halal: true,
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        allergens: []
    },
    {
        id: 8,
        name: "Tofu Stir Fry",
        category: "Vegetarian",
        ingredients: ["tofu", "bell pepper", "onion", "garlic", "soy sauce", "carrot"],
        instructions: "1. Press and cube tofu, then pan-fry until golden on all sides.\n2. Remove tofu, sauté sliced bell peppers, carrots, and onions in the same pan.\n3. Add minced garlic, toss the tofu back in, and drizzle with soy sauce.\n4. Stir-fry for 2-3 minutes and serve.",
        substitutions: {
            "tofu": "tempeh or chicken",
            "soy sauce": "tamari"
        },
        halal: true,
        vegetarian: true,
        vegan: true,
        glutenFree: false,
        allergens: ["soy", "gluten"]
    },
    {
        id: 9,
        name: "Classic Potato Salad",
        category: "Vegetarian",
        ingredients: ["potato", "onion", "yogurt", "black pepper", "salt"],
        instructions: "1. Boil cubed potatoes until fork-tender, then let them cool.\n2. Finely chop the onion.\n3. Mix yogurt, salt, and black pepper in a large bowl.\n4. Toss the potatoes and onion in the dressing and chill before serving.",
        substitutions: {
            "yogurt": "vegan mayonnaise",
            "potato": "sweet potato"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["dairy"]
    },
    {
        id: 10,
        name: "Warm Tomato Soup",
        category: "Vegetarian",
        ingredients: ["tomato", "onion", "garlic", "milk", "butter"],
        instructions: "1. Roast or sauté tomatoes, onion, and garlic until caramelized.\n2. Blend them with a splash of water until completely smooth.\n3. Pour into a pot, stir in milk and butter, and simmer for 5 minutes.\n4. Season with salt and pepper, and serve with toasted bread.",
        substitutions: {
            "milk": "coconut milk",
            "butter": "olive oil"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["dairy"]
    },
    {
        id: 11,
        name: "Chicken Noodle Soup",
        category: "Chicken",
        ingredients: ["chicken", "noodle", "carrot", "onion", "garlic"],
        instructions: "1. Boil chicken in water to make a broth, then shred the chicken.\n2. In a clean pot, sauté garlic, onion, and carrots.\n3. Pour the chicken broth over the veggies and bring to a boil.\n4. Add noodles and shredded chicken. Cook until noodles are soft.",
        substitutions: {
            "chicken": "tofu",
            "noodle": "rice noodles or gluten-free noodles"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        allergens: ["gluten"]
    },
    {
        id: 12,
        name: "Cheesy Garlic Bread",
        category: "Bread",
        ingredients: ["bread", "garlic", "butter", "cheese"],
        instructions: "1. Mash minced garlic into softened butter.\n2. Spread garlic butter over slices of bread.\n3. Top with grated cheese.\n4. Toast in an oven or skillet until bread is crispy and cheese is melted.",
        substitutions: {
            "butter": "olive oil",
            "cheese": "vegan cheese",
            "bread": "gluten-free bread"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        allergens: ["dairy", "gluten"]
    },
    {
        id: 13,
        name: "Savory Oatmeal",
        category: "Oats",
        ingredients: ["oats", "spinach", "egg", "salt", "black pepper"],
        instructions: "1. Cook oats in water with a pinch of salt until soft.\n2. Stir in fresh spinach leaves until wilted.\n3. Fry or poach an egg separately.\n4. Top the warm oats with the egg, black pepper, and serve.",
        substitutions: {
            "egg": "avocado or tofu",
            "spinach": "cabbage"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["egg"]
    },
    {
        id: 14,
        name: "Garlic Butter Shrimp",
        category: "Seafood",
        ingredients: ["shrimp", "garlic", "butter", "chili", "lemon"],
        instructions: "1. Melt butter in a pan and sauté lots of minced garlic and chili flakes.\n2. Add peeled shrimp and cook for 2-3 minutes on each side until pink.\n3. Squeeze fresh lemon juice over the top.\n4. Serve immediately.",
        substitutions: {
            "shrimp": "tofu or chicken",
            "butter": "olive oil"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: true,
        allergens: ["seafood", "dairy"]
    },
    {
        id: 15,
        name: "Hearty Beef Stew",
        category: "Beef",
        ingredients: ["beef", "potato", "carrot", "onion", "tomato"],
        instructions: "1. Sear cubed beef in a large pot until browned.\n2. Throw in chopped onions, carrots, and potatoes.\n3. Add chopped tomatoes and water or stock to cover.\n4. Simmer on low heat for 1 hour until the beef is tender.",
        substitutions: {
            "beef": "mushroom"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: true,
        allergens: []
    },
    {
        id: 16,
        name: "Chili Garlic Noodles",
        category: "Noodle",
        ingredients: ["noodle", "garlic", "chili", "soy sauce", "onion"],
        instructions: "1. Cook noodles and drain.\n2. Sauté minced garlic, chopped onion, and fresh chili in oil.\n3. Toss in the cooked noodles and soy sauce.\n4. Stir-fry on high heat for 2 minutes and serve.",
        substitutions: {
            "noodle": "pasta or rice noodles",
            "soy sauce": "tamari"
        },
        halal: true,
        vegetarian: true,
        vegan: true,
        glutenFree: false,
        allergens: ["soy", "gluten"]
    },
    {
        id: 17,
        name: "Spinach Cheese Frittata",
        category: "Egg",
        ingredients: ["egg", "spinach", "cheese", "milk", "onion"],
        instructions: "1. Whisk eggs, milk, salt, and pepper together.\n2. Sauté onion and spinach in a pan until cooked.\n3. Pour egg mixture over the spinach and top with cheese.\n4. Bake or cook covered on a stove until the middle is set.",
        substitutions: {
            "milk": "almond milk",
            "cheese": "vegan cheese",
            "spinach": "broccoli"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["egg", "dairy"]
    },
    {
        id: 18,
        name: "Easy Butter Chicken",
        category: "Chicken",
        ingredients: ["chicken", "butter", "tomato", "milk", "garlic", "ginger"],
        instructions: "1. Marinate chicken bits in yogurt or spices.\n2. Cook chicken in butter with garlic and ginger until browned.\n3. Add blended tomatoes and milk, simmer until the sauce thickens.\n4. Serve hot with rice or bread.",
        substitutions: {
            "chicken": "tofu",
            "milk": "coconut cream",
            "butter": "oil"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: true,
        allergens: ["dairy"]
    },
    {
        id: 19,
        name: "Salmon with Broccoli",
        category: "Seafood",
        ingredients: ["salmon", "broccoli", "garlic", "butter", "lemon"],
        instructions: "1. Season salmon with salt, pepper, and garlic.\n2. Pan-sear salmon skin-side down first, then flip until done.\n3. Steam broccoli and toss with butter.\n4. Serve salmon with broccoli and lemon slices.",
        substitutions: {
            "salmon": "tofu or chicken",
            "butter": "olive oil"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: true,
        allergens: ["seafood", "dairy"]
    },
    {
        id: 20,
        name: "Tuna Salad Sandwich",
        category: "Seafood",
        ingredients: ["tuna", "yogurt", "onion", "bread", "black pepper"],
        instructions: "1. Drain canned tuna and mix with yogurt and finely chopped onion.\n2. Add black pepper and salt.\n3. Spread the mixture onto bread slices.\n4. Close sandwich and cut in half.",
        substitutions: {
            "yogurt": "mayonnaise",
            "bread": "lettuce wraps or gluten-free bread"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        allergens: ["seafood", "dairy", "gluten"]
    },
    {
        id: 21,
        name: "Tempeh Stir Fry",
        category: "Vegetarian",
        ingredients: ["tempeh", "cabbage", "carrot", "soy sauce", "garlic", "chili"],
        instructions: "1. Slice tempeh and pan-fry until golden and crispy.\n2. Remove tempeh and stir-fry sliced cabbage, carrots, garlic, and chili.\n3. Toss tempeh back in, splash soy sauce, and cook for 2 minutes.\n4. Serve warm.",
        substitutions: {
            "tempeh": "tofu",
            "soy sauce": "tamari"
        },
        halal: true,
        vegetarian: true,
        vegan: true,
        glutenFree: false,
        allergens: ["soy", "gluten"]
    },
    {
        id: 22,
        name: "Creamy Tomato Pasta",
        category: "Pasta",
        ingredients: ["pasta", "tomato", "milk", "cheese", "garlic", "onion"],
        instructions: "1. Cook pasta. Sauté garlic and onion in olive oil.\n2. Add chopped tomatoes and cook down. Puree if desired.\n3. Pour in milk and cheese to create a pink sauce.\n4. Mix pasta with sauce and garnish with cheese.",
        substitutions: {
            "milk": "coconut milk",
            "cheese": "vegan cheese",
            "pasta": "gluten-free pasta"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        allergens: ["dairy", "gluten"]
    },
    {
        id: 23,
        name: "Healthy Egg Salad",
        category: "Egg",
        ingredients: ["egg", "yogurt", "onion", "salt", "black pepper"],
        instructions: "1. Hard-boil eggs, peel, and chop finely.\n2. Fold in yogurt, chopped onions, salt, and pepper.\n3. Mix well and serve chilled as a dip or spread.",
        substitutions: {
            "yogurt": "mayonnaise",
            "egg": "crumbled tofu"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["egg", "dairy"]
    },
    {
        id: 24,
        name: "Mushroom Risotto Rice",
        category: "Rice",
        ingredients: ["rice", "mushroom", "onion", "garlic", "cheese", "butter"],
        instructions: "1. Sauté onions, garlic, and mushrooms in butter.\n2. Add rice and stir to coat in butter.\n3. Add warm water or broth one ladle at a time, letting rice absorb it.\n4. Once rice is cooked and creamy, stir in cheese and serve.",
        substitutions: {
            "butter": "olive oil",
            "cheese": "nutritional yeast"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["dairy"]
    },
    {
        id: 25,
        name: "Classic Chicken Curry",
        category: "Chicken",
        ingredients: ["chicken", "potato", "onion", "ginger", "garlic", "tomato"],
        instructions: "1. Sear chicken chunks in oil, then set aside.\n2. Sauté garlic, ginger, onion, and tomato to make a paste.\n3. Add spices, potatoes, chicken, and water.\n4. Simmer for 20 minutes until potato and chicken are fully cooked.",
        substitutions: {
            "chicken": "chickpeas",
            "potato": "sweet potato"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: true,
        allergens: []
    },
    {
        id: 26,
        name: "Garlic Sautéed Spinach",
        category: "Vegetarian",
        ingredients: ["spinach", "garlic", "salt", "black pepper"],
        instructions: "1. Heat oil in a pan and add thinly sliced garlic.\n2. Toss in fresh spinach leaves.\n3. Stir quickly on high heat until wilted (about 1 minute).\n4. Season with salt and black pepper and serve immediately.",
        substitutions: {
            "spinach": "cabbage"
        },
        halal: true,
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        allergens: []
    },
    {
        id: 27,
        name: "Potato and Carrot Mash",
        category: "Vegetarian",
        ingredients: ["potato", "carrot", "butter", "milk", "salt"],
        instructions: "1. Peel and chop potatoes and carrots. Boil until soft.\n2. Drain water and mash veggies together.\n3. Stir in butter and milk until smooth and creamy.\n4. Season with salt and serve.",
        substitutions: {
            "butter": "olive oil",
            "milk": "coconut milk"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        allergens: ["dairy"]
    },
    {
        id: 28,
        name: "Beef Rice Bowl",
        category: "Beef",
        ingredients: ["beef", "rice", "onion", "soy sauce", "garlic"],
        instructions: "1. Sauté onion and garlic in oil.\n2. Add sliced beef and cook until browned.\n3. Pour soy sauce and a splash of water, simmer for 3 minutes.\n4. Serve beef over a bowl of warm cooked rice.",
        substitutions: {
            "beef": "tofu",
            "soy sauce": "tamari"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        allergens: ["soy", "gluten"]
    },
    {
        id: 29,
        name: "Cabbage & Carrot Stir Fry",
        category: "Vegetarian",
        ingredients: ["cabbage", "carrot", "garlic", "onion", "salt"],
        instructions: "1. Shred cabbage and slice carrots thinly.\n2. Sauté garlic and onion in a wok.\n3. Add cabbage and carrot, and stir-fry on high heat.\n4. Season with salt and pepper, serve crunchy.",
        substitutions: {},
        halal: true,
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        allergens: []
    },
    {
        id: 30,
        name: "Easy Sweet Bread Pudding",
        category: "Bread",
        ingredients: ["bread", "milk", "egg", "butter"],
        instructions: "1. Tear bread into small pieces and place in a greased baking dish.\n2. Whisk milk, egg, and melted butter together.\n3. Pour mixture over bread and let it soak for 10 minutes.\n4. Bake at 180°C for 25 minutes until golden and puffed.",
        substitutions: {
            "milk": "almond milk",
            "bread": "gluten-free bread"
        },
        halal: true,
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        allergens: ["egg", "dairy", "gluten"]
    },
    {
        id: 31,
        name: "Garlic Shrimp with Broccoli",
        category: "Seafood",
        ingredients: ["shrimp", "broccoli", "garlic", "butter", "black pepper"],
        instructions: "1. Cook broccoli florets in boiling water for 2 minutes, then drain.\n2. Sauté minced garlic in melted butter.\n3. Add shrimp and cook until pink. Toss in broccoli.\n4. Season with salt and black pepper, cook for 1 minute, and serve.",
        substitutions: {
            "shrimp": "chicken",
            "butter": "olive oil"
        },
        halal: true,
        vegetarian: false,
        vegan: false,
        glutenFree: true,
        allergens: ["seafood", "dairy"]
    }
];
