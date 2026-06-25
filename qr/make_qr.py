#!/usr/bin/env python3
"""Genera un QR estilo frame-2.svg (ojos redondeados + modulos cuadrados con
hueco + isologo central) pero SIN FONDO (transparente), apuntando a una URL.

100% local: segno produce la matriz; el SVG se renderiza a mano para clonar el
estilo. Unidad = 100 (igual que frame-2.svg), asi los ojos copiados encajan.
"""
import segno

URL = "https://barefolio.com/r"
UNIT = 100          # unidades por modulo (como en frame-2.svg)
MARGIN = 4          # quiet zone (modulos) -> espacio transparente, no relleno
DARK = "#101010"
GAP = 0.0625        # hueco por lado (0.25/4 en frame-2.svg)
LOGO_FRAC = 0.30    # ancho del logo respecto al QR
CLEAR_FRAC = 0.34   # zona central de modulos vaciada bajo el logo

# Ojos copiados VERBATIM de frame-2.svg (espacio 0..700 = 7 modulos * 100).
EYE_RING = ("M21.2-0.1C9.5-0.1-0.1,9.5-0.1,21.2v78.8v100v100v100v100v100v78.8"
            "c0,11.7,9.5,21.3,21.3,21.3h657.6c11.7,0,21.3-9.5,21.3-21.3V600V500"
            "V400V300V200v-100V21.2c0-11.7-9.5-21.3-21.3-21.3H21.2z "
            "M600,200v100v100v100v87.8c0,6.8-5.5,12.2-12.2,12.2H112.2"
            "c-6.8,0-12.2-5.5-12.2-12.2V500V400V300V200v-87.8c0-6.8,5.5-12.2,12.2-12.2"
            "h475.6c6.8,0,12.2,5.5,12.2,12.2V200z")
EYE_DOT = ("M500,400V300v-78.8c0-11.7-9.5-21.3-21.3-21.3H221.2"
           "c-11.7,0-21.3,9.5-21.3,21.3V300v100v78.8c0,11.7,9.5,21.3,21.3,21.3"
           "h257.5c11.7,0,21.3-9.5,21.3-21.3V400z")

# Isologo (public/ISOLOGO BLACK.svg), viewBox 0 0 314 303.
LOGO_VB_W, LOGO_VB_H = 314, 303
LOGO_PATHS = [
    "M10.82,0H0v303h10.82V0Z",
    "M42.88,303h-10.82l-1.72-230.99L34.84,0h10.82l.5,165.82-3.27,137.18h0Z",
    "M76.28,303h-12.22c0-67.48,4.16-202.45,4.16-202.45L83.05,0h12.66l-2.68,182.71s-16.17,114.32-16.74,120.29h-.01Z",
    "M286.13,0h-12.2l-47.07,136.69L215.38,0h-12.21l-39.09,141.45c-1.9-21.08-8.95-99.37-12.86-141.45h-12.21l-30.37,143.96,6.37,159.04h12.21c8.02-33.26,21.03-87.77,29.38-122.81l15.1,122.81h12.19l35.77-128.76,21.17,128.76h12.2l60.96-141.86L286.13,0Z",
]


def main():
    qr = segno.make(URL, error="h")          # correccion alta -> tolera logo
    matrix = [bytearray(row) for row in qr.matrix]
    n = len(matrix)
    off = MARGIN * UNIT
    canvas = (n + 2 * MARGIN) * UNIT

    def in_finder(r, c):
        return ((r < 7 and c < 7) or (r < 7 and c >= n - 7)
                or (r >= n - 7 and c < 7))

    # zona central vaciada para el logo
    clear = int(round(CLEAR_FRAC * n))
    if clear % 2 != n % 2:
        clear += 1                            # misma paridad -> centrado exacto
    cstart = (n - clear) // 2
    cend = cstart + clear

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas} {canvas}" '
        f'width="{canvas}" height="{canvas}" shape-rendering="geometricPrecision">'
    ]
    # SIN <rect> de fondo -> transparente.

    # modulos de datos (cuadrados con hueco), salvo ojos y zona del logo
    sq = (1 - 2 * GAP) * UNIT
    pad = GAP * UNIT
    body = []
    for r in range(n):
        for c in range(n):
            if not matrix[r][c]:
                continue
            if in_finder(r, c):
                continue
            if cstart <= r < cend and cstart <= c < cend:
                continue
            x = off + c * UNIT + pad
            y = off + r * UNIT + pad
            body.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{sq:.0f}" '
                        f'height="{sq:.0f}" fill="{DARK}"/>')
    parts.append("".join(body))

    # ojos redondeados (3 esquinas) copiados de frame-2.svg
    for er, ec in [(0, 0), (0, n - 7), (n - 7, 0)]:
        tx = off + ec * UNIT
        ty = off + er * UNIT
        parts.append(
            f'<g transform="translate({tx:.0f},{ty:.0f})" fill="{DARK}">'
            f'<path d="{EYE_RING}"/><path d="{EYE_DOT}"/></g>'
        )

    # logo central
    logo_w = LOGO_FRAC * n * UNIT
    scale = logo_w / LOGO_VB_W
    logo_h = LOGO_VB_H * scale
    lx = canvas / 2 - logo_w / 2
    ly = canvas / 2 - logo_h / 2
    logo_inner = "".join(f'<path d="{d}"/>' for d in LOGO_PATHS)
    parts.append(
        f'<g transform="translate({lx:.1f},{ly:.1f}) scale({scale:.4f})" '
        f'fill="{DARK}">{logo_inner}</g>'
    )

    parts.append("</svg>")
    svg = "\n".join(parts)
    with open("qr/barefolio-qr-styled.svg", "w") as f:
        f.write(svg)
    print(f"version: {qr.version}  modules: {n}x{n}  clear: {clear}  canvas: {canvas}")
    print("wrote qr/barefolio-qr-styled.svg")


if __name__ == "__main__":
    main()
