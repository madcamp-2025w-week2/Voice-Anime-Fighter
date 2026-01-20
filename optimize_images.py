
import os
from PIL import Image

BACKGROUNDS_DIR = '/root/Voice-Anime-Fighter/frontend/public/images'

# Target images to convert (based on what we added to battleBackgrounds.js)
# and any others matching the pattern
TARGET_FILES = [
    'battle_bg.png',
    'bg_dojo.jpg',
    'bg_tennis.jpg',
    'bg_idol.jpg',
    'bg_mountain.jpg',
    'bg_magic.jpg',
    'bg_skull_island.jpg',
    'bg_night_sakura.jpg',
    'bg_sunset_temple.jpg',
    'bg_akihabara.jpg',
    'bg_shibuya.jpg',
    'bg_titan_wall.jpg',
    'bg_demon_lord.jpg',
    'bg_modern_city.jpg',
    'bg_supermarket.jpg',
    'bg_kaimaru.jpg',
    'bg_night_store.jpg',
    'bg_waterfall_castle.jpg',
    'bg_ice_palace.jpg'
]

def convert_images():
    print("Starting image conversion...")
    
    for filename in os.listdir(BACKGROUNDS_DIR):
        if filename not in TARGET_FILES:
            continue
            
        file_path = os.path.join(BACKGROUNDS_DIR, filename)
        file_root, _ = os.path.splitext(filename)
        output_path = os.path.join(BACKGROUNDS_DIR, f"{file_root}.webp")
        
        try:
            with Image.open(file_path) as img:
                # Rotation for Skull Island
                if filename == 'bg_skull_island.jpg':
                    print(f"Rotating {filename} 90 degrees...")
                    img = img.rotate(-90, expand=True) # -90 is usually correct for "sideways" to "horizontal" if taken in portrait
                
                # Convert to RGB if necessary (e.g. RGBA pngs)
                if img.mode in ('RGBA', 'LA'):
                    # Create a white background for transparency if needed, or keep RGBA if WebP supports it (it does)
                    # For backgrounds, usually we want no transparency, but let's just keep it simple.
                    pass
                
                print(f"Converting {filename} to WebP...")
                img.save(output_path, 'WEBP', quality=85)
                
        except Exception as e:
            print(f"Failed to convert {filename}: {e}")

if __name__ == '__main__':
    convert_images()
