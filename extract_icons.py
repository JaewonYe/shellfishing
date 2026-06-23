"""
Gemini 생성 아이콘 이미지에서 개별 SVG 파일 추출
=================================================
각 아이콘을 크롭 → 여백 제거 → base64 PNG 임베드 SVG로 저장
"""

import sys, os, base64, io
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC = r'C:\Users\User\Desktop\2026\shellfishing\public\icons\species\Gemini_Generated_Image_4okkq14okkq14okk.png'
OUT = r'C:\Users\User\Desktop\2026\shellfishing\public\icons\species'
PAD = 12          # 여백 (px, 원본 해상도 기준)
ICON_SIZE = 120   # 출력 SVG 크기 (px)

# ── 레이블 ────────────────────────────────────────────────────────────────────
LABELS = {
    0: ['바지락','가무락','동죽','가리비','백합','백합2','피조개','고막','새조개','새조개2'],
    1: ['꼬막','개조개','기조개','키조개','비합','가리맛','대합','새고막','떡조개','비단조개'],
    2: ['해삼','전복','낙지','성게','문어','소라','고둥','홍합','개불','갯지렁이','짱뚱어'],
    3: ['미역','천초','파래','가시파래','다시마','돌김','우묵가사리','우렁쉥이','멸치','골뱅이'],
}

# ── 아이콘 영역 (행: r_start~r_end, 열: [(c_start,c_end), ...]) ───────────────
ICON_ROWS = {
    0: (132, 296),
    1: (400, 573),
    2: (756, 960),
    3: (1172, 1389),
}
COL_POS = {
    0: [(122,295),(373,556),(629,810),(885,1069),(1143,1326),
        (1395,1575),(1742,1904),(2024,2178),(2280,2433),(2525,2699)],
    1: [(131,286),(375,553),(628,812),(867,1094),(1158,1322),
        (1393,1576),(1703,1942),(2016,2185),(2266,2446),(2518,2707)],
    2: [(110,305),(379,545),(618,811),(863,1064),(1117,1321),(1388,1534),
        (1616,1753),(1839,1949),(2029,2202),(2283,2443),(2507,2715)],
    3: [(112,297),(353,562),(612,816),(872,1070),(1150,1318),
        (1398,1588),(1654,1857),(2009,2208),(2264,2464),(2552,2685)],
}

# 배경색
BG = np.array([249, 250, 244])


def remove_bg(img_arr: np.ndarray, threshold: int = 18) -> np.ndarray:
    """배경색에 가까운 픽셀의 알파값을 0으로 설정"""
    out = img_arr.copy()
    diff = np.abs(out[:, :, :3].astype(int) - BG).max(axis=2)
    out[diff <= threshold, 3] = 0
    return out


def tight_crop(img_arr: np.ndarray, pad: int) -> np.ndarray:
    """배경을 제거하고 꼭 맞게 크롭 + 여백 추가"""
    diff = np.abs(img_arr[:, :, :3].astype(int) - BG).max(axis=2)
    mask = diff > 12

    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return img_arr

    r0, r1 = np.where(rows)[0][[0, -1]]
    c0, c1 = np.where(cols)[0][[0, -1]]

    h, w = img_arr.shape[:2]
    r0 = max(0, r0 - pad)
    r1 = min(h - 1, r1 + pad)
    c0 = max(0, c0 - pad)
    c1 = min(w - 1, c1 + pad)

    return img_arr[r0:r1+1, c0:c1+1]


def to_square(img_arr: np.ndarray) -> np.ndarray:
    """정사각형으로 만들기 (배경색으로 패딩)"""
    h, w = img_arr.shape[:2]
    size = max(h, w)
    result = np.full((size, size, 4), [*BG, 0], dtype=np.uint8)
    # 중앙 배치
    top  = (size - h) // 2
    left = (size - w) // 2
    result[top:top+h, left:left+w] = img_arr
    return result


def arr_to_png_b64(arr: np.ndarray) -> str:
    img = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def make_svg(b64: str, size: int, name: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="0 0 {size} {size}" width="{size}" height="{size}">\n'
        f'  <!-- {name} -->\n'
        f'  <image href="data:image/png;base64,{b64}" '
        f'x="0" y="0" width="{size}" height="{size}"/>\n'
        f'</svg>'
    )


# ── 메인 ──────────────────────────────────────────────────────────────────────
src_img = Image.open(SRC).convert('RGBA')
src_arr = np.array(src_img)

saved = []
skipped = []

for row_idx, (r_start, r_end) in ICON_ROWS.items():
    labels = LABELS[row_idx]
    cols   = COL_POS[row_idx]

    for col_idx, (c_start, c_end) in enumerate(cols):
        if col_idx >= len(labels):
            continue
        name = labels[col_idx]

        # 1) 원본에서 크롭
        crop_arr = src_arr[r_start:r_end+1, c_start:c_end+1].copy()

        # 2) 배경 픽셀 투명화
        no_bg = remove_bg(crop_arr)

        # 3) 꼭 맞게 크롭 + 여백
        tight = tight_crop(no_bg, PAD)

        # 4) 정사각형
        square = to_square(tight)

        # 5) PNG → base64
        b64 = arr_to_png_b64(square)

        # 6) SVG 생성
        svg = make_svg(b64, ICON_SIZE, name)

        out_path = os.path.join(OUT, f'{name}.svg')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(svg)

        saved.append(name)
        print(f'  [{row_idx},{col_idx}] {name}.svg  ({square.shape[1]}x{square.shape[0]} -> {ICON_SIZE}px)')

print(f'\n완료: {len(saved)}개 저장, {len(skipped)}개 스킵')
print(f'출력: {OUT}')
