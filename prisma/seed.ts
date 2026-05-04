// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const warehouses = [
  { name: "Chennai Warehouse",   location: "Chennai, Tamil Nadu",   city: "Chennai",   lat: 13.0827, lng: 80.2707 },
  { name: "Bangalore Warehouse", location: "Bangalore, Karnataka",  city: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai Warehouse",    location: "Mumbai, Maharashtra",   city: "Mumbai",    lat: 19.0760, lng: 72.8777 },
  { name: "Delhi Warehouse",     location: "New Delhi, Delhi",      city: "Delhi",     lat: 28.6139, lng: 77.2090 },
  { name: "Hyderabad Warehouse", location: "Hyderabad, Telangana",  city: "Hyderabad", lat: 17.3850, lng: 78.4867 },
];

function img(id: string, w = 600): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

const regularProducts = [
  // ── Healthcare ─────────────────────────────────────────────────────────────
  {
    name: "BP Monitor", brand: "Omron", category: "Healthcare", price: 1899,
    size: "Standard cuff (22–32 cm)", colors: [],
    boxContents: "BP Monitor unit, arm cuff, 4× AA batteries, carry pouch, instruction manual",
    description: "Automatic upper-arm blood pressure monitor with irregular heartbeat detection. Large LCD display. Stores 60 readings.",
    image: img("photo-1631815588090-d4bfec5b1ccb"),
    images: [img("photo-1631815588090-d4bfec5b1ccb")],
  },
  {
    name: "Glucose Monitor", brand: "Accu-Chek", category: "Healthcare", price: 1299,
    size: "Compact, 95×55×18 mm", colors: [],
    boxContents: "Glucometer, 10 test strips, lancing device, 10 lancets, carry case, manual",
    description: "Smart blood glucose monitoring system. Results in 4 seconds. No coding required. Bluetooth app sync.",
    image: img("photo-1607619056574-7b8d3ee536b2"),
    images: [img("photo-1607619056574-7b8d3ee536b2")],
  },
  {
    name: "Digital Thermometer", brand: "Dr. Morepen", category: "Healthcare", price: 349,
    size: "14.5 cm", colors: ["Yellow", "Purple"],
    boxContents: "Thermometer, 1× LR41 battery, protective cap, instruction sheet",
    description: "Fast & accurate digital thermometer with beep alert. Reads oral/axillary temperature in 10 seconds.",
    image: img("photo-1584308666744-24d5c474f2ae"),
    images: [img("photo-1584308666744-24d5c474f2ae")],
  },
  {
    name: "Pulse Oximeter", brand: "HealthSense", category: "Healthcare", price: 699,
    size: "Fits finger sizes 10–25 mm", colors: ["Blue", "Yellow", "Green"],
    boxContents: "Pulse oximeter, 2× AAA batteries, lanyard, carry pouch",
    description: "Fingertip pulse oximeter. Measures SpO2 and pulse rate instantly. Large colour OLED display.",
    image: img("photo-1530026405186-ed1f139313f8"),
    images: [img("photo-1530026405186-ed1f139313f8")],
  },
  {
    name: "First Aid Kit", brand: "Safety First", category: "Healthcare", price: 549,
    size: "25×18×8 cm bag", colors: ["Red"],
    boxContents: "85-piece kit: bandages, gauze pads, antiseptic wipes, scissors, tweezers, thermometer, first aid guide",
    description: "Comprehensive 85-piece emergency first aid kit in a durable red zip bag. Ideal for home, car, and travel.",
    image: img("photo-1603398938378-e54eab446dde"),
    images: [img("photo-1603398938378-e54eab446dde")],
  },
  {
    name: "Hand Sanitizer", brand: "Dettol", category: "Healthcare", price: 199,
    size: "500 ml bottle", colors: [],
    boxContents: "1× 500ml pump bottle",
    description: "70% ethanol hand sanitizing gel. Kills 99.9% of germs without water. Non-sticky formula with moisturizers.",
    image: img("photo-1583947215259-38e31be8751f"),
    images: [img("photo-1583947215259-38e31be8751f")],
  },
  {
    name: "Surgical Face Mask", brand: "3M", category: "Healthcare", price: 99,
    size: "Pack of 50, adult size", colors: ["White", "Blue"],
    boxContents: "50× disposable 3-ply surgical masks in sealed box",
    description: "Pack of 50 disposable 3-ply surgical masks. BIS-certified. Elastic ear loops. Adjustable nose clip.",
    image: img("photo-1584308666744-24d5c474f2ae"),
    images: [img("photo-1584308666744-24d5c474f2ae")],
  },
  {
    name: "Medical Gloves", brand: "Ansell", category: "Healthcare", price: 249,
    size: "Box of 50, sizes S/M/L", colors: ["White", "Blue"],
    boxContents: "50× disposable nitrile examination gloves",
    description: "Box of 50 disposable nitrile examination gloves. Powder-free, latex-free, ambidextrous.",
    image: img("photo-1583947215259-38e31be8751f"),
    images: [img("photo-1583947215259-38e31be8751f")],
  },
  {
    name: "Hot Water Bag", brand: "Nestl", category: "Healthcare", price: 399,
    size: "2L, 30×20 cm", colors: ["Mauve", "Grey"],
    boxContents: "1× rubber hot water bottle with ribbed cover",
    description: "2-litre natural rubber hot water bottle with soft knitted cover. Relief for cramps, back pain, and cold nights.",
    image: img("photo-1607619056574-7b8d3ee536b2"),
    images: [img("photo-1607619056574-7b8d3ee536b2")],
  },
  {
    name: "Sleep Mask", brand: "Manta", category: "Healthcare", price: 250,
    size: "One size fits all, adjustable strap", colors: ["Black"],
    boxContents: "1× sleep mask, storage pouch, foam ear plugs",
    description: "100% blackout contoured sleep mask. Zero pressure on eyes. Adjustable head strap. Ideal for travel.",
    image: img("photo-1619451334792-150fd785ee74"),
    images: [img("photo-1619451334792-150fd785ee74"), img("photo-1599305090598-fe179d501227")],
  },

  // ── Skincare ───────────────────────────────────────────────────────────────
  {
    name: "Face Wash", brand: "Curology", category: "Skincare", price: 999,
    size: "100 ml tube", colors: [],
    boxContents: "1× face wash tube, product information leaflet",
    description: "Gentle sulphate-free foaming face wash. Clears pores, controls oil, brightens skin.",
    image: img("photo-1556228578-0d85b1a4d571"),
    images: [img("photo-1556228578-0d85b1a4d571"), img("photo-1556228720-195a672e8a03")],
  },
  {
    name: "Sunscreen SPF 50", brand: "Everyday Humans", category: "Skincare", price: 799,
    size: "60 ml tube", colors: ["Pink"],
    boxContents: "1× SPF 50 sunscreen tube",
    description: "Lightweight, non-greasy SPF 50 sunscreen. PA++++ UVA/UVB broad-spectrum protection. No white cast.",
    image: img("photo-1556228720-195a672e8a03"),
    images: [img("photo-1556228720-195a672e8a03")],
  },
  {
    name: "Moisturizer", brand: "The Ordinary", category: "Skincare", price: 659,
    size: "60 ml tube", colors: [],
    boxContents: "1× moisturizer tube",
    description: "Natural Moisturizing Factors + HA. Maintains skin barrier with amino acids, fatty acids, and hyaluronic acid.",
    image: img("photo-1608248543803-ba4f8c70ae0b"),
    images: [img("photo-1608248543803-ba4f8c70ae0b"), img("photo-1620916566398-39f1143ab7be")],
  },
  {
    name: "Face Serum", brand: "The Ordinary", category: "Skincare", price: 699,
    size: "30 ml dropper bottle", colors: [],
    boxContents: "1× serum dropper bottle",
    description: "Vitamin C 23% + HA Spheres 2%. Brightening, anti-ageing serum. Reduces dark spots.",
    image: img("photo-1620916566398-39f1143ab7be"),
    images: [img("photo-1620916566398-39f1143ab7be"), img("photo-1556228720-195a672e8a03")],
  },
  {
    name: "Night Cream", brand: "Olay", category: "Skincare", price: 599,
    size: "50 ml jar", colors: [],
    boxContents: "1× night cream jar",
    description: "Regenerating night cream with retinol and peptides. Works overnight to reduce fine lines and firm skin.",
    image: img("photo-1599305090598-fe179d501227"),
    images: [img("photo-1599305090598-fe179d501227"), img("photo-1616394584738-fc6e612e71b9")],
  },
  {
    name: "Face Scrub", brand: "Dear Scrub", category: "Skincare", price: 449,
    size: "100 g jar", colors: [],
    boxContents: "1× face scrub jar",
    description: "Walnut shell and coffee exfoliating face scrub. Removes dead skin cells, unclogs pores.",
    image: img("photo-1567721913486-6585f069b332"),
    images: [img("photo-1567721913486-6585f069b332")],
  },
  {
    name: "Sheet Masks", brand: "Innisfree", category: "Skincare", price: 349,
    size: "Pack of 5, one size fits all", colors: [],
    boxContents: "5× individually wrapped sheet masks",
    description: "Pack of 5 Korean essence-soaked sheet masks. Brightening, hydrating, and soothing variants.",
    image: img("photo-1596755389378-c31d21fd1273"),
    images: [img("photo-1596755389378-c31d21fd1273"), img("photo-1616394584738-fc6e612e71b9")],
  },
  {
    name: "Lip Balm", brand: "Crystal Weed", category: "Skincare", price: 699,
    size: "15 ml stick", colors: ["Black/Yellow"],
    boxContents: "1× lip balm stick",
    description: "Medicated lip balm with shea butter, vitamin E, and SPF 15. Repairs dry, chapped lips.",
    image: img("photo-1571781926291-c477ebfd024b"),
    images: [img("photo-1571781926291-c477ebfd024b")],
  },
  {
    name: "Body Lotion", brand: "Cetaphil", category: "Skincare", price: 749,
    size: "250 ml tube", colors: [],
    boxContents: "1× body lotion tube",
    description: "Intensive moisturizing body lotion. 24-hour hydration with glycerin and sunflower oil.",
    image: img("photo-1515377905703-c4788e51af15"),
    images: [img("photo-1515377905703-c4788e51af15"), img("photo-1556228720-195a672e8a03")],
  },
  {
    name: "Anti-Acne Gel", brand: "Benzac", category: "Skincare", price: 949,
    size: "30 g tube", colors: [],
    boxContents: "1× acne gel tube, instructions",
    description: "2.5% benzoyl peroxide anti-acne gel. Targets pimples, whiteheads, and blackheads. Non-comedogenic.",
    image: img("photo-1598440947619-2c35fc9aa908"),
    images: [img("photo-1598440947619-2c35fc9aa908")],
  },

  // ── Fitness ────────────────────────────────────────────────────────────────
  {
    name: "Dumbbells (Pair, 5kg)", brand: "Kore", category: "Fitness", price: 1499,
    size: "5 kg × 2", colors: ["Black"],
    boxContents: "2× 5 kg rubber-coated hex dumbbells",
    description: "Pair of 5 kg rubber-coated hex dumbbells. Cast iron core, anti-roll hex shape, textured handle.",
    image: img("photo-1534438327276-14e5300c3a48"),
    images: [img("photo-1534438327276-14e5300c3a48"), img("photo-1571019614242-c5c5dee9f50b")],
  },
  {
    name: "Resistance Bands Set", brand: "Boldfit", category: "Fitness", price: 599,
    size: "Set of 5, 10–50 lbs resistance", colors: ["Multicolor"],
    boxContents: "5× latex resistance bands, carry bag, exercise guide",
    description: "Set of 5 colour-coded resistance bands (10, 20, 30, 40, 50 lbs). For all fitness levels.",
    image: img("photo-1517836357463-d25dfeac3438"),
    images: [img("photo-1517836357463-d25dfeac3438")],
  },
  {
    name: "Yoga Mat", brand: "Boldfit", category: "Fitness", price: 799,
    size: "183×61 cm, 6 mm thick", colors: ["Blue", "Black", "Purple"],
    boxContents: "1× yoga mat, carry strap",
    description: "6 mm thick anti-slip TPE yoga mat with alignment lines. Eco-friendly, odour-resistant.",
    image: img("photo-1601925260368-ae2f83cf8b7f"),
    images: [img("photo-1601925260368-ae2f83cf8b7f")],
  },
  {
    name: "Kettlebell (15kg)", brand: "Aurion", category: "Fitness", price: 2299,
    size: "15 kg", colors: ["Black", "Grey"],
    boxContents: "1× 15 kg cast iron kettlebell",
    description: "15 kg solid cast iron kettlebell. Smooth finish, flat base for stability. Wide handle fits both hands.",
    image: img("photo-1581009137042-c552e485697a"),
    images: [img("photo-1581009137042-c552e485697a")],
  },
  {
    name: "Skipping Rope", brand: "Strauss", category: "Fitness", price: 249,
    size: "Adjustable, up to 300 cm", colors: ["Black"],
    boxContents: "1× speed jump rope with handles",
    description: "Speed skipping rope with ball-bearing handles. Adjustable PVC cable. Great for cardio.",
    image: img("photo-1599058945522-28d584b6f0ff"),
    images: [img("photo-1599058945522-28d584b6f0ff"), img("photo-1591258370814-01609b341790")],
  },
  {
    name: "Foam Roller", brand: "Trigger Point", category: "Fitness", price: 999,
    size: "30 cm diameter, 60 cm long", colors: ["Black", "Blue"],
    boxContents: "1× high-density foam roller",
    description: "High-density EVA foam roller for deep tissue massage and myofascial release.",
    image: img("photo-1571019613454-1cb2f99b2d8b"),
    images: [img("photo-1571019613454-1cb2f99b2d8b")],
  },
  {
    name: "Gym Gloves", brand: "RDX", category: "Fitness", price: 499,
    size: "S / M / L / XL", colors: ["Black/Green", "Black/Blue"],
    boxContents: "1× pair gym gloves, wrist wraps",
    description: "Fingerless gym training gloves with wrist support. Padded palm, ventilated back.",
    image: img("photo-1583454110551-21f2fa2afe61"),
    images: [img("photo-1583454110551-21f2fa2afe61")],
  },
  {
    name: "Fitness Tracker Band", brand: "Mi", category: "Fitness", price: 2499,
    size: "S/L band, 18 mm strap", colors: ["Black"],
    boxContents: "Fitness band, charging cable, extra band (L size), quick start guide",
    description: "Smart fitness tracker with heart rate, SpO2, sleep monitoring and 5 ATM water resistance.",
    image: img("photo-1523275335684-37898b6baf30"),
    images: [img("photo-1523275335684-37898b6baf30"), img("photo-1434494878577-86c23bcb06b9")],
  },
  {
    name: "Exercise Ball", brand: "Decathlon", category: "Fitness", price: 699,
    size: "65 cm diameter", colors: ["Purple", "Blue"],
    boxContents: "1× anti-burst exercise ball, foot pump",
    description: "Anti-burst 65 cm stability/exercise ball. 500 kg weight capacity. Textured surface for grip.",
    image: img("photo-1518611012118-696072aa579a"),
    images: [img("photo-1518611012118-696072aa579a")],
  },
  {
    name: "Protein Supplement (1kg)", brand: "MuscleBlaze", category: "Fitness", price: 1799,
    size: "1 kg (33 servings)", colors: [],
    boxContents: "1× 1 kg protein tub, measuring scoop",
    description: "Whey protein isolate, 24g protein per serving. Low fat, low sugar. Chocolate flavour. FSSAI certified.",
    image: img("photo-1579722821273-0f6c7d44362f"),
    images: [img("photo-1579722821273-0f6c7d44362f"), img("photo-1550345332-09e3ac987658")],
  },

  // ── Electronics ────────────────────────────────────────────────────────────
  {
    name: "Bluetooth Earbuds", brand: "boAt", category: "Electronics", price: 1499,
    size: "In-ear, one size", colors: ["Black", "Blue"],
    boxContents: "Earbuds, charging case, USB-C cable, 3 ear tip sizes, quick guide",
    description: "True wireless earbuds with 13 mm drivers, 30-hour total battery, IPX5 water resistance.",
    image: img("photo-1590658268037-6bf12165a8df"),
    images: [img("photo-1590658268037-6bf12165a8df")],
  },
  {
    name: "Power Bank (10,000 mAh)", brand: "Ambrane", category: "Electronics", price: 1299,
    size: "10,000 mAh", colors: ["Blue", "Black"],
    boxContents: "Power bank, USB-A to micro-USB charging cable",
    description: "10,000 mAh slim power bank with dual USB-A output and USB-C input. 12W fast charging.",
    image: img("photo-1609091839311-d5365f9ff1c5"),
    images: [img("photo-1609091839311-d5365f9ff1c5")],
  },
  {
    name: "Smartwatch", brand: "Noise", category: "Electronics", price: 2999,
    size: "44 mm case, silicone band", colors: ["Black", "Silver"],
    boxContents: "Smartwatch, magnetic charging cable, extra band, manual",
    description: "1.8-inch AMOLED display. SpO2, heart rate, sleep tracking. 7-day battery. IP68 waterproof.",
    image: img("photo-1523275335684-37898b6baf30"),
    images: [img("photo-1523275335684-37898b6baf30"), img("photo-1434494878577-86c23bcb06b9")],
  },
  {
    name: "Wireless Mouse", brand: "HP", category: "Electronics", price: 699,
    size: "105×60×35 mm", colors: ["Black", "White"],
    boxContents: "Wireless mouse, USB nano-receiver, 2× AA batteries",
    description: "2.4 GHz wireless mouse with 1600 DPI, 3-button scroll wheel, 15-month battery life.",
    image: img("photo-1527864550417-7fd91fc51a46"),
    images: [img("photo-1527864550417-7fd91fc51a46"), img("photo-1615663245857-ac93bb7c39e7")],
  },
  {
    name: "Mechanical Keyboard", brand: "Keychron", category: "Electronics", price: 1799,
    size: "TKL (87-key), 358×130 mm", colors: ["White/Green", "White/Blue", "White/Red"],
    boxContents: "Keyboard, USB-C cable, key puller, extra keycaps",
    description: "Tenkeyless hot-swappable mechanical keyboard. Gateron G Pro switches. Per-key RGB backlight.",
    image: img("photo-1511467687858-23d96c32e4ae"),
    images: [img("photo-1511467687858-23d96c32e4ae"), img("photo-1587829741301-dc798b83add3"), img("photo-1618384887929-16ec33fab9ef")],
  },
  {
    name: "Portable Speaker", brand: "JBL", category: "Electronics", price: 1999,
    size: "Ø 7.2×8.7 cm", colors: ["Black"],
    boxContents: "Speaker, USB-C charging cable, carabiner, quick guide",
    description: "JBL Go portable waterproof Bluetooth speaker. 5h playtime, IPX7, built-in mic. 360° sound.",
    image: img("photo-1608043152269-423dbba4e7e1"),
    images: [img("photo-1608043152269-423dbba4e7e1")],
  },
  {
    name: "USB Flash Drive (64 GB)", brand: "SanDisk", category: "Electronics", price: 499,
    size: "64 GB, USB 3.0", colors: ["Black"],
    boxContents: "1× USB flash drive",
    description: "SanDisk 64 GB USB 3.0 flash drive. Up to 130 MB/s read speed. Compact sliding design.",
    image: img("photo-1620641788421-7a1c342ea42e"),
    images: [img("photo-1620641788421-7a1c342ea42e")],
  },
  {
    name: "External Hard Drive (4 TB)", brand: "Seagate", category: "Electronics", price: 24499,
    size: "4 TB, 107×70×19 mm", colors: ["Black"],
    boxContents: "Hard drive, USB 3.0 cable, quick start guide",
    description: "Seagate Backup Plus 4 TB portable hard drive. USB 3.0, works with USB 2.0.",
    image: img("photo-1531492746076-161ca9bcad58"),
    images: [img("photo-1531492746076-161ca9bcad58"), img("photo-1518770660439-4636190af475")],
  },
  {
    name: "LED Desk Lamp", brand: "Wipro", category: "Electronics", price: 899,
    size: "45 cm arm length", colors: ["Black", "White"],
    boxContents: "LED desk lamp, USB-C power adapter, instruction manual",
    description: "LED desk lamp with 5 colour temperatures and 5 brightness levels. Touch dimmer, USB charging port.",
    image: img("photo-1507473885765-e6ed057f782c"),
    images: [img("photo-1507473885765-e6ed057f782c")],
  },
  {
    name: "Phone Charger (Fast, 67W)", brand: "Xiaomi", category: "Electronics", price: 799,
    size: "67W GaN, dual port", colors: ["White"],
    boxContents: "67W GaN charger, USB-C to USB-C cable (100W)",
    description: "67W GaN dual-port fast charger (1× USB-C + 1× USB-A). Charges phone to 100% in 46 min.",
    image: img("photo-1583863788434-e58a36330cf0"),
    images: [img("photo-1583863788434-e58a36330cf0")],
  },

  // ── Lifestyle ──────────────────────────────────────────────────────────────
  {
    name: "Water Bottle (Steel, 1L)", brand: "Milton", category: "Lifestyle", price: 499,
    size: "1 litre, Ø7×27 cm", colors: ["Silver", "Black", "Navy"],
    boxContents: "1× insulated steel water bottle with flip lid",
    description: "1L double-wall vacuum-insulated stainless steel bottle. Keeps cold 24h, hot 12h. BPA-free.",
    image: img("photo-1602143407151-7111542de6e8"),
    images: [img("photo-1602143407151-7111542de6e8")],
  },
  {
    name: "Backpack (Casual)", brand: "Wildcraft", category: "Lifestyle", price: 1299,
    size: "30 L, 45×30×15 cm", colors: ["Brown", "Red", "Black"],
    boxContents: "1× backpack with laptop sleeve",
    description: "30L casual backpack with padded 15-inch laptop sleeve, USB charging port, water bottle pockets.",
    image: img("photo-1553062407-98eeb64c6a62"),
    images: [img("photo-1553062407-98eeb64c6a62"), img("photo-1622560480605-d83c853bc5c3")],
  },
  {
    name: "Sunglasses (UV400)", brand: "Ray-Ban", category: "Lifestyle", price: 799,
    size: "Medium frame, lens 52 mm", colors: ["Black", "Tortoise"],
    boxContents: "Sunglasses, hard case, cleaning cloth, authenticity card",
    description: "Polarized UV400 wayfarer sunglasses. CR-39 lenses, G-15 tint. 100% UVA/UVB protection.",
    image: img("photo-1511499767150-a48a237f0083"),
    images: [img("photo-1511499767150-a48a237f0083")],
  },
  {
    name: "Leather Wallet", brand: "Hidesign", category: "Lifestyle", price: 999,
    size: "11.5×9 cm, slim bifold", colors: ["Black", "Brown"],
    boxContents: "1× genuine leather bifold wallet, gift box",
    description: "Genuine leather slim bifold wallet. 6 card slots, 2 currency pockets, ID window. RFID blocking.",
    image: img("photo-1627123424574-724758594e93"),
    images: [img("photo-1627123424574-724758594e93")],
  },
  {
    name: "Wall Clock", brand: "Ajanta", category: "Lifestyle", price: 1299,
    size: "30 cm diameter", colors: ["Gold", "Silver"],
    boxContents: "1× wall clock, 1× AA battery, wall mounting hook",
    description: "Silent sweep quartz wall clock. No tick sound. Aluminium frame, clear acrylic lens.",
    image: img("photo-1563861826100-9cb868fdbe1c"),
    images: [img("photo-1563861826100-9cb868fdbe1c")],
  },
  {
    name: "Foldable Umbrella", brand: "Opus", category: "Lifestyle", price: 399,
    size: "Folds to 28 cm, opens to 96 cm", colors: ["Orange", "Pink", "Blue"],
    boxContents: "1× foldable umbrella, sleeve case",
    description: "3-fold automatic open/close umbrella. 210T pongee fabric. UV-coated and waterproof.",
    image: img("photo-1501999635878-71cb5379c2d8"),
    images: [img("photo-1501999635878-71cb5379c2d8")],
  },
  {
    name: "Perfume (Body Spray)", brand: "Fogg", category: "Lifestyle", price: 599,
    size: "150 ml spray bottle", colors: ["Clear"],
    boxContents: "1× perfume spray bottle",
    description: "Long-lasting Eau de Parfum body spray. Fresh floral fragrance. No gas, no compromise.",
    image: img("photo-1615634260167-c8cdede054de"),
    images: [img("photo-1615634260167-c8cdede054de"), img("photo-1547887538-e3a2f32cb1cc")],
  },
  {
    name: "Analog Watch", brand: "Fastrack", category: "Lifestyle", price: 1499,
    size: "40 mm case, leather strap", colors: ["Silver", "Gold"],
    boxContents: "Watch, extra link pin, authenticity card, box",
    description: "Casual analog watch with mineral glass lens, stainless steel case, genuine leather strap. 3 ATM.",
    image: img("photo-1542496658-e33a6d0d50f6"),
    images: [img("photo-1542496658-e33a6d0d50f6")],
  },
  {
    name: "Cap / Hat", brand: "New Era", category: "Lifestyle", price: 299,
    size: "One size, adjustable snap-back", colors: ["Grey", "Brown", "Black"],
    boxContents: "1× adjustable cap",
    description: "Structured 6-panel snap-back cap. 100% cotton. Embroidered eyelets. Adjustable closure.",
    image: img("photo-1588850561407-ed78c282e89b"),
    images: [img("photo-1588850561407-ed78c282e89b"), img("photo-1521369909029-2afed882baee")],
  },
  {
    name: "Tote Bag (Canvas)", brand: "EcoRight", category: "Lifestyle", price: 599,
    size: "40×35 cm, 10L capacity", colors: ["White", "Brown"],
    boxContents: "1× canvas tote bag",
    description: "Heavy-duty 10 oz canvas tote bag. Reinforced strap stitching, inner zip pocket. Reusable.",
    image: img("photo-1544816155-12df9643f363"),
    images: [img("photo-1544816155-12df9643f363")],
  },
];

