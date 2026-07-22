export interface BusinessTypeExtraField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
}

export interface BusinessTypeConfig {
  id: string;
  label: string;
  defaultCategories: string[];
  /** Common product names for this business type, used to power the
   *  searchable product-name dropdown. Free text is still allowed. */
  commonItems: string[];
  extraFields: BusinessTypeExtraField[];
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    id: "spare_parts",
    label: "Bike Spare Parts",
    defaultCategories: [
      "Engine",
      "Brakes",
      "Electrical",
      "Body",
      "Suspension",
      "Tyres",
      "Transmission",
      "Fuel System",
      "Lubricants & Oils",
      "Accessories",
    ],
    commonItems: [
      // Engine
      "Piston", "Piston Ring Set", "Piston Pin", "Cylinder Block", "Cylinder Head",
      "Valve (Inlet)", "Valve (Exhaust)", "Valve Guide", "Camshaft", "Crankshaft",
      "Connecting Rod", "Gasket Set", "Head Gasket", "Engine Oil Seal", "Timing Chain",
      "Timing Chain Tensioner", "Clutch Plate Set", "Clutch Friction Plate",
      "Clutch Pressure Plate", "Clutch Cable", "Kick Starter Shaft", "Kick Starter Gear",
      // Brakes
      "Brake Shoe", "Brake Pad Set", "Brake Cable", "Brake Lever", "Brake Drum",
      "Brake Disc Rotor", "Brake Master Cylinder", "Brake Fluid", "Brake Cam",
      // Electrical
      "Spark Plug", "Ignition Coil", "CDI Unit", "Magneto / Stator Coil", "Rectifier",
      "Battery 12V", "Self Starter Motor", "Horn", "Headlight Assembly", "Headlight Bulb",
      "Tail Light Assembly", "Indicator / Blinker", "Wiring Harness", "Ignition Switch",
      "Handle Switch (Left)", "Handle Switch (Right)", "Flasher Relay",
      // Body
      "Front Fender / Mudguard", "Rear Fender / Mudguard", "Fuel Tank", "Fuel Tank Cap",
      "Side Panel Set", "Seat Assembly", "Seat Cover", "Headlight Fairing", "Number Plate Holder",
      "Chain Cover", "Foot Rest", "Foot Rest Rubber", "Handle Bar", "Handle Grip Set",
      "Mirror (Left)", "Mirror (Right)",
      // Suspension
      "Front Shock Absorber", "Rear Shock Absorber", "Fork Pipe", "Fork Oil Seal",
      "Fork Spring", "Swing Arm", "Steering Cone Set", "Steering Ball Bearing",
      // Tyres & Wheels
      "Front Tyre", "Rear Tyre", "Tube (Front)", "Tube (Rear)", "Wheel Rim (Front)",
      "Wheel Rim (Rear)", "Spoke Set", "Wheel Bearing", "Rim Tape",
      // Transmission / Drive
      "Chain Set", "Chain Sprocket (Front)", "Chain Sprocket (Rear)", "Gear Box Assembly",
      "Gear Lever", "Chain Adjuster", "Clutch Lever",
      // Fuel System
      "Carburettor", "Carburettor Repair Kit", "Fuel Cock / Petcock", "Fuel Pipe",
      "Air Filter", "Air Filter Box", "Throttle Cable", "Throttle Grip",
      // Lubricants & Oils
      "Engine Oil 20W-40", "Engine Oil 20W-50", "Fork Oil", "Chain Lube", "Grease",
      // Accessories
      "Speedometer Assembly", "Speedometer Cable", "Silencer / Exhaust Pipe",
      "Silencer Guard", "Number Lock", "Handle Lock", "Tool Kit", "Mud Flap",
    ],
    extraFields: [
      { key: "partNumber", label: "Part Number", type: "text" },
      { key: "compatibleModels", label: "Compatible Models", type: "text" },
    ],
  },
  {
    id: "garments",
    label: "Garments & Textiles",
    defaultCategories: ["Men", "Women", "Kids", "Unstitched", "Accessories", "Footwear", "Winter Wear"],
    commonItems: [
      // Men
      "Men's Kurta", "Men's Shalwar Kameez", "Men's Waistcoat", "Men's Shirt", "Men's T-Shirt",
      "Men's Polo Shirt", "Men's Jeans", "Men's Dress Pant", "Men's Trouser", "Men's Jacket",
      "Men's Sweater", "Men's Hoodie", "Men's Sherwani", "Men's Suit (2-Piece)", "Men's Undershirt",
      // Women
      "Women's Kurti", "Women's Shalwar Kameez", "Women's Lawn Suit", "Women's Frock",
      "Women's Abaya", "Women's Dupatta", "Women's Shawl", "Women's Blouse", "Women's Trouser",
      "Women's Gharara", "Women's Lehenga", "Women's Saree", "Women's Cardigan",
      // Kids
      "Kids Frock", "Kids Shirt", "Kids T-Shirt", "Kids Pant", "Kids Suit",
      "Baby Romper", "Baby Set", "Kids Sweater", "Kids Jacket",
      // Unstitched
      "Unstitched Lawn (3-Piece)", "Unstitched Cotton (2-Piece)", "Unstitched Khaddar",
      "Unstitched Chiffon", "Unstitched Linen", "Unstitched Silk", "Shirt Piece",
      // Fabric
      "Cotton Fabric (per meter)", "Lawn Fabric (per meter)", "Wash & Wear (per meter)",
      "Boski (per meter)", "Karandi (per meter)", "Velvet (per meter)",
      // Accessories
      "Socks", "Handkerchief", "Belt", "Tie", "Cap", "Scarf", "Gloves", "Muffler",
      // Footwear
      "Khussa", "Sandal", "Slipper", "Joggers", "Formal Shoes",
    ],
    extraFields: [
      { key: "size", label: "Size", type: "text" },
      { key: "color", label: "Color", type: "text" },
      { key: "fabric", label: "Fabric", type: "text" },
    ],
  },
  {
    id: "hardware",
    label: "Hardware & Tools",
    defaultCategories: ["Hand Tools", "Power Tools", "Fasteners", "Plumbing", "Electrical", "Paint", "Safety"],
    commonItems: [
      // Hand Tools
      "Hammer", "Claw Hammer", "Screwdriver Set", "Philips Screwdriver", "Flat Screwdriver",
      "Pliers", "Nose Pliers", "Cutting Pliers", "Wrench Set", "Adjustable Wrench",
      "Spanner Set", "Allen Key Set", "Measuring Tape", "Spirit Level", "Hacksaw",
      "Hand Saw", "Chisel", "File", "Vice Grip", "Wire Stripper", "Utility Knife",
      // Power Tools
      "Electric Drill", "Cordless Drill", "Angle Grinder", "Circular Saw", "Jigsaw",
      "Heat Gun", "Soldering Iron", "Bench Grinder", "Impact Wrench", "Drill Bit Set",
      "Grinding Wheel", "Cutting Disc",
      // Fasteners
      "Nut & Bolt Set", "Machine Screw", "Wood Screw", "Self-Tapping Screw", "Washer",
      "Spring Washer", "Anchor Bolt", "Rivet", "Nail (per kg)", "Wall Plug / Rawl Plug",
      // Plumbing
      "PVC Pipe", "PVC Elbow", "PVC Tee", "Water Tap / Bib Cock", "Ball Valve",
      "Gate Valve", "Teflon Tape", "Pipe Wrench", "Hose Pipe", "Pipe Clamp",
      // Electrical
      "Electrical Wire (per meter)", "Switch", "Socket", "Distribution Board", "Circuit Breaker",
      "Insulation Tape", "Extension Board", "Bulb Holder", "PVC Conduit Pipe",
      // Paint & Finishing
      "Paint Brush", "Paint Roller", "Sandpaper", "Emulsion Paint", "Enamel Paint",
      "Primer", "Putty", "Thinner", "Wall Filler",
      // Safety
      "Safety Gloves", "Safety Goggles", "Dust Mask", "Helmet", "Ear Plugs",
    ],
    extraFields: [
      { key: "warrantyMonths", label: "Warranty (months)", type: "number" },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    defaultCategories: ["Mobiles", "Accessories", "Appliances", "Computers", "Cables", "Audio", "Gaming"],
    commonItems: [
      // Mobiles & Accessories
      "Smartphone", "Feature Phone", "Mobile Charger", "Fast Charger", "Wireless Charger",
      "Power Bank", "USB Data Cable", "Type-C Cable", "Lightning Cable", "Mobile Cover / Case",
      "Screen Protector / Tempered Glass", "Memory Card", "SIM Ejector Tool", "Selfie Stick",
      "Phone Holder / Stand", "Earphones / Handsfree", "Bluetooth Earbuds", "Bluetooth Headphones",
      // Computers
      "Laptop", "Desktop PC", "Monitor", "Keyboard", "Mouse", "Wireless Keyboard & Mouse",
      "USB Flash Drive", "External Hard Drive", "SSD", "RAM Module", "Webcam", "Laptop Charger",
      "Laptop Bag", "Cooling Pad", "USB Hub", "Router", "Wi-Fi Extender", "Network Switch",
      // Audio
      "Bluetooth Speaker", "Home Theater System", "Sound Bar", "Amplifier", "Microphone",
      // Appliances
      "LED TV", "Smart TV", "Air Conditioner", "Refrigerator", "Washing Machine",
      "Microwave Oven", "Electric Kettle", "Electric Iron", "Room Cooler", "Pedestal Fan",
      "Ceiling Fan", "Exhaust Fan", "Water Dispenser", "Vacuum Cleaner", "Hair Dryer",
      "Electric Blender", "Juicer", "Toaster", "UPS", "Voltage Stabilizer", "Solar Inverter",
      // Cables & Misc
      "HDMI Cable", "VGA Cable", "AUX Cable", "Extension Cord", "Multi Plug", "Adapter",
      // Gaming
      "Gaming Console", "Game Controller", "Gaming Headset",
    ],
    extraFields: [
      { key: "warrantyMonths", label: "Warranty (months)", type: "number" },
      { key: "serialNumber", label: "Serial Number", type: "text" },
    ],
  },
  {
    id: "grocery",
    label: "Grocery / Food",
    defaultCategories: ["Packaged Food", "Beverages", "Produce", "Dairy", "Bakery", "Spices", "Cleaning", "Personal Care"],
    commonItems: [
      // Staples
      "Rice (Basmati)", "Rice (Sella)", "Wheat Flour / Atta", "Maida", "Sugar", "Brown Sugar",
      "Salt", "Cooking Oil", "Ghee", "Lentils / Daal (Masoor)", "Daal Chana", "Daal Moong",
      "Daal Mash", "White Chickpeas / Chholay", "Red Kidney Beans / Rajma", "Semolina / Sooji",
      // Spices
      "Red Chilli Powder", "Turmeric / Haldi", "Coriander Powder", "Cumin / Zeera",
      "Black Pepper", "Garam Masala", "Biryani Masala", "Salt Iodized", "Bay Leaf", "Cardamom",
      // Beverages
      "Tea / Chai Patti", "Green Tea", "Instant Coffee", "Soft Drink Bottle", "Juice Pack",
      "Mineral Water", "Milk Pack (Long Life)", "Powdered Milk", "Energy Drink", "Squash / Syrup",
      // Dairy
      "Fresh Milk", "Yogurt / Dahi", "Butter", "Cheese", "Cream", "Eggs (Dozen)",
      // Bakery
      "Bread", "Bun", "Rusk", "Biscuits", "Cake", "Cookies",
      // Packaged
      "Noodles", "Pasta", "Ketchup", "Mayonnaise", "Jam", "Honey", "Pickle / Achar",
      "Chips / Crisps", "Chocolate", "Candy", "Dates", "Dry Fruits Mix",
      // Cleaning & Personal Care
      "Dishwashing Liquid", "Detergent Powder", "Detergent Bar", "Bleach", "Floor Cleaner",
      "Toilet Cleaner", "Soap", "Shampoo", "Toothpaste", "Toothbrush", "Tissue Box",
      "Toilet Paper Roll", "Sanitary Napkins", "Hand Wash",
    ],
    extraFields: [
      { key: "expiryDate", label: "Expiry Date", type: "date" },
      { key: "batchNo", label: "Batch No.", type: "text" },
    ],
  },
  {
    id: "pharmacy",
    label: "Pharmacy / Medical",
    defaultCategories: ["Medicines", "Supplements", "Medical Devices", "Personal Care", "Baby Care", "First Aid", "Surgical"],
    commonItems: [
      // Common OTC Medicines (generic)
      "Paracetamol Tablet", "Paracetamol Syrup", "Ibuprofen Tablet", "Aspirin Tablet",
      "Antacid Tablet", "Antacid Syrup", "ORS Sachet", "Cough Syrup", "Antihistamine Tablet",
      "Multivitamin Tablet", "Vitamin C Tablet", "Vitamin D Capsule", "Calcium Tablet",
      "Iron Supplement", "Zinc Syrup", "Anti-Diarrhoeal", "Pain Relief Balm", "Eye Drops",
      "Ear Drops", "Nasal Drops", "Antiseptic Cream", "Burn Cream",
      // Devices
      "Digital Thermometer", "Blood Pressure Monitor", "Glucometer", "Glucose Test Strips",
      "Nebulizer", "Pulse Oximeter", "Weighing Scale", "Hot Water Bottle", "Ice Bag",
      // First Aid / Surgical
      "Bandage Roll", "Cotton Wool", "Gauze Pad", "Adhesive Plaster / Band-Aid",
      "Antiseptic Solution", "Surgical Gloves", "Face Mask", "Syringe (Disposable)",
      "Insulin Syringe", "Cotton Buds", "Crepe Bandage", "Micropore Tape",
      // Personal & Baby Care
      "Hand Sanitizer", "Baby Diapers", "Baby Wipes", "Baby Lotion", "Baby Powder",
      "Feeding Bottle", "Baby Formula Milk", "Sunblock", "Moisturizer", "Antiseptic Soap",
    ],
    extraFields: [
      { key: "expiryDate", label: "Expiry Date", type: "date" },
      { key: "batchNo", label: "Batch No.", type: "text" },
      { key: "requiresPrescription", label: "Requires Prescription", type: "text" },
    ],
  },
  {
    id: "wholesale",
    label: "Wholesale",
    defaultCategories: ["General Goods", "Bulk Items", "Imported", "Local", "FMCG", "Stationery"],
    commonItems: [
      "Rice Bag (25kg)", "Rice Bag (50kg)", "Flour Bag (20kg)", "Sugar Bag (50kg)",
      "Cooking Oil Carton", "Ghee Carton", "Tea Carton", "Soap Carton", "Detergent Carton",
      "Biscuits Carton", "Soft Drink Crate", "Mineral Water Carton", "Noodles Carton",
      "Milk Pack Carton", "Salt Carton", "Spices Carton", "Shampoo Carton", "Toothpaste Carton",
      "Matchbox Bundle", "Candle Box", "Disposable Cups Carton", "Disposable Plates Carton",
      "Plastic Bags Bundle", "Tissue Box Carton", "Notebook Bundle", "Pen Box", "Battery Carton",
      "Bulb Carton", "Lighter Box", "Toilet Paper Carton", "Cigarette Carton",
    ],
    extraFields: [
      { key: "cartonSize", label: "Carton Size", type: "text" },
      { key: "minOrderQty", label: "Minimum Order Qty", type: "number" },
    ],
  },
  {
    id: "custom",
    label: "Custom Business",
    defaultCategories: ["General"],
    commonItems: [],
    extraFields: [],
  },
];

const DEFAULT_CONFIG: BusinessTypeConfig = BUSINESS_TYPES.find((t) => t.id === "custom")!;

export function getBusinessTypeConfig(id: string | undefined | null): BusinessTypeConfig {
  return BUSINESS_TYPES.find((t) => t.id === id) ?? DEFAULT_CONFIG;
}
