"""Prepare the real previews and the clearly labelled point-cloud placeholder."""

from base64 import b64encode
from pathlib import Path
import json
from random import Random
import shutil
from struct import pack
import subprocess
from zipfile import ZipFile


SITE = Path(__file__).resolve().parents[1]
OUTPUTS = SITE.parent / "outputs"
PHYSIR = OUTPUTS / "physir_dynamicltr_scene17_20261116" / "delivery"
SELECTION = PHYSIR / "selection" / "scene17"
BASELINES = OUTPUTS / "dggt_ljbprotocol_20261115" / "ljb_protocol_results_20261115.zip"
ASSETS = SITE / "assets"
FRAME_RATE = 5
FRAME_COUNT = 20
WIDTH, HEIGHT = 518, 350
INTERPOLATION = (1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14)
POSITION_SCALE = 256
FFMPEG = ["ffmpeg", "-nostdin", "-v", "error"]


def decode_pngs(pngs, pixel_format, channels):
    raw = subprocess.run(
        [*FFMPEG, "-f", "image2pipe", "-c:v", "png", "-i", "pipe:0",
         "-f", "rawvideo", "-pix_fmt", pixel_format, "pipe:1"],
        input=b"".join(pngs), stdout=subprocess.PIPE, check=True,
    ).stdout
    frame_size = WIDTH * HEIGHT * channels
    if len(raw) != len(pngs) * frame_size:
        raise ValueError(f"Unexpected {pixel_format} frame count or dimensions.")
    return [raw[offset:offset + frame_size] for offset in range(0, len(raw), frame_size)]


def read_sequence(directory, names, pixel_format, channels):
    return decode_pngs([(directory / name).read_bytes() for name in names], pixel_format, channels)


def encode_preview(name, frames):
    raw_input = ["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}",
                 "-r", str(FRAME_RATE), "-i", "pipe:0"]
    subprocess.run(
        [*FFMPEG, "-y", *raw_input, "-frames:v", "1", "-q:v", "2", str(ASSETS / f"{name}.jpg")],
        input=frames[0], check=True,
    )
    subprocess.run(
        [*FFMPEG, "-y", *raw_input, "-an", "-c:v", "libx264", "-preset", "fast",
         "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(ASSETS / f"{name}.mp4")],
        input=b"".join(frames), check=True,
    )


def mask_overlay(frame, mask):
    rgb = bytearray(frame.translate(bytes(round(shade * 0.78) for shade in range(256))))
    tint = (245, 132, 62)
    outline = bytes((255, 187, 111))
    for index, moving in enumerate(mask):
        if not moving:
            continue
        offset = index * 3
        rgb[offset:offset + 3] = bytes(round(frame[offset + c] * 0.30 + tint[c] * 0.70) for c in range(3))
        row, column = divmod(index, WIDTH)
        for nx, ny in ((column - 1, row), (column + 1, row), (column, row - 1), (column, row + 1)):
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                neighbor = ny * WIDTH + nx
                if not mask[neighbor]:
                    rgb[neighbor * 3:neighbor * 3 + 3] = outline
    return bytes(rgb)


def export_comparisons(frames):
    compare = ASSETS / "compare"
    for method in ("reference", "physir", "tapip3d", "rife"):
        (compare / method).mkdir(parents=True, exist_ok=True)

    with ZipFile(BASELINES) as archive:
        names = [f"{index:05d}.png" for index in INTERPOLATION]
        archived_gt = decode_pngs([archive.read(f"baselines/gt/scene17/{name}") for name in names], "rgb24", 3)
        for index, filename, reference in zip(INTERPOLATION, names, archived_gt, strict=True):
            if reference != frames[index]:
                raise ValueError(f"The ground truth differs between runs at frame {index}.")
            shutil.copyfile(SELECTION / "gt" / filename, compare / "reference" / filename)
            shutil.copyfile(PHYSIR / "renders" / "static" / filename, compare / "physir" / filename)
            for label, run in (("tapip3d", "tapip3d"), ("rife", "rife_replace")):
                result = archive.read(f"baselines/{run}/render/scene17/{filename}")
                (compare / label / filename).write_bytes(result)


def motion_bottoms(mask):
    bottoms = [0] * WIDTH
    for index, moving in enumerate(mask):
        if moving:
            row, column = divmod(index, WIDTH)
            bottoms[column] = row
    return [max(bottoms[max(0, x - 8):x + 9]) for x in range(WIDTH)]


def export_cloud(frames, masks):
    # These illustrative depths project pixels onto an approximate road and facade.
    focal = WIDTH * 0.82
    horizon = int(HEIGHT * 0.485)
    camera_height = 1.65
    random = Random(17)
    samples = [(x + random.randint(-1, 1), y + random.randint(-1, 1))
               for y in range(1, HEIGHT - 2, 4) for x in range(1, WIDTH - 2, 4)]
    encoded_frames = []

    for frame, mask in zip(frames, masks, strict=True):
        bottoms = motion_bottoms(mask)
        points = bytearray()
        for x, y in samples:
            index = y * WIDTH + x
            intensity = frame[index * 3]
            moving = mask[index]
            if y < horizon + 20 and intensity < 91 and not moving:
                continue
            if moving:
                depth = camera_height * focal / max(bottoms[x] - horizon, 28) - 0.40
            elif y >= horizon + 24:
                depth = camera_height * focal / (y - horizon)
            else:
                depth = 25 - 6 * x / WIDTH + (intensity - 128) / 180
            depth = max(3.5, min(depth, 29.0))
            px = (x - WIDTH * 0.5) * depth / focal
            py = camera_height + (horizon - y) * depth / focal
            pz = depth - 13.0
            points.extend(pack("<hhhh", round(px * POSITION_SCALE), round(py * POSITION_SCALE),
                               round(pz * POSITION_SCALE), intensity + 256 * bool(moving)))
        encoded_frames.append(b64encode(points).decode("ascii"))

    data = {"scale": POSITION_SCALE, "frameRate": FRAME_RATE, "frames": encoded_frames}
    output = "window.demoCloud = " + json.dumps(data, separators=(",", ":")) + ";\n"
    (ASSETS / "scene17-cloud.js").write_text(output, encoding="ascii")


def main():
    ASSETS.mkdir(exist_ok=True)
    names = [f"{index:05d}.png" for index in range(FRAME_COUNT)]
    frames = read_sequence(SELECTION / "gt", names, "rgb24", 3)
    moving = read_sequence(SELECTION / "masks" / "moving", names, "gray", 1)
    ignored = read_sequence(SELECTION / "masks" / "ignore", names, "gray", 1)
    masks = [bytes(m > 0 and i == 0 for m, i in zip(positive, ignore, strict=True))
             for positive, ignore in zip(moving, ignored, strict=True)]
    export_comparisons(frames)
    encode_preview("scene17", frames)

    overlays = [mask_overlay(frame, mask) for frame, mask in zip(frames, masks, strict=True)]
    encode_preview("mask-start", overlays[:7])
    encode_preview("mask-middle", overlays[7:14])
    encode_preview("mask-end", overlays[14:] + [overlays[-1]])
    export_cloud(frames, masks)
    print("20 input frames, 12 verified matched comparison frames, 3 mask videos, and 20 cloud frames.")


if __name__ == "__main__":
    main()
