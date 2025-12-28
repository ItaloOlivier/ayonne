// Mapping of local product slugs to Shopify product data
// This ensures we have accurate image URLs and variant IDs for cart functionality

export interface ShopifyProduct {
  handle: string           // Shopify product handle (URL slug)
  variantId: string        // Shopify variant ID for cart
  imageUrl: string         // CDN image URL
  title: string            // Product title
}

// Map our local slugs to Shopify product data
// Keys are our local database slugs, values are Shopify data
export const SHOPIFY_PRODUCT_MAP: Record<string, ShopifyProduct> = {
  // Anti-Aging Serums
  'vitamin-c-lotion': {
    handle: 'vitamin-c-lotion-1',
    variantId: '53383867597148',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Vitamin_C_Lotion_png_d37c9993-9dd1-4850-af2e-85756890baf2.png?v=1730792082',
    title: 'Vitamin C Lotion',
  },
  'collagen-and-retinol-serum': {
    handle: 'collagen-and-retinol-serum-1',
    variantId: '53383867564380',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/3.png?v=1744874274',
    title: 'Collagen and Retinol Serum',
  },
  'vitamin-c-toner': {
    handle: 'vitamin-c-toner-1',
    variantId: '53383867531612',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/0010-7880636202250656289.png?v=1744876090',
    title: 'Ayonne Vitamin C Brightening Toner',
  },
  'hyaluronic-acid-serum': {
    handle: 'hyaluronic-acid-serum-1',
    variantId: '53383867498844',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Hyaluronic_Acid_Serum_png_36a464f9-300e-422a-9b66-be8ba13b9739.png?v=1730792865',
    title: 'Hyaluronic Acid Serum',
  },
  'vitamin-c-cleanser': {
    handle: 'vitamin-c-cleanser-1',
    variantId: '53383867466076',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Vitamin_C_Cleanser_png_7e4bd657-46f7-40b3-85f1-62c4dc3ec985.png?v=1730791567',
    title: 'Vitamin C Cleanser',
  },
  'niacinamide-vitamin-boost-serum': {
    handle: 'niacinamide-vitamin-boost-serum-1',
    variantId: '53383867367772',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Niacinamide_Vitamin_Boost_Serum_png_0039f271-c754-4733-8cfa-01d45654f6a7.png?v=1730791337',
    title: 'Niacinamide Vitamin Boost Serum',
  },
  'firm-serum': {
    handle: 'firm-serum-1',
    variantId: '53383867072860',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Firm_Serum_png_4c8cffbf-eb08-4622-b165-d52fb8d207e8.png?v=1730791143',
    title: 'Firming Serum',
  },
  'firming-serum': {
    handle: 'firm-serum-1',
    variantId: '53383867072860',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Firm_Serum_png_4c8cffbf-eb08-4622-b165-d52fb8d207e8.png?v=1730791143',
    title: 'Firming Serum',
  },
  'anti-aging-rose-gold-oil': {
    handle: 'anti-aging-rose-gold-oil-1',
    variantId: '53383867007324',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/0002-2966083111382356424.png?v=1744873844',
    title: 'Anti-aging Rose Gold Oil',
  },
  'hydration-serum': {
    handle: 'hydration-serum-1',
    variantId: '53383866941788',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/0011-6352790030467445308.png?v=1744876009',
    title: 'Hydration Serum',
  },
  'glycolic-acid-serum': {
    handle: 'glycolic-acid-serum',
    variantId: '49317206499676',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_9.png?v=1727420156',
    title: 'Glycolic Acid Serum',
  },
  'antioxidant-toner': {
    handle: 'antioxidant-toner',
    variantId: '53408161374556',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/0009-6969783180069678538.png?v=1744876709',
    title: 'Antioxidant Toner',
  },

  // Moisturizers
  'embrace-collagen-moisturizer': {
    handle: 'embrace-collagen-moisturizer',
    variantId: '49316840480092',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/7.png?v=1744874321',
    title: 'Embrace Collagen Moisturizer',
  },
  'hyaluronic-moisturizer': {
    handle: 'hyaluronic-moisturizer',
    variantId: '49317127987548',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_23.png?v=1727422995',
    title: 'Hyaluronic Moisturizer',
  },
  'soothing-moisturizer': {
    handle: 'soothing-moisturizer',
    variantId: '49317504000348',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Soothing_Moisturizer_png.png?v=1727594394',
    title: 'Soothing Moisturizer',
  },
  'active-eye-cream': {
    handle: 'active-eye-cream',
    variantId: '49316806762844',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/8.png?v=1744874386',
    title: 'Active Eye Cream',
  },
  'shea-body-butter': {
    handle: 'shea-body-butter',
    variantId: '53383866843484',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/0005-2220737372424472116.png?v=1744874232',
    title: 'Shea Body Butter',
  },

  // Cleansers
  'kale-face-cleanser': {
    handle: 'kale-face-cleanser',
    variantId: '49451030839644',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Kale_Face_Cleanser_png.png?v=1727608643',
    title: 'Kale Face Cleanser',
  },
  'makeup-remover-solution': {
    handle: 'makeup-remover-solution',
    variantId: '49317088239964',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_15.png?v=1727421763',
    title: 'Our Makeup Remover Solution',
  },
  'mint-exfoliating-facial-polish': {
    handle: 'mint-exfoliating-facial-polish',
    variantId: '49317342716252',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_13.png?v=1727421491',
    title: 'Mint Exfoliating Facial Polish',
  },

  // Self Care / Masks
  'glow-mask': {
    handle: 'glow-mask',
    variantId: '49317178155356',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Glow_Mask_3_png.png?v=1727592141',
    title: 'Glow Mask',
  },
  'rose-quartz-roller': {
    handle: 'rose-quartz-roller',
    variantId: '49317449835868',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures_7.png?v=1727590448',
    title: 'Rose Quartz Roller',
  },
  'sculpting-gua-sha-glossy': {
    handle: 'sculpting-gua-sha-glossy',
    variantId: '49317464744284',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_24.png?v=1727423104',
    title: 'Sculpting Gua Sha - Glossy',
  },
  'natural-konjac-sponge': {
    handle: 'natural-konjac-sponge',
    variantId: '49450827251036',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Konjac_Sponge_png.png?v=1727605976',
    title: 'Natural Konjac Sponge',
  },
  'tanning-drops': {
    handle: 'tanning-drops',
    variantId: '49317542207836',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_17.png?v=1727422051',
    title: 'Tanning Drops',
  },

  // Rise & Glow / Cosmetics
  'liquid-shimmer-rosy': {
    handle: 'liquid-shimmer-rosy',
    variantId: '49450826629468',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Liquid_Shimmer_png_c709fa51-0ac9-4de5-8320-488647b8017c.png?v=1727605480',
    title: 'Liquid Shimmer - Rosy',
  },
  'liquid-shimmer-goldie': {
    handle: 'liquid-shimmer-goldie',
    variantId: '49450825875804',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Liquid_Shimmer_png_d9383bc2-41e9-4d74-a024-d163d76637ea.png?v=1727603927',
    title: 'Liquid Shimmer - Goldie',
  },
  'liquid-shimmer-metal': {
    handle: 'liquid-shimmer-metal',
    variantId: '49450824597852',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Liquid_Shimmer_png_accd66db-c8ea-4d26-bbb2-1055268aa98c.png?v=1727605770',
    title: 'Liquid Shimmer - Metal',
  },
  'liquid-shimmer-champagne': {
    handle: 'liquid-shimmer-champagne',
    variantId: '49450826203484',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Liquid_Shimmer_png_28b57d68-f2ef-4bb8-b3c3-f2e9f1db397f.png?v=1727605854',
    title: 'Liquid Shimmer - Champagne',
  },
  'liquid-shimmer-hottie': {
    handle: 'liquid-shimmer-hottie',
    variantId: '49317261517148',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures_4.png?v=1727590054',
    title: 'Liquid Shimmer - Hottie',
  },
  'liquid-shimmer-gatsby': {
    handle: 'liquid-shimmer-gatsby',
    variantId: '49317012709724',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures_5.png?v=1727590163',
    title: 'Liquid Shimmer - Gatsby',
  },
  'highlighter-stick-beige-lights': {
    handle: 'highlighter-stick-beige-lights',
    variantId: '49450825908572',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Highlighter_Stick_png_9f94c459-34fa-4283-ac8f-dbd774c7bb44.png?v=1727603624',
    title: 'Highlighter Stick - Beige Lights',
  },
  'highlighter-stick-bronze-lights': {
    handle: 'highlighter-stick-bronze-lights',
    variantId: '49450825417052',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Highlighter_Stick_png.png?v=1727605618',
    title: 'Highlighter Stick - Bronze Lights',
  },
  'light-touch-blender': {
    handle: 'light-touch-blender',
    variantId: '49450825220444',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Light_Touch_Blender_png.png?v=1727603153',
    title: 'Light Touch Blender',
  },
  'pearl-eye-primer': {
    handle: 'pearl-eye-primer',
    variantId: '49450827316572',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Pearl_Eye_Primer_png.png?v=1727606773',
    title: 'Pearl Eye Primer',
  },
  'oil-control-setting-spray': {
    handle: 'oil-control-setting-spray',
    variantId: '49317355495772',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_14.png?v=1727421614',
    title: 'Oil Control Setting Spray',
  },
  'setting-spray': {
    handle: 'setting-spray',
    variantId: '49317478891868',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Setting_Spray_png.png?v=1727594151',
    title: 'Setting Spray',
  },
  'plumping-lip-gloss': {
    handle: 'plumping-lip-gloss',
    variantId: '49317414068572',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Plumping_Lip_Gloss_png.png?v=1727593972',
    title: 'Plumping Lip Gloss',
  },
  'smoothing-lip-balm': {
    handle: 'smoothing-lip-balm',
    variantId: '49317492261212',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_16.png?v=1727421928',
    title: 'Smoothing Lip Balm',
  },
  'lip-scrub': {
    handle: 'lip-scrub',
    variantId: '49317249196380',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Lip_Scrub_png.png?v=1727592816',
    title: 'Lip Scrub',
  },
  'vegan-lip-balm': {
    handle: 'vegan-lip-balm',
    variantId: '49317559935324',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Vegan_Lip_Balm_png.png?v=1727594547',
    title: 'Vegan Lip Balm',
  },
  'lip-kit-mauve-wife': {
    handle: 'lip-kit-mauve-wife',
    variantId: '49316991049052',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_18.png?v=1727422249',
    title: 'Lip Kit - Mauve Wife',
  },
  'lip-kit-pretty-in-pink': {
    handle: 'lip-kit-pretty-in-pink',
    variantId: '49317227536732',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_19.png?v=1727422390',
    title: 'Lip Kit - Pretty In Pink',
  },
  'lip-kit-life-s-a-peach': {
    handle: 'lip-kit-life-s-a-peach',
    variantId: '49317038170460',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_20.png?v=1727422504',
    title: "Lip Kit - Life's A Peach",
  },
  'lip-kit-red-apple': {
    handle: 'lip-kit-red-apple',
    variantId: '49317236678988',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_21.png?v=1727422628',
    title: 'Lip Kit - Red Apple',
  },
  'everywhere-makeup-bag': {
    handle: 'everywhere-makeup-bag',
    variantId: '49316877179228',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Everywhere_Makeup_Bag_png.png?v=1727591981',
    title: 'Everywhere Makeup Bag',
  },

  // Soaps
  'natural-soap-organic-coconutty': {
    handle: 'natural-soap-organic-coconutty',
    variantId: '49450826924380',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_993347a1-dcdb-4edf-97e1-25bce2597588.png?v=1727606428',
    title: 'Natural Soap - Organic Coconutty',
  },
  'natural-soap-fresh-tumeric': {
    handle: 'natural-soap-fresh-tumeric',
    variantId: '49450826989916',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_b5c43dfa-aecc-40bf-b20c-805b2f5d5c82.png?v=1727606529',
    title: 'Natural Soap - Fresh Tumeric',
  },
  'natural-soap-basil-blast': {
    handle: 'natural-soap-basil-blast',
    variantId: '49450827055452',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_d7f99792-a172-449b-bbcf-ffb1724e1e01.png?v=1727606654',
    title: 'Natural Soap - Basil Blast',
  },
  'natural-soap-lavender-rosemary': {
    handle: 'natural-soap-lavender-rosemary',
    variantId: '49317288517980',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_6059cba1-5cb9-4ea6-b8ec-e117acbeb922.png?v=1727593464',
    title: 'Natural Soap - Lavender & Rosemary',
  },
  'natural-soap-apricot': {
    handle: 'natural-soap-apricot',
    variantId: '49317274787164',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_d64716f4-5736-4ff5-8575-12616a94afc1.png?v=1727593182',
    title: 'Natural Soap - Apricot',
  },
  'natural-soap-eucalyptus-pepperminty': {
    handle: 'natural-soap-eucalyptus-pepperminty',
    variantId: '49317108752732',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_cb41bda1-5319-4afd-a779-7fbf0089e282.png?v=1727593363',
    title: 'Natural Soap - Eucalyptus Pepperminty',
  },
  'natural-soap-citron': {
    handle: 'natural-soap-citron',
    variantId: '49317316731228',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_12.png?v=1727421306',
    title: 'Natural Soap - Citrón',
  },
  'natural-soap-green-tea-lemongrass': {
    handle: 'natural-soap-green-tea-lemongrass',
    variantId: '49317328953692',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_22.png?v=1727422858',
    title: 'Natural Soap - Green Tea & Lemongrass',
  },
  'natural-soap-rose-honey': {
    handle: 'natural-soap-rose-honey',
    variantId: '49317301361004',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_e6867f98-c69b-4646-9f01-459d08933de1.png?v=1727593527',
    title: 'Natural Soap - Rose & Honey',
  },
  'natural-soap-tea-tree': {
    handle: 'natural-soap-tea-tree',
    variantId: '49317391196508',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_29.png?v=1727589103',
    title: 'Natural Soap - Tea Tree',
  },
  'natural-soap-charcoal': {
    handle: 'natural-soap-charcoal',
    variantId: '53411697770844',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/0001-6680427003870238440.png?v=1744960582',
    title: 'Natural Soap - Charcoal',
  },
  'natural-soothing-soap-aloe': {
    handle: 'natural-soothing-soap-aloe',
    variantId: '49317251817820',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures_2.png?v=1727589763',
    title: 'Natural Soothing Soap - Aloe',
  },
  'natural-soap-sunflower-goddess': {
    handle: 'natural-soap-sunflower-goddess',
    variantId: '49450826858844',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Natural_Soap_png_7f8781d6-38a6-4a88-9b4e-a2bc08b1a829.png?v=1727606319',
    title: 'Natural Soap - Sunflower Goddess',
  },

  // Men's Products
  'mens-face-moisturizer': {
    handle: 'mens-face-moisturizer',
    variantId: '49450825154908',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Men_s_Face_Moisturizer_4_png.png?v=1727604412',
    title: "Men's Face Moisturizer",
  },
  'mens-shampoo': {
    handle: 'mens-shampoo',
    variantId: '49450824696156',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Men_s_Shampoo_png.png?v=1727604072',
    title: "Men's Shampoo",
  },
  'mens-under-eye-cream': {
    handle: 'mens-under-eye-cream',
    variantId: '49317100921180',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Men_s_Under_Eye_Cream_2_png.png?v=1727593051',
    title: "Men's Under Eye Cream",
  },
  'beard-oil': {
    handle: 'hemp-infused-beard-growth-oil-unscented',
    variantId: '49451031757148',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Hemp_Infused_Beard_Growth_Oil_png.png?v=1727608338',
    title: 'Hemp Infused Beard Growth Oil',
  },
  'beard-oil-speakeasy': {
    handle: 'beard-oil-speakeasy',
    variantId: '49316856567132',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_28.png?v=1727588810',
    title: 'Beard Oil - Speakeasy',
  },
  'beard-oil-classic': {
    handle: 'beard-oil-classic',
    variantId: '49316856305004',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_28.png?v=1727588810',
    title: 'Beard Oil - Classic',
  },
  'beard-oil-unscented': {
    handle: 'beard-oil-unscented',
    variantId: '49316856469836',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_28.png?v=1727588810',
    title: 'Beard Oil - Unscented',
  },
  'beard-butter': {
    handle: 'beard-butter',
    variantId: '49316856698204',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Beard_Butter_png.png?v=1727590906',
    title: 'Beard Butter',
  },
  'foaming-beard-wash': {
    handle: 'foaming-beard-wash',
    variantId: '49451031069020',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Foaming_Beard_Wash_png.png?v=1727608405',
    title: 'Foaming Beard Wash',
  },
  'bamboo-beard-comb': {
    handle: 'bamboo-beard-comb',
    variantId: '49451031495004',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Bamboo_Beard_Comb_2_png.png?v=1727608551',
    title: 'Bamboo Beard Comb',
  },
  'beard-nylon-brush': {
    handle: 'beard-nylon-brush',
    variantId: '49316856829276',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Beard_Nylon_Brush_2_png.png?v=1727590715',
    title: 'Beard Nylon Brush',
  },
  'grooming-kit': {
    handle: 'grooming-kit',
    variantId: '49317210400092',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Grooming_Kit_png.png?v=1727590979',
    title: 'Grooming Kit',
  },
  'shaving-gel': {
    handle: 'shaving-gel',
    variantId: '49317482889564',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures_3.png?v=1727589914',
    title: 'Shaving Gel',
  },
  'styling-wax': {
    handle: 'styling-wax',
    variantId: '49451030741340',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Styling_Wax_png.png?v=1727608816',
    title: 'Styling Wax',
  },
  'hair-clay': {
    handle: 'hair-clay',
    variantId: '49317219443036',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Hair_Clay_4_png.png?v=1727592407',
    title: 'Hair Clay',
  },
  'solid-fragrance-speakeasy': {
    handle: 'solid-fragrance-speakeasy',
    variantId: '49451031658844',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Solid_Fragrance_png_cc3e0e43-7e02-4cb9-8400-9a05f38764b7.png?v=1727608233',
    title: 'Solid Fragrance - Speakeasy',
  },
  'solid-fragrance-cedar-tobacco': {
    handle: 'solid-fragrance-cedar-tobacco',
    variantId: '49451030905180',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Solid_Fragrance_png.png?v=1727608730',
    title: 'Solid Fragrance - Cedar Tobacco',
  },
  'all-in-one-body-wash': {
    handle: 'all-in-one-body-wash',
    variantId: '49316795982172',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/All-in-one_Body_Wash_png.png?v=1727591256',
    title: 'All-in-one Body Wash',
  },

  // Hair Care
  'daily-repair-shampoo': {
    handle: 'daily-repair-shampoo',
    variantId: '49316870725980',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Daily_Repair_Shampoo_png.png?v=1727591786',
    title: 'Daily Repair Shampoo',
  },
  'daily-repair-conditioner': {
    handle: 'daily-repair-conditioner',
    variantId: '49316869480796',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Daily_Repair_Conditioner_png.png?v=1727591746',
    title: 'Daily Repair Conditioner',
  },
  'hydra-silk-leave-in-conditioner': {
    handle: 'hydra-silk-leave-in-conditioner',
    variantId: '49450827874652',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Hydra_Silk_Leave-In_Conditioner_png.png?v=1727603803',
    title: 'Hydra Silk Leave-In Conditioner',
  },
  'luxe-leave-in-conditioner': {
    handle: 'luxe-leave-in-conditioner',
    variantId: '49317287829852',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures.png?v=1727589439',
    title: 'Luxe Leave-In Conditioner',
  },
  'smooth-sculpt-curl-enhancer': {
    handle: 'smooth-sculpt-curl-enhancer',
    variantId: '49317484134748',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Smooth_Sculpt_Curl_Enhancer_png.png?v=1727594346',
    title: 'Smooth & Sculpt Curl Enhancer',
  },
  'volumizing-hair-spray': {
    handle: 'volumizing-hair-spray',
    variantId: '49317573501276',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Volumizing_Hair_Spray_png.png?v=1727594704',
    title: 'Volumizing Hair Spray',
  },
  'sea-spray': {
    handle: 'sea-spray',
    variantId: '49317472403804',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Blanka_Product_Pictures_6.png?v=1727590286',
    title: 'Sea Spray',
  },
  'nourish-scalp-and-hair-oil': {
    handle: 'nourish-scalp-and-hair-oil',
    variantId: '49317400682844',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Nourish_Scalp_and_Hair_Oil_png.png?v=1727593811',
    title: 'Nourish Scalp and Hair Oil',
  },

  // Body Care
  'nourish-hand-cream': {
    handle: 'nourish-hand-cream',
    variantId: '49317394440540',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Untitled_design_27.png?v=1727423617',
    title: 'Nourish Hand Cream',
  },
  'oil-control-hydrator': {
    handle: 'oil-control-hydrator',
    variantId: '49317403238748',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Oil_Control_Hydrator_png.png?v=1727593848',
    title: 'Oil Control Hydrator',
  },

  // Bundles
  'winter-glow-essentials-set': {
    handle: 'winter-glow-essentials-set',
    variantId: '53383867040092',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Winter_Glow_Essentials_Set_png.png?v=1730790784',
    title: 'Winter Glow Essentials Set',
  },
  'rise-glow-bundle': {
    handle: 'rise-glow-bundle',
    variantId: '49485577879900',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/image_EPF.webp?v=1729679463',
    title: 'Rise & Glow Bundle',
  },
  'mens-grooming-essentials-bundle': {
    handle: 'men-s-grooming-essentials-bundle',
    variantId: '49479162036572',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/BlankaProductPictures_13.png?v=1728031666',
    title: "Men's Grooming Essentials Bundle",
  },
  'biohackers-skin-longevity-bundle': {
    handle: 'biohackers-skin-longevity-bundle',
    variantId: '49478736707932',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0853/5257/9420/files/Bundle_images.png?v=1729752299',
    title: "Biohacker's Skin Longevity Bundle",
  },
}

