from PIL import Image, ImageDraw, ImageOps
import sys
import os

def make_circle_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # Create a circular mask
        mask = Image.new('L', img.size, 0)
        draw = ImageDraw.Draw(mask)
        
        # Assume the button is centered and fills the image (or most of it)
        # We'll take the minimum dimension to make a perfect circle
        w, h = img.size
        min_dim = min(w, h)
        
        # Calculate bounding box for the circle
        # We can add a small padding if needed, or crop slightly inside to avoid edges
        # Let's crop slightly inside (98%) to avoid any border artifacts
        padding = min_dim * 0.01
        left = (w - min_dim) / 2 + padding
        top = (h - min_dim) / 2 + padding
        right = (w + min_dim) / 2 - padding
        bottom = (h + min_dim) / 2 - padding
        
        draw.ellipse((left, top, right, bottom), fill=255)
        
        # Apply the mask
        output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        # Crop to the bounding box of the circle to reduce file size and whitespace
        output = output.crop((int(left), int(top), int(right), int(bottom)))
        
        output.save(output_path, "PNG")
        print(f"Successfully processed {input_path} -> {output_path}")
        
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python make_transparent.py <input_path> <output_path>")
    else:
        make_circle_transparent(sys.argv[1], sys.argv[2])