const soldOutProducts = [
  {
    name: "Limited Edition Smartwatch Pro", brand: "Apple", category: "Electronics", price: 8999,
    size: "45 mm, titanium", colors: ["Titanium", "Space Black"],
    boxContents: "Watch, magnetic fast charger, sport band (S/M), sport band (M/L)",
    description: "Ultra-premium smartwatch with AMOLED display, ECG sensor, crash detection, titanium case.",
    image: img("photo-1579586337278-3befd40fd17a"),
    images: [img("photo-1579586337278-3befd40fd17a"), img("photo-1551816230-ef5deaed4a26")],
  },
  {
    name: "Organic Vitamin C Serum (20%)", brand: "Paula's Choice", category: "Skincare", price: 1299,
    size: "30 ml dropper", colors: [],
    boxContents: "1× Vitamin C serum, 1× pipette dropper",
    description: "Cult-favourite 20% Vitamin C with ferulic acid and vitamin E. Always sells out within hours.",
    image: img("photo-1556228578-0d85b1a4d571"),
    images: [img("photo-1556228578-0d85b1a4d571"), img("photo-1590439471364-192aa70c0b53")],
  },
  {
    name: "Pro Resistance Band Set", brand: "Rogue", category: "Fitness", price: 1499,
    size: "Set of 5, heavy duty", colors: ["Multicolor"],
    boxContents: "5× heavy-duty resistance bands, door anchor, carry bag, handles pair",
    description: "Professional-grade 41-inch loop resistance bands used by Olympic athletes.",
    image: img("photo-1517836357463-d25dfeac3438"),
    images: [img("photo-1517836357463-d25dfeac3438"), img("photo-1598289431512-b97b0917affc")],
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
  console.log("🎉 Done! Run the app and enjoy real product images.");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