// Get Shopify product data by local slug
export function getShopifyProduct(localSlug: string): ShopifyProduct | null {
  return SHOPIFY_PRODUCT_MAP[localSlug] || null
}

// Get Shopify image URL by local slug
export function getShopifyImageUrl(localSlug: string): string | null {
  const product = SHOPIFY_PRODUCT_MAP[localSlug]
  return product?.imageUrl || null
}

// Get Shopify variant ID by local slug
export function getShopifyVariantId(localSlug: string): string | null {
  const product = SHOPIFY_PRODUCT_MAP[localSlug]
  return product?.variantId || null
}

// Build cart URL for multiple products using variant IDs
// Format: /cart/variant_id:quantity,variant_id:quantity
// Optionally append discount code
export function buildShopifyCartUrl(slugs: string[], discountCode?: string): string {
  const items: string[] = []

  for (const slug of slugs) {
    const product = SHOPIFY_PRODUCT_MAP[slug]
    if (product && product.variantId) {
      items.push(`${product.variantId}:1`)
    }
  }

  if (items.length === 0) {
    return 'https://ayonne.skin'
  }

  let url = `https://ayonne.skin/cart/${items.join(',')}`

  // Append discount code if provided
  if (discountCode) {
    url += `?discount=${encodeURIComponent(discountCode)}`
  }

  return url
}

// Build checkout URL with discount pre-applied
export function buildShopifyCheckoutUrl(slugs: string[], discountCode?: string): string {
  const cartUrl = buildShopifyCartUrl(slugs, discountCode)
  // Shopify will apply the discount code when the cart is loaded
  return cartUrl
}
