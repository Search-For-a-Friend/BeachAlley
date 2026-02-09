# ComfyUI Workflow Prompt - Beach Alley Establishments

## 🎯 **CORE PROMPT STRUCTURE**

```
((masterpiece, best quality, absurdres)), 
isometric_beach_resort, synthwave_aesthetic, 
3D_CGI, cell_shading, cute_chibi_style, 
miniature_toy_figure, highly_detailed, 
retrofuturistic_architecture, neon_lighting,

tropical_beach_setting, sunset_orange #FF6B35, 
neon_pink #FF0080, tropical_cyan #00FFFF, 
electric_blue #0080FF, palm_purple #9B4DCA,

(beach_essentials:1.2),
umbrella_rental_station, lounge_chair_setup, 
lifeguard_tower, shower_station, beach_towel_kiosk,

(food_beverage:1.2),
ice_cream_stand, snack_bar, beach_café, 
cocktail_lounge, fine_dining_restaurant, food_truck_zone,

(entertainment_activities:1.2),
beach_volleyball_court, surfboard_rental, 
jet_ski_station, mini_golf_course, arcade_pavilion, concert_stage,

(retail_services:1.2),
souvenir_shop, sunscreen_supplies, surf_shop, 
beach_photography, spa_massage, boutique_hotel,

(nightlife_premium:1.2),
beach_bar, dance_floor, dj_booth, 
vip_club, casino, fireworks_station,

(accommodation_luxury:1.2),
hotel, beach_club, water_sports_center,

(markets_commerce:1.2),
market, caravan,

64x64px_tiles, transparent_background, 
unified_art_direction, synthwave_color_palette,
neon_glow_effects, gradient_dithering,
clean_silhouettes, instant_recognition,
toy_like_appearance, miniature_scale
```

## 🎨 **STYLE MODIFIERS**

### **Primary Style**
- `3D_CGI, cell_shading, cute_chibi_style`
- `miniature_toy_figure, highly_detailed`
- `synthwave_aesthetic, retrofuturistic_architecture`
- `neon_lighting, glow_effects`

### **Quality & Detail**
- `((masterpiece, best quality, absurdres))`
- `highly_detailed, intricate_designs`
- `clean_edges, professional_polish`
- `consistent_lighting, proper_shading`

### **Color & Atmosphere**
- `sunset_orange #FF6B35, neon_pink #FF0080`
- `tropical_cyan #00FFFF, electric_blue #0080FF`
- `palm_purple #9B4DCA, golden_sand #FFD93D`
- `gradient_effects, atmospheric_lighting`

## 🏗️ **ESTABLISHMENT KEYWORDS**

### **Beach Essentials**
```
umbrella_rental_station:1.1, small_kiosk, umbrella_display,
lounge_chair_setup:1.1, organized_chairs, beach_arrangement,
lifeguard_tower:1.1, elevated_tower, rescue_equipment,
shower_station:1.1, outdoor_showers, beach_facilities,
beach_towel_kiosk:1.1, rental_booth, towel_service
```

### **Food & Beverage**
```
ice_cream_stand:1.1, colorful_cart, umbrella_shade,
snack_bar:1.1, outdoor_counter, casual_service,
beach_café:1.1, small_café, terrace_seating,
cocktail_lounge:1.1, sophisticated_bar, outdoor_seating,
fine_dining_restaurant:1.1, elegant_beachfront, upscale_dining,
food_truck_zone:1.1, multiple_trucks, mobile_vending
```

### **Entertainment & Activities**
```
beach_volleyball_court:1.1, sand_court, net_setup,
surfboard_rental:1.1, board_storage, rental_shop,
jet_ski_station:1.1, water_sports, rental_dock,
mini_golf_course:1.1, tropical_theme, putting_course,
arcade_pavilion:1.1, indoor_gaming, entertainment_facility,
concert_stage:1.1, outdoor_venue, performance_stage
```

### **Retail & Services**
```
souvenir_shop:1.1, beach_themed, retail_store,
sunscreen_supplies:1.1, beach_essentials, supply_shop,
surf_shop:1.1, surfing_equipment, apparel_store,
beach_photography:1.1, photo_service, tourist_kiosk,
spa_massage:1.1, wellness_facility, relaxation_center,
boutique_hotel:1.1, small_luxury, beach_accommodation
```

### **Nightlife & Premium**
```
beach_bar:1.1, casual_evening, drinking_spot,
dance_floor:1.1, outdoor_dancing, entertainment_area,
dj_booth:1.1, elevated_setup, music_equipment,
vip_club:1.1, exclusive_venue, luxury_nightlife,
casino:1.1, gaming_establishment, entertainment_complex,
fireworks_station:1.1, event_launch, celebration_area
```

### **Accommodation & Luxury**
```
hotel:1.1, multi_story, beachfront_accommodation,
beach_club:1.1, premium_access, luxury_facility,
water_sports_center:1.1, comprehensive_activities, water_hub
```

### **Markets & Commerce**
```
market:1.1, open_air, market_stalls,
caravan:1.1, mobile_vendor, food_vehicle
```

## 📐 **TECHNICAL SPECIFICATIONS**

### **Format & Layout**
```
isometric_projection, 2:1_ratio, 64x64px_tiles,
transparent_background, PNG_format, alpha_channel,
sprite_sheet_layout, 6x6_grid, 36_total_slots,
consistent_scale, proper_alignment, clean_edges
```

### **Quality Control**
```
no_animations, single_frame, static_sprites,
no_people, buildings_only, facilities_only,
consistent_style, synthwave_aesthetic,
proper_scaling, realistic_relationships,
professional_quality, commercial_ready
```

## 🎭 **ARTISTIC DIRECTION**

### **Synthwave Elements**
```
neon_signage, lighting_effects, gradient_reflections,
retrofuturistic_architecture, palm_tree_silhouettes,
grid_patterns, geometric_designs, glowing_edges,
ambient_lighting, sunset_golden_hour, neon_glow
```

### **Architectural Style**
```
modern_tropical, retrofuturistic_influences,
clean_lines, bold_shapes, mixed_materials,
glass_chrome, tropical_wood, open_air_designs,
seamless_transitions, beach_access_emphasis
```

### **Toy/Miniature Feeling**
```
cute_chibi_style, miniature_scale, toy_like_appearance,
playful_design, charming_aesthetic, collectible_look,
detailed_craftsmanship, miniature_figure_style,
toy_box_feeling, playful_proportions
```

## 🚫 **NEGATIVE PROMPTS**

```
low_quality, worst_quality, blurry, pixelated, 
artifacts, distortion, anti_aliasing, 
animations, variations, people, characters,
inconsistent_style, wrong_scale, misaligned,
opaque_background, solid_colors, no_transparency,
realistic_photography, photo_realistic, 
hand_drawn, sketchy, watercolor, oil_painting
```

## ⚙️ **COMFYUI WORKFLOW SETTINGS**

### **Sampling Parameters**
- **Sampler**: DPM++ 2M Karras
- **Steps**: 20-30
- **CFG Scale**: 7-9
- **Seed**: Randomized per batch
- **Size**: 1024x1024 (downscale to 64x64)

### **Model Recommendations**
- **Base Model**: SDXL 1.0 or custom trained synthwave model
- **Refiner**: Optional for detail enhancement
- **VAE**: Standard SDXL VAE
- **ControlNet**: Isometric depth map for consistency

### **Batch Processing**
- **Batch Size**: 4-8 images per generation
- **Grid Layout**: Auto-arrange 6x6 sprite sheet
- **Upscaling**: 2x then downscale for crisp edges
- **Format**: PNG with transparency preservation
