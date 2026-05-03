import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const warehouses = [
  { name: "Chennai Warehouse",   location: "Chennai, Tamil Nadu",   city: "Chennai",   lat: 13.0827, lng: 80.2707 },
  { name: "Bangalore Warehouse", location: "Bangalore, Karnataka",  city: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai Warehouse",    location: "Mumbai, Maharashtra",   city: "Mumbai",    lat: 19.0760, lng: 72.8777 },
  { name: "Delhi Warehouse",     location: "New Delhi, Delhi",      city: "Delhi",     lat: 28.6139, lng: 77.2090 },
  { name: "Hyderabad Warehouse", location: "Hyderabad, Telangana",  city: "Hyderabad", lat: 17.3850, lng: 78.4867 },
];

function u(id: string, w = 800) {
  return `https://images.unsplash.com/${id}?w=${w}&q=80`;
}

const regularProducts = [
  // ── Healthcare ──────────────────────────────────────────────────────────────
  {
    name: "BP Monitor", brand: "Omron", category: "Healthcare", price: 1899,
    size: "Standard cuff (22–32 cm)", colors: [], boxContents: "BP Monitor unit, arm cuff, 4× AA batteries, carry pouch, instruction manual",
    description: "Automatic upper-arm blood pressure monitor with irregular heartbeat detection. Large LCD display. Stores 60 readings per user.",
    image: u("photo-1631549916768-4119b2e5f926"),
    images: [u("photo-i1iqQRLULlg"), u("photo-Nck9VXGDppA"), u("photo-3hTQWOv0yjQ")],
  },
  {
    name: "Glucose Monitor", brand: "Accu-Chek", category: "Healthcare", price: 1299,
    size: "Compact, 95 × 55 × 18 mm", colors: [], boxContents: "Glucometer, 10 test strips, lancing device, 10 lancets, carry case, manual",
    description: "Smart blood glucose monitoring system. Results in 4 seconds. No coding required. Bluetooth sync to app.",
    image: u("photo-bPRZiasA8SM"),
    images: [u("photo-bPRZiasA8SM"), u("photo-SBtNby0IiG0"), u("photo-UXwXIkJ34fg")],
  },
  {
    name: "Digital Thermometer", brand: "Dr. Morepen", category: "Healthcare", price: 349,
    size: "14.5 cm", colors: ["Yellow", "Purple"], boxContents: "Thermometer, 1× LR41 battery, protective cap, instruction sheet",
    description: "Fast & accurate digital thermometer with beep alert. Reads oral/axillary temperature in 10 seconds. Fever indicator.",
    image: u("photo-04HE-456KIg"),
    images: [u("photo-04HE-456KIg"), u("photo-WcJBDf_ATCc")],
  },
  {
    name: "Pulse Oximeter", brand: "HealthSense", category: "Healthcare", price: 699,
    size: "Fits finger sizes 10–25 mm", colors: ["Blue", "Yellow", "Green"], boxContents: "Pulse oximeter, 2× AAA batteries, lanyard, carry pouch",
    description: "Fingertip pulse oximeter. Measures SpO2 and pulse rate instantly. Large colour OLED display. Low battery indicator.",
    image: u("photo--msTEzGwKJs"),
    images: [u("photo--msTEzGwKJs"), u("photo-gfQvLt6f6RM"), u("photo-HujoqK2H88o")],
  },
  {
    name: "First Aid Kit", brand: "Safety First", category: "Healthcare", price: 549,
    size: "25 × 18 × 8 cm bag", colors: ["Red"], boxContents: "85-piece kit: bandages, gauze pads, antiseptic wipes, scissors, tweezers, thermometer, first aid guide",
    description: "Comprehensive 85-piece emergency first aid kit in a durable red zip bag. Ideal for home, car, and travel.",
    image: u("photo-T_XcYjQxtc8"),
    images: [u("photo-T_XcYjQxtc8")],
  },
  {
    name: "Hand Sanitizer", brand: "Dettol", category: "Healthcare", price: 199,
    size: "500 ml bottle", colors: [], boxContents: "1× 500ml pump bottle",
    description: "70% ethanol hand sanitizing gel. Kills 99.9% of germs without water. Non-sticky formula with moisturizers.",
    image: u("photo-tAZElyZEm40"),
    images: [u("photo-tAZElyZEm40"), u("photo-9EJVIo6XTB8")],
  },
  {
    name: "Surgical Face Mask", brand: "3M", category: "Healthcare", price: 99,
    size: "Pack of 50, adult size", colors: ["White", "Blue"], boxContents: "50× disposable 3-ply surgical masks in sealed box",
    description: "Pack of 50 disposable 3-ply surgical masks. BIS-certified. Elastic ear loops. Adjustable nose clip. Fluid resistant.",
    image: u("photo-zxIJ88p1goA"),
    images: [u("photo-zxIJ88p1goA"), u("photo-qQ11F5c3yXs")],
  },
  {
    name: "Medical Gloves", brand: "Ansell", category: "Healthcare", price: 249,
    size: "Box of 50, sizes S/M/L", colors: ["White", "Blue"], boxContents: "50× disposable latex-free nitrile examination gloves",
    description: "Box of 50 disposable nitrile examination gloves. Powder-free, latex-free, ambidextrous. Textured fingertips.",
    image: u("photo-qEG2ZaarS7o"),
    images: [u("photo-qEG2ZaarS7o"), u("photo-anBmAtntoEs")],
  },
  {
    name: "Hot Water Bag", brand: "Nestl", category: "Healthcare", price: 399,
    size: "2L, 30 × 20 cm", colors: ["Mauve", "Grey"], boxContents: "1× rubber hot water bottle with ribbed cover",
    description: "2-litre natural rubber hot water bottle with soft knitted cover. Relief for cramps, back pain, and cold nights.",
    image: u("photo-Q0Jv568bS7s"),
    images: [u("photo-Q0Jv568bS7s"), u("photo-J9O7vimaLVk")],
  },
  {
    name: "Sleep Mask", brand: "Manta", category: "Healthcare", price: 250,
    size: "One size fits all, adjustable strap", colors: ["Black"], boxContents: "1× sleep mask, storage pouch, foam ear plugs",
    description: "100% blackout contoured sleep mask. Zero pressure on eyes. Adjustable head strap. Ideal for travel and light sleepers.",
    image: u("photo-kl53gUUx97k"),
    images: [u("photo-kl53gUUx97k"), u("photo-Z56eN0CGtyk")],
  },

  // ── Skincare ────────────────────────────────────────────────────────────────
  {
    name: "Face Wash", brand: "Curology", category: "Skincare", price: 999,
    size: "100 ml tube", colors: [], boxContents: "1× face wash tube, product information leaflet",
    description: "Gentle sulphate-free foaming face wash. Clears pores, controls oil, brightens skin. Suitable for all skin types.",
    image: u("photo-X1sIr53DhzA"),
    images: [u("photo-X1sIr53DhzA"), u("photo-X1sIr53DhzA"), u("photo-DGH1u80sZik")],
  },
  {
    name: "Sunscreen SPF 50", brand: "Everyday Humans", category: "Skincare", price: 799,
    size: "60 ml tube", colors: ["Pink"], boxContents: "1× SPF 50 sunscreen tube",
    description: "Lightweight, non-greasy SPF 50 sunscreen. PA++++ UVA/UVB broad-spectrum protection. Reef-safe formula. No white cast.",
    image: u("photo-F39Yk-FM_fg"),
    images: [u("photo-F39Yk-FM_fg"), u("photo-BibJjO4sYrI")],
  },
  {
    name: "Moisturizer", brand: "The Ordinary", category: "Skincare", price: 659,
    size: "60 ml tube", colors: [], boxContents: "1× moisturizer tube",
    description: "Natural Moisturizing Factors + HA. Maintains skin barrier with amino acids, fatty acids, and hyaluronic acid. Fragrance-free.",
    image: u("photo-F6pxSRlKjU0"),
    images: [u("photo-F6pxSRlKjU0"), u("photo-KP97dx0GOv8"), u("photo-jcJruRYidSs")],
  },
  {
    name: "Face Serum", brand: "The Ordinary", category: "Skincare", price: 699,
    size: "30 ml dropper bottle", colors: [], boxContents: "1× serum dropper bottle",
    description: "Vitamin C 23% + HA Spheres 2%. Brightening, anti-ageing serum. Reduces dark spots and improves skin texture.",
    image: u("photo-dfocKTrQQ9Y"),
    images: [u("photo-dfocKTrQQ9Y"), u("photo-FKvUTUqW5x0"), u("photo-eHegln90kBw")],
  },
  {
    name: "Night Cream", brand: "Olay", category: "Skincare", price: 599,
    size: "50 ml jar", colors: [], boxContents: "1× night cream jar",
    description: "Regenerating night cream with retinol and peptides. Works overnight to reduce fine lines and firm skin.",
    image: u("photo-eHE5l7cJVRY"),
    images: [u("photo-eHE5l7cJVRY"), u("photo-oXI2_S1ILQI"), u("photo-JX-WwUTCOWQ")],
  },
  {
    name: "Face Scrub", brand: "Dear Scrub", category: "Skincare", price: 449,
    size: "100 g jar", colors: [], boxContents: "1× face scrub jar",
    description: "Walnut shell and coffee exfoliating face scrub. Removes dead skin cells, unclogs pores, and leaves skin glowing.",
    image: u("photo-7m-aAY8fLrE"),
    images: [u("photo-7m-aAY8fLrE"), u("photo-632S0y68B6s"), u("photo-HO8nieLzcyA")],
  },
  {
    name: "Sheet Masks", brand: "Innisfree", category: "Skincare", price: 349,
    size: "Pack of 5, one size fits all", colors: [], boxContents: "5× individually wrapped sheet masks in assorted variants",
    description: "Pack of 5 Korean essence-soaked sheet masks. Brightening, hydrating, and soothing variants. 20 min treatment per mask.",
    image: u("photo-BqHJVLjljyY"),
    images: [u("photo-BqHJVLjljyY"), u("photo-35oDtqwZ458")],
  },
  {
    name: "Lip Balm", brand: "Crystal Weed", category: "Skincare", price: 699,
    size: "15 ml stick", colors: ["Black/Yellow"], boxContents: "1× lip balm stick",
    description: "Medicated lip balm with shea butter, vitamin E, and SPF 15. Repairs dry, chapped lips. Long-lasting moisture.",
    image: u("photo-BLhropWAlm0"),
    images: [u("photo-BLhropWAlm0"), u("photo-eqU1-N_w7ME"), u("photo-D5jYsmLpYvk")],
  },
  {
    name: "Body Lotion", brand: "Cetaphil", category: "Skincare", price: 749,
    size: "250 ml tube", colors: [], boxContents: "1× body lotion tube",
    description: "Intensive moisturizing body lotion. 24-hour hydration with glycerin and sunflower oil. For dry to normal skin.",
    image: u("photo-bYiT94S4MlI"),
    images: [u("photo-bYiT94S4MlI"), u("photo-7C00JQVMuEw"), u("photo-4W4zySfM86k")],
  },
  {
    name: "Anti-Acne Gel", brand: "Benzac", category: "Skincare", price: 949,
    size: "30 g tube", colors: [], boxContents: "1× acne gel tube, instructions",
    description: "2.5% benzoyl peroxide anti-acne gel. Targets pimples, whiteheads, and blackheads. Non-comedogenic. Dermatologist tested.",
    image: u("photo-1ukJQMwI6c8"),
    images: [u("photo-1ukJQMwI6c8")],
  },

  // ── Fitness ─────────────────────────────────────────────────────────────────
  {
    name: "Dumbbells (Pair, 5kg)", brand: "Kore", category: "Fitness", price: 1499,
    size: "5 kg × 2", colors: ["Black"], boxContents: "2× 5 kg rubber-coated hex dumbbells",
    description: "Pair of 5 kg rubber-coated hex dumbbells. Cast iron core, anti-roll hex shape, textured handle for grip.",
    image: u("photo-H-qxKCedhcc"),
    images: [u("photo-H-qxKCedhcc"), u("photo-4KtEJUvT3Es"), u("photo-Q2lsONmwsOQ")],
  },
  {
    name: "Resistance Bands Set", brand: "Boldfit", category: "Fitness", price: 599,
    size: "Set of 5, 10–50 lbs resistance", colors: ["Multicolor"], boxContents: "5× latex resistance bands, carry bag, exercise guide",
    description: "Set of 5 colour-coded resistance bands (10, 20, 30, 40, 50 lbs). Latex-free, 100% natural. For all fitness levels.",
    image: u("photo-Mzu7qcmP5tk"),
    images: [u("photo-Mzu7qcmP5tk"), u("photo-oYqsakOc4QU")],
  },
  {
    name: "Yoga Mat", brand: "Boldfit", category: "Fitness", price: 799,
    size: "183 × 61 cm, 6 mm thick", colors: ["Blue", "Black", "Purple"], boxContents: "1× yoga mat, carry strap",
    description: "6 mm thick anti-slip TPE yoga mat with alignment lines. Eco-friendly, odour-resistant, sweat-proof. Dual-texture.",
    image: u("photo-G9H5edUL0T8"),
    images: [u("photo-G9H5edUL0T8"), u("photo-AX8cf6mkCzw")],
  },
  {
    name: "Kettlebell (15kg)", brand: "Aurion", category: "Fitness", price: 2299,
    size: "15 kg", colors: ["Black", "Grey"], boxContents: "1× 15 kg cast iron kettlebell",
    description: "15 kg solid cast iron kettlebell. Smooth finish, flat base for stability. Wide handle fits both hands. Rust resistant.",
    image: u("photo-M1RpPnVi6e4"),
    images: [u("photo-M1RpPnVi6e4"), u("photo-Q9xcKvGxBw0")],
  },
  {
    name: "Skipping Rope", brand: "Strauss", category: "Fitness", price: 249,
    size: "Adjustable, up to 300 cm", colors: ["Black"], boxContents: "1× speed jump rope with handles",
    description: "Speed skipping rope with ball-bearing handles. Adjustable PVC cable. Ergonomic foam-grip handles. Great for cardio.",
    image: u("photo-u8shwttq-k0"),
    images: [u("photo-u8shwttq-k0"), u("photo-Nv7jwSs8GdE")],
  },
  {
    name: "Foam Roller", brand: "Trigger Point", category: "Fitness", price: 999,
    size: "30 cm diameter, 60 cm long", colors: ["Black", "Blue"], boxContents: "1× high-density foam roller",
    description: "High-density EVA foam roller for deep tissue massage and myofascial release. Durable, non-slip surface.",
    image: u("photo-dQlmsho6cc8"),
    images: [u("photo-dQlmsho6cc8"), u("photo-uEDkfkwBqyY")],
  },
  {
    name: "Gym Gloves", brand: "RDX", category: "Fitness", price: 499,
    size: "S / M / L / XL", colors: ["Black/Green", "Black/Blue"], boxContents: "1× pair gym gloves, wrist wraps",
    description: "Fingerless gym training gloves with wrist support. Padded palm, ventilated back, easy-off pull tabs.",
    image: u("photo-4maxmLzoYNo"),
    images: [u("photo-4maxmLzoYNo"), u("photo-1iavyv1kYMw")],
  },
  {
    name: "Fitness Tracker Band", brand: "Mi", category: "Fitness", price: 2499,
    size: "S/L band, 18 mm strap", colors: ["Black"], boxContents: "Fitness band, charging cable, extra band (L size), quick start guide",
    description: "Smart fitness tracker with heart rate, SpO2, sleep monitoring and 5 ATM water resistance. 14-day battery life.",
    image: u("photo-5--lSW0MiE0"),
    images: [u("photo-5--lSW0MiE0"), u("photo-KiAYZZjpjkQ"), u("photo-VFf1E46qEek")],
  },
  {
    name: "Exercise Ball", brand: "Decathlon", category: "Fitness", price: 699,
    size: "65 cm diameter", colors: ["Purple", "Blue"], boxContents: "1× anti-burst exercise ball, foot pump",
    description: "Anti-burst 65 cm stability/exercise ball. 500 kg weight capacity. Textured surface for grip. Includes foot pump.",
    image: u("photo-f4RBYsY2hxA"),
    images: [u("photo-f4RBYsY2hxA")],
  },
  {
    name: "Protein Supplement (1kg)", brand: "MuscleBlaze", category: "Fitness", price: 1799,
    size: "1 kg (33 servings)", colors: [], boxContents: "1× 1 kg protein tub, measuring scoop, instruction card",
    description: "Whey protein isolate, 24g protein per serving. Low fat, low sugar. Chocolate flavour. FSSAI certified.",
    image: u("photo-4CzpHxVzTFA"),
    images: [u("photo-4CzpHxVzTFA"), u("photo-R23MqZKCBcM")],
  },

  // ── Electronics ─────────────────────────────────────────────────────────────
  {
    name: "Bluetooth Earbuds", brand: "boAt", category: "Electronics", price: 1499,
    size: "In-ear, one size", colors: ["Black", "Blue"], boxContents: "Earbuds, charging case, USB-C cable, 3 ear tip sizes, quick guide",
    description: "True wireless earbuds with 13 mm drivers, 30-hour total battery, IPX5 water resistance, and touch controls.",
    image: u("photo-qt9_OfTaaeY"),
    images: [u("photo-qt9_OfTaaeY"), u("photo-YwJGDLKOE48")],
  },
  {
    name: "Power Bank (10,000 mAh)", brand: "Ambrane", category: "Electronics", price: 1299,
    size: "10,000 mAh, 140 × 68 × 14 mm", colors: ["Blue", "Black"], boxContents: "Power bank, USB-A to micro-USB charging cable",
    description: "10,000 mAh slim power bank with dual USB-A output and USB-C input. 12W fast charging. Airline approved.",
    image: u("photo-Fj0YhK9CbDo"),
    images: [u("photo-Fj0YhK9CbDo"), u("photo-wGIOz_EMY1Y"), u("photo-DMjE06LKn2c")],
  },
  {
    name: "Smartwatch", brand: "Noise", category: "Electronics", price: 2999,
    size: "44 mm case, silicone band", colors: ["Black", "Silver"], boxContents: "Smartwatch, magnetic charging cable, extra band, manual",
    description: "1.8-inch AMOLED display. SpO2, heart rate, sleep tracking. 7-day battery. 100+ sports modes. IP68 waterproof.",
    image: u("photo-VZra-Bh7maE"),
    images: [u("photo-VZra-Bh7maE"), u("photo-GvEAMv_CMkc")],
  },
  {
    name: "Wireless Mouse", brand: "HP", category: "Electronics", price: 699,
    size: "105 × 60 × 35 mm", colors: ["Black", "White"], boxContents: "Wireless mouse, USB nano-receiver, 2× AA batteries",
    description: "2.4 GHz wireless mouse with 1600 DPI, 3-button scroll wheel, 15-month battery life, plug-and-play USB receiver.",
    image: u("photo-HQe36HjGijk"),
    images: [u("photo-HQe36HjGijk"), u("photo-ECIt3ozCsP8")],
  },
  {
    name: "Mechanical Keyboard", brand: "Keychron", category: "Electronics", price: 1799,
    size: "TKL (87-key), 358 × 130 mm", colors: ["White/Green", "White/Blue", "White/Red"], boxContents: "Keyboard, USB-C cable, key puller, extra keycaps",
    description: "Tenkeyless hot-swappable mechanical keyboard. Gateron G Pro switches. Per-key RGB backlight. Mac/Windows compatible.",
    image: u("photo-ZByWaPXD2fU"),
    images: [u("photo-ZByWaPXD2fU"), u("photo-dF0nne1hnzQ"), u("photo-xN62dYNQ2iY")],
  },
  {
    name: "Portable Speaker", brand: "JBL", category: "Electronics", price: 1999,
    size: "Ø 7.2 × 8.7 cm", colors: ["Black"], boxContents: "Speaker, USB-C charging cable, carabiner, quick guide",
    description: "JBL Go portable waterproof Bluetooth speaker. 5h playtime, IPX7, built-in mic. 360° sound. Connect up to 2 phones.",
    image: u("photo-g5Y5kjOwGwQ"),
    images: [u("photo-g5Y5kjOwGwQ"), u("photo-x7BZbtdZKpI"), u("photo-6PgwEWeR2Js")],
  },
  {
    name: "USB Flash Drive (64 GB)", brand: "SanDisk", category: "Electronics", price: 499,
    size: "64 GB, USB 3.0", colors: ["Black"], boxContents: "1× USB flash drive",
    description: "SanDisk 64 GB USB 3.0 flash drive. Up to 130 MB/s read speed. Compact sliding retractable design. 5-year warranty.",
    image: u("photo-9Eid2zc_Veo"),
    images: [u("photo-9Eid2zc_Veo"), u("photo-xeQcFK3D3YU")],
  },
  {
    name: "External Hard Drive (4 TB)", brand: "Seagate", category: "Electronics", price: 24499,
    size: "4 TB, 107 × 70 × 19 mm", colors: ["Black"], boxContents: "Hard drive, USB 3.0 cable, quick start guide",
    description: "Seagate Backup Plus 4 TB portable hard drive. USB 3.0, works with USB 2.0. Includes 2-month Adobe CC plan.",
    image: u("photo-sTHkbWG2qoI"),
    images: [u("photo-sTHkbWG2qoI"), u("photo-2sQWytjcL1o")],
  },
  {
    name: "LED Desk Lamp", brand: "Wipro", category: "Electronics", price: 899,
    size: "45 cm arm length", colors: ["Black", "White"], boxContents: "LED desk lamp, USB-C power adapter, instruction manual",
    description: "LED desk lamp with 5 colour temperatures and 5 brightness levels. Touch dimmer, USB charging port, memory function.",
    image: u("photo-NtFE0piBGF4"),
    images: [u("photo-NtFE0piBGF4"), u("photo-6BPimmrsqxE")],
  },
  {
    name: "Phone Charger (Fast, 67W)", brand: "Xiaomi", category: "Electronics", price: 799,
    size: "67W GaN, dual port", colors: ["White"], boxContents: "67W GaN charger, USB-C to USB-C cable (100W)",
    description: "67W GaN dual-port fast charger (1× USB-C + 1× USB-A). Charges phone to 100% in 46 min. Universal compatibility.",
    image: u("photo-f0EpYkZ-cp4"),
    images: [u("photo-f0EpYkZ-cp4")],
  },

  // ── Lifestyle ────────────────────────────────────────────────────────────────
  {
    name: "Water Bottle (Steel, 1L)", brand: "Milton", category: "Lifestyle", price: 499,
    size: "1 litre, Ø 7 × 27 cm", colors: ["Silver", "Black", "Navy"], boxContents: "1× insulated steel water bottle with flip lid",
    description: "1L double-wall vacuum-insulated stainless steel bottle. Keeps cold 24h, hot 12h. BPA-free, leak-proof flip cap.",
    image: u("photo--t3v_N28KZY"),
    images: [u("photo--t3v_N28KZY"), u("photo-RxehQaMEGNQ")],
  },
  {
    name: "Backpack (Casual)", brand: "Wildcraft", category: "Lifestyle", price: 1299,
    size: "30 L, 45 × 30 × 15 cm", colors: ["Brown", "Red", "Black"], boxContents: "1× backpack with laptop sleeve",
    description: "30L casual backpack with padded 15-inch laptop sleeve, USB charging port, water bottle pockets, and organiser panel.",
    image: u("photo-3o-X8WJOP5E"),
    images: [u("photo-3o-X8WJOP5E"), u("photo-OFHkPCkhYEY"), u("photo-SwWCo1k92M4")],
  },
  {
    name: "Sunglasses (UV400)", brand: "Ray-Ban", category: "Lifestyle", price: 799,
    size: "Medium frame, lens 52 mm", colors: ["Black", "Tortoise"], boxContents: "Sunglasses, hard case, cleaning cloth, authenticity card",
    description: "Polarized UV400 wayfarer sunglasses. CR-39 lenses, G-15 tint. 100% UVA/UVB protection. Durable acetate frame.",
    image: u("photo-SYx3UCHZJlo"),
    images: [u("photo-SYx3UCHZJlo"), u("photo-hUTQflndjfQ")],
  },
  {
    name: "Leather Wallet", brand: "Hidesign", category: "Lifestyle", price: 999,
    size: "11.5 × 9 cm, slim bifold", colors: ["Black", "Brown"], boxContents: "1× genuine leather bifold wallet, gift box",
    description: "Genuine leather slim bifold wallet. 6 card slots, 2 currency pockets, ID window. RFID blocking lining.",
    image: u("photo-8WO2s6Yr0Ok"),
    images: [u("photo-8WO2s6Yr0Ok"), u("photo-mBM4gHAj4XE")],
  },
  {
    name: "Wall Clock", brand: "Ajanta", category: "Lifestyle", price: 1299,
    size: "30 cm diameter", colors: ["Gold", "Silver"], boxContents: "1× wall clock, 1× AA battery, wall mounting hook",
    description: "Silent sweep quartz wall clock. No tick sound. Aluminium frame, clear acrylic lens. Easy wall mount.",
    image: u("photo-6O_XAbQ8eic"),
    images: [u("photo-6O_XAbQ8eic"), u("photo-VxOIFd5QMxM")],
  },
  {
    name: "Foldable Umbrella", brand: "Opus", category: "Lifestyle", price: 399,
    size: "Folds to 28 cm, opens to 96 cm", colors: ["Orange", "Pink", "Blue"], boxContents: "1× foldable umbrella, sleeve case",
    description: "3-fold automatic open/close umbrella. 210T pongee fabric. UV-coated and waterproof. Ergonomic rubber handle.",
    image: u("photo-MfRBxyppd30"),
    images: [u("photo-MfRBxyppd30"), u("photo-d8oZvs7JNn8"), u("photo-PS0-FrvjJ40")],
  },
  {
    name: "Perfume (Body Spray)", brand: "Fogg", category: "Lifestyle", price: 599,
    size: "150 ml spray bottle", colors: ["Clear"], boxContents: "1× perfume spray bottle",
    description: "Long-lasting Eau de Parfum body spray. Fresh floral fragrance. No gas, no compromise. 800+ sprays per bottle.",
    image: u("photo-jmACQEf7T2A"),
    images: [u("photo-jmACQEf7T2A"), u("photo-IcxZMHUOX9k")],
  },
  {
    name: "Analog Watch", brand: "Fastrack", category: "Lifestyle", price: 1499,
    size: "40 mm case, leather strap", colors: ["Silver", "Gold"], boxContents: "Watch, extra link pin, authenticity card, box",
    description: "Casual analog watch with mineral glass lens, stainless steel case, genuine leather strap. 3 ATM water resistant.",
    image: u("photo-C_4s_kXZCrs"),
    images: [u("photo-C_4s_kXZCrs"), u("photo-RNG6GHRBiXk")],
  },
  {
    name: "Cap / Hat", brand: "New Era", category: "Lifestyle", price: 299,
    size: "One size, adjustable snap-back", colors: ["Grey", "Brown", "Black"], boxContents: "1× adjustable cap",
    description: "Structured 6-panel snap-back cap. 100% cotton. Embroidered eyelets. Adjustable closure. Pre-curved brim.",
    image: u("photo-FwVnAY_xMaY"),
    images: [u("photo-FwVnAY_xMaY"), u("photo-MhONMfJOwfE")],
  },
  {
    name: "Tote Bag (Canvas)", brand: "EcoRight", category: "Lifestyle", price: 599,
    size: "40 × 35 cm, 10L capacity", colors: ["White", "Brown"], boxContents: "1× canvas tote bag",
    description: "Heavy-duty 10 oz canvas tote bag. Reinforced strap stitching, inner zip pocket. Reusable and eco-friendly.",
    image: u("photo-smTDI-z1rlY"),
    images: [u("photo-smTDI-z1rlY"), u("photo--zBSu3rYjNs")],
  },
];

const soldOutProducts = [
  {
    name: "Limited Edition Smartwatch Pro", brand: "Apple", category: "Electronics", price: 8999,
    size: "45 mm, titanium", colors: ["Titanium", "Space Black"],
    boxContents: "Watch, magnetic fast charger, sport band (S/M), sport band (M/L)",
    description: "Ultra-premium smartwatch with AMOLED display, ECG sensor, crash detection, and titanium case. Sold out — join waitlist!",
    image: u("photo-1579586337278-3befd40fd17a"),
    images: [u("photo-1579586337278-3befd40fd17a")],
  },
  {
    name: "Organic Vitamin C Serum (20%)", brand: "Paula's Choice", category: "Skincare", price: 1299,
    size: "30 ml dropper", colors: [],
    boxContents: "1× Vitamin C serum, 1× pipette dropper",
    description: "Cult-favourite 20% Vitamin C with ferulic acid and vitamin E. Always sells out within hours of restocking.",
    image: u("photo-1571781926291-c477ebfd024b"),
    images: [u("photo-1571781926291-c477ebfd024b")],
  },
  {
    name: "Pro Resistance Band Set", brand: "Rogue", category: "Fitness", price: 1499,
    size: "Set of 5, heavy duty", colors: ["Multicolor"],
    boxContents: "5× heavy-duty resistance bands, door anchor, carry bag, handles pair",
    description: "Professional-grade 41-inch loop resistance bands used by Olympic athletes. Massive demand, limited supply.",
    image: u("photo-1598971457999-ca4ef48a9a71"),
    images: [u("photo-1598971457999-ca4ef48a9a71")],
  },
];

function rand() { return Math.floor(Math.random() * 16) + 5; }

async function main() {
  console.log("🌱 Seeding...");
  await prisma.reservationEvent.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const whs = await Promise.all(warehouses.map(w => prisma.warehouse.create({ data: w })));
  console.log(`✅ ${whs.length} warehouses`);

  const reg = await Promise.all(regularProducts.map(p => prisma.product.create({ data: p })));
  const sol = await Promise.all(soldOutProducts.map(p => prisma.product.create({ data: p })));
  console.log(`✅ ${reg.length} regular + ${sol.length} sold-out products`);

  const inv = [...reg, ...sol].flatMap(p => whs.map(w => ({
    productId: p.id, warehouseId: w.id,
    totalStock: sol.some(s => s.id === p.id) ? 0 : rand(),
    reservedStock: 0,
  })));
  await prisma.inventory.createMany({ data: inv });
  console.log(`✅ ${inv.length} inventory records`);
  console.log("🎉 Done!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
