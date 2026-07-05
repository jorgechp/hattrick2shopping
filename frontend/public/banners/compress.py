from pathlib import Path
from PIL import Image
from io import BytesIO
import argparse

# ----------------------------------------------------
# Configuración
# ----------------------------------------------------

SIZES = {
    "mobile": {
        "width": 800,
        "target_kb": 90,
    },
    "tablet": {
        "width": 1280,
        "target_kb": 180,
    },
    "desktop": {
        "width": 1920,
        "target_kb": 300,
    },
}

SUPPORTED = {".png", ".jpg", ".jpeg", ".webp"}

MIN_QUALITY = 45
MAX_QUALITY = 92

# ----------------------------------------------------


def parse_args():
    parser = argparse.ArgumentParser(
        description="Optimiza imágenes para la web."
    )

    parser.add_argument(
        "directory",
        nargs="?",
        default=Path(__file__).parent,
        help="Directorio de imágenes (por defecto el del script).",
    )

    parser.add_argument(
        "--output",
        default=None,
        help="Directorio de salida (por defecto ./optimized).",
    )

    return parser.parse_args()


def resize(image: Image.Image, target_width: int):

    width, height = image.size

    if width <= target_width:
        return image.copy()

    new_height = round(height * target_width / width)

    return image.resize(
        (target_width, new_height),
        Image.Resampling.LANCZOS,
    )


def encode_webp(image: Image.Image, quality: int):

    buffer = BytesIO()

    image.save(
        buffer,
        format="WEBP",
        quality=quality,
        method=6,
        optimize=True,
    )

    return buffer.getvalue()


def find_best_quality(image: Image.Image, target_kb: int):

    target_bytes = target_kb * 1024

    low = MIN_QUALITY
    high = MAX_QUALITY

    best_quality = MIN_QUALITY
    best_data = encode_webp(image, MIN_QUALITY)

    while low <= high:

        mid = (low + high) // 2

        data = encode_webp(image, mid)

        if len(data) <= target_bytes:

            best_quality = mid
            best_data = data

            low = mid + 1

        else:

            high = mid - 1

    return best_quality, best_data


def is_inside(path: Path, parent: Path):

    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


# ----------------------------------------------------


def main():

    args = parse_args()

    input_dir = Path(args.directory).resolve()

    output_dir = (
        Path(args.output).resolve()
        if args.output
        else input_dir / "optimized"
    )

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nEntrada : {input_dir}")
    print(f"Salida  : {output_dir}")

    files = [

        f

        for f in input_dir.rglob("*")

        if (
            f.is_file()
            and f.suffix.lower() in SUPPORTED
            and not is_inside(f, output_dir)
        )

    ]

    if not files:
        print("\nNo se encontraron imágenes.")
        return

    print(f"\nEncontradas {len(files)} imágenes.\n")

    for image_path in files:

        print("=" * 70)
        print(image_path.relative_to(input_dir))

        try:

            image = Image.open(image_path)
            image.load()

        except Exception as e:

            print(f"Error: {e}")
            continue

        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA")

        original_width, original_height = image.size

        print(f"Original : {original_width}x{original_height}")

        for label, config in SIZES.items():

            target_width = config["width"]
            target_kb = config["target_kb"]

            # Desktop = tamaño máximo disponible
            effective_width = min(original_width, target_width)

            resized = resize(image, effective_width)

            quality, data = find_best_quality(
                resized,
                target_kb,
            )

            outfile = (
                output_dir
                / f"{image_path.stem}-{label}.webp"
            )

            outfile.write_bytes(data)

            width, height = resized.size

            print(
                f"{label:9}"
                f"{width:4}x{height:<4}   "
                f"Q={quality:<2}   "
                f"{len(data)/1024:7.1f} KB"
            )

    print("\n✔ Optimización terminada.")


# ----------------------------------------------------

if __name__ == "__main__":
    main()
