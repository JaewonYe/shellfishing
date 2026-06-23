"""
마을어장 양식 품목 아이콘 SVG 생성 스크립트
================================================
public/icons/species/ 에 SVG 아이콘을 생성합니다.
"""

import os

OUT_DIR = r'C:\Users\User\Desktop\2026\shellfishing\public\icons\species'
os.makedirs(OUT_DIR, exist_ok=True)


def icon(bg: str, body: str) -> str:
    """48×48 원형 배경 SVG 아이콘 템플릿"""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'
        f'<circle cx="24" cy="24" r="24" fill="{bg}"/>'
        f'{body}'
        '</svg>'
    )


W = 'fill="white"'        # 흰색 채우기
WS = 'stroke="white"'     # 흰색 선
NF = 'fill="none"'        # 채우기 없음

ICONS: dict[str, str] = {}

# ─────────────────────────────────────────────
# 전복 (Abalone)  #1565c0 파랑
# 납작한 타원 껍데기 + 호흡공 열
# ─────────────────────────────────────────────
ICONS['전복'] = icon('#1565c0', f'''
  <ellipse cx="24" cy="29" rx="16" ry="9" {W} opacity="0.95"/>
  <ellipse cx="24" cy="29" rx="16" ry="9" {NF} {WS} stroke-width="0.8" opacity="0.3"/>
  <path d="M10 27 Q24 20 38 27" {NF} {WS} stroke-width="1.2" opacity="0.35"/>
  <path d="M10 30 Q24 23 38 30" {NF} {WS} stroke-width="1.2" opacity="0.25"/>
  <circle cx="18" cy="22" r="2" fill="#1565c0" opacity="0.75"/>
  <circle cx="22" cy="21" r="2" fill="#1565c0" opacity="0.75"/>
  <circle cx="26" cy="21" r="2" fill="#1565c0" opacity="0.75"/>
  <circle cx="30" cy="22" r="2" fill="#1565c0" opacity="0.75"/>
''')

# ─────────────────────────────────────────────
# 해삼 (Sea cucumber)  #00695c 청록
# 울퉁불퉁한 타원형 몸통
# ─────────────────────────────────────────────
ICONS['해삼'] = icon('#00695c', f'''
  <path d="M10 28 Q12 18 24 17 Q36 18 38 26 Q36 35 24 35 Q12 35 10 28 Z" {W} opacity="0.9"/>
  <circle cx="16" cy="22" r="2.8" {W} opacity="0.55"/>
  <circle cx="22" cy="19" r="2.8" {W} opacity="0.55"/>
  <circle cx="28" cy="19" r="2.8" {W} opacity="0.55"/>
  <circle cx="34" cy="23" r="2.5" {W} opacity="0.45"/>
  <circle cx="14" cy="28" r="2"   {W} opacity="0.4"/>
  <ellipse cx="11" cy="27" rx="2" ry="1.5" {W} opacity="0.5"/>
  <ellipse cx="37" cy="27" rx="2" ry="1.5" {W} opacity="0.5"/>
''')

# ─────────────────────────────────────────────
# 바지락 (Manila clam)  #455a64 남색-회색
# 두 장의 방사형 리브 있는 조개
# ─────────────────────────────────────────────
ICONS['바지락'] = icon('#455a64', f'''
  <path d="M24 14 Q38 14 38 28 Q38 36 24 36 Q10 36 10 28 Q10 14 24 14 Z" {W} opacity="0.9"/>
  <line x1="24" y1="14" x2="24" y2="36" stroke="#455a64" stroke-width="1" opacity="0.25"/>
  <path d="M24 14 Q30 20 38 28" {NF} stroke="#455a64" stroke-width="1" opacity="0.2"/>
  <path d="M24 14 Q18 20 10 28" {NF} stroke="#455a64" stroke-width="1" opacity="0.2"/>
  <path d="M24 14 Q33 16 38 24" {NF} stroke="#455a64" stroke-width="1" opacity="0.2"/>
  <path d="M24 14 Q15 16 10 24" {NF} stroke="#455a64" stroke-width="1" opacity="0.2"/>
  <path d="M24 14 Q35 22 36 32" {NF} stroke="#455a64" stroke-width="1" opacity="0.2"/>
  <path d="M24 14 Q13 22 12 32" {NF} stroke="#455a64" stroke-width="1" opacity="0.2"/>
  <ellipse cx="24" cy="14" rx="3" ry="2" {W} opacity="0.8"/>
''')

# ─────────────────────────────────────────────
# 굴 (Oyster)  #4527a0 보라
# 울퉁불퉁한 불규칙 타원
# ─────────────────────────────────────────────
ICONS['굴'] = icon('#4527a0', f'''
  <path d="M13 20 Q11 14 18 12 Q26 10 32 14 Q38 17 37 25
           Q36 33 29 36 Q21 38 16 33 Q10 28 13 20 Z" {W} opacity="0.9"/>
  <path d="M16 18 Q22 14 30 17 Q36 21 34 28 Q32 33 25 33
           Q18 33 15 27 Q13 22 16 18 Z" {NF} stroke="#4527a0" stroke-width="1" opacity="0.3"/>
  <path d="M20 16 Q24 22 22 30" {NF} stroke="#4527a0" stroke-width="1.2" opacity="0.25"/>
  <path d="M26 15 Q28 22 26 30" {NF} stroke="#4527a0" stroke-width="1" opacity="0.2"/>
''')

# ─────────────────────────────────────────────
# 가리비 (Scallop)  #1976d2 밝은 파랑
# 부채꼴 + 방사형 갈비뼈
# ─────────────────────────────────────────────
ICONS['가리비'] = icon('#1976d2', f'''
  <path d="M24 36 Q10 36 10 24 Q10 12 24 12 Q38 12 38 24 Q38 36 24 36 Z" {W} opacity="0.9"/>
  <path d="M24 36 L24 12" stroke="#1976d2" stroke-width="1.2" opacity="0.25"/>
  <path d="M24 36 L11 18" stroke="#1976d2" stroke-width="1" opacity="0.2"/>
  <path d="M24 36 L37 18" stroke="#1976d2" stroke-width="1" opacity="0.2"/>
  <path d="M24 36 L13 14" stroke="#1976d2" stroke-width="1" opacity="0.18"/>
  <path d="M24 36 L35 14" stroke="#1976d2" stroke-width="1" opacity="0.18"/>
  <path d="M24 36 L10 22" stroke="#1976d2" stroke-width="1" opacity="0.16"/>
  <path d="M24 36 L38 22" stroke="#1976d2" stroke-width="1" opacity="0.16"/>
  <path d="M10 36 Q24 32 38 36" {W} opacity="0.5"/>
  <ellipse cx="24" cy="36" rx="14" ry="3" {W} opacity="0.3"/>
''')

# ─────────────────────────────────────────────
# 홍합 (Mussel)  #311b92 남색
# 길쭉한 삼각형 껍데기
# ─────────────────────────────────────────────
ICONS['홍합'] = icon('#311b92', f'''
  <path d="M16 38 Q10 30 12 20 Q14 10 24 10 Q34 10 36 20
           Q38 30 32 38 Q24 42 16 38 Z" {W} opacity="0.9"/>
  <path d="M20 36 Q14 28 16 18 Q18 12 24 12 Q30 12 32 18
           Q34 28 28 36 Q24 38 20 36 Z" {NF} stroke="#311b92" stroke-width="1" opacity="0.3"/>
  <path d="M24 11 Q20 24 20 37" {NF} stroke="#311b92" stroke-width="1.2" opacity="0.25"/>
''')

# ─────────────────────────────────────────────
# 성게 (Sea urchin)  #6a1b9a 보라
# 원형 + 방사형 가시
# ─────────────────────────────────────────────
ICONS['성게'] = icon('#6a1b9a', f'''
  <circle cx="24" cy="24" r="10" {W} opacity="0.9"/>
  <line x1="24" y1="10" x2="24" y2="14" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="24" y1="34" x2="24" y2="38" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="10" y1="24" x2="14" y2="24" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="34" y1="24" x2="38" y2="24" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="14" y1="14" x2="17" y2="17" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="34" y1="14" x2="31" y2="17" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="14" y1="34" x2="17" y2="31" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <line x1="34" y1="34" x2="31" y2="31" {WS} stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="4" fill="#6a1b9a" opacity="0.7"/>
''')

# ─────────────────────────────────────────────
# 전복류·소라·고둥 (Conch/Snail)  #4e342e 갈색
# 나선형 고깔 껍데기
# ─────────────────────────────────────────────
ICONS['소라'] = icon('#4e342e', f'''
  <path d="M24 10 Q34 12 37 22 Q38 30 32 35 Q26 40 18 36
           Q12 32 12 24 Q12 16 18 13 Z" {W} opacity="0.9"/>
  <path d="M24 15 Q31 16 33 23 Q34 29 28 32 Q22 35 17 31
           Q13 27 15 22 Q17 17 22 15 Z" {NF} stroke="#4e342e" stroke-width="1" opacity="0.3"/>
  <path d="M24 20 Q28 21 29 25 Q29 29 25 30 Q21 30 19 27
           Q18 24 20 21 Z" {NF} stroke="#4e342e" stroke-width="1" opacity="0.25"/>
  <circle cx="23" cy="24" r="2.5" fill="#4e342e" opacity="0.4"/>
''')

# ─────────────────────────────────────────────
# 낙지 (Small octopus)  #e65100 주황
# 둥근 머리 + 4쌍의 촉수
# ─────────────────────────────────────────────
ICONS['낙지'] = icon('#e65100', f'''
  <ellipse cx="24" cy="18" rx="9" ry="8" {W} opacity="0.95"/>
  <circle cx="21" cy="17" r="1.5" fill="#e65100" opacity="0.6"/>
  <circle cx="27" cy="17" r="1.5" fill="#e65100" opacity="0.6"/>
  <path d="M16 24 Q13 30 14 36" {NF} {WS} stroke-width="2.5" stroke-linecap="round"/>
  <path d="M19 25 Q17 31 19 37" {NF} {WS} stroke-width="2.5" stroke-linecap="round"/>
  <path d="M22 25 Q21 32 23 38" {NF} {WS} stroke-width="2.5" stroke-linecap="round"/>
  <path d="M26 25 Q27 32 25 38" {NF} {WS} stroke-width="2.5" stroke-linecap="round"/>
  <path d="M29 25 Q31 31 29 37" {NF} {WS} stroke-width="2.5" stroke-linecap="round"/>
  <path d="M32 24 Q35 30 34 36" {NF} {WS} stroke-width="2.5" stroke-linecap="round"/>
''')

# ─────────────────────────────────────────────
# 문어 (Octopus)  #bf360c 진한 주황-적
# 넓은 머리 + 굵은 촉수
# ─────────────────────────────────────────────
ICONS['문어'] = icon('#bf360c', f'''
  <ellipse cx="24" cy="17" rx="12" ry="9" {W} opacity="0.95"/>
  <circle cx="20" cy="16" r="2" fill="#bf360c" opacity="0.6"/>
  <circle cx="28" cy="16" r="2" fill="#bf360c" opacity="0.6"/>
  <path d="M13 24 Q9 31 11 38"  {NF} {WS} stroke-width="3" stroke-linecap="round"/>
  <path d="M18 26 Q15 33 17 39" {NF} {WS} stroke-width="3" stroke-linecap="round"/>
  <path d="M23 27 Q22 34 24 40" {NF} {WS} stroke-width="3" stroke-linecap="round"/>
  <path d="M28 26 Q31 33 29 39" {NF} {WS} stroke-width="3" stroke-linecap="round"/>
  <path d="M33 24 Q37 31 35 38" {NF} {WS} stroke-width="3" stroke-linecap="round"/>
''')

# ─────────────────────────────────────────────
# 미역 (Seaweed)  #2e7d32 초록
# 물결치는 잎 모양
# ─────────────────────────────────────────────
ICONS['미역'] = icon('#2e7d32', f'''
  <line x1="24" y1="38" x2="24" y2="14" {WS} stroke-width="2.5" opacity="0.7"/>
  <path d="M24 14 Q18 10 14 14 Q10 18 14 22 Q18 26 24 22" {W} opacity="0.9"/>
  <path d="M24 22 Q30 18 34 22 Q38 26 34 30 Q30 34 24 30" {W} opacity="0.9"/>
  <path d="M24 30 Q18 26 14 30 Q10 34 14 37 Q18 40 24 37" {W} opacity="0.75"/>
''')

# ─────────────────────────────────────────────
# 파래 (Sea lettuce)  #388e3c 중간 초록
# 넓은 물결 잎
# ─────────────────────────────────────────────
ICONS['파래'] = icon('#388e3c', f'''
  <path d="M10 30 Q12 18 20 14 Q24 12 26 14 Q24 20 24 24" {NF} {WS} stroke-width="3" stroke-linecap="round"/>
  <path d="M38 30 Q36 18 28 14 Q24 12 22 14 Q24 20 24 24" {NF} {WS} stroke-width="3" stroke-linecap="round"/>
  <path d="M10 30 Q16 38 24 36 Q32 38 38 30 Q32 42 24 40 Q16 42 10 30 Z" {W} opacity="0.85"/>
  <path d="M24 24 L24 36" {NF} {WS} stroke-width="2" opacity="0.6"/>
''')

# ─────────────────────────────────────────────
# 갯지렁이 (Ragworm)  #5d4037 갈색
# 분절된 S자 곡선
# ─────────────────────────────────────────────
ICONS['갯지렁이'] = icon('#5d4037', f'''
  <path d="M16 10 Q10 16 16 20 Q22 24 16 28 Q10 32 16 38 Q18 40 20 38"
        {NF} {WS} stroke-width="5" stroke-linecap="round" opacity="0.95"/>
  <path d="M28 10 Q34 16 28 20 Q22 24 28 28 Q34 32 28 38 Q26 40 24 38"
        {NF} {WS} stroke-width="5" stroke-linecap="round" opacity="0.75"/>
  <line x1="15" y1="13" x2="18" y2="11" {WS} stroke-width="1.5" opacity="0.6"/>
  <line x1="16" y1="16" x2="19" y2="14" {WS} stroke-width="1.5" opacity="0.5"/>
  <line x1="14" y1="22" x2="11" y2="21" {WS} stroke-width="1.5" opacity="0.5"/>
  <line x1="16" y1="30" x2="13" y2="30" {WS} stroke-width="1.5" opacity="0.5"/>
''')

# ─────────────────────────────────────────────
# 멸치 (Anchovy)  #0277bd 파랑
# 날렵한 물고기 실루엣
# ─────────────────────────────────────────────
ICONS['멸치'] = icon('#0277bd', f'''
  <path d="M10 24 Q14 16 24 14 Q34 12 40 22 Q38 26 32 28
           Q40 30 40 26 Q38 34 28 34 Q18 36 10 28 Z" {W} opacity="0.92"/>
  <path d="M10 24 Q8 20 10 18 L10 28 Q8 28 10 24 Z" {W} opacity="0.7"/>
  <circle cx="36" cy="22" r="2" fill="#0277bd" opacity="0.6"/>
  <line x1="22" y1="14" x2="20" y2="34" stroke="#0277bd" stroke-width="0.8" opacity="0.2"/>
  <line x1="28" y1="13" x2="26" y2="34" stroke="#0277bd" stroke-width="0.8" opacity="0.15"/>
''')

# ─────────────────────────────────────────────
# 동죽 (Surf clam)  #546e7a 청회색
# 삼각형에 가까운 조개
# ─────────────────────────────────────────────
ICONS['동죽'] = icon('#546e7a', f'''
  <path d="M12 32 Q10 22 18 14 Q24 10 30 14 Q38 22 36 32 Q30 40 24 40 Q18 40 12 32 Z"
        {W} opacity="0.9"/>
  <line x1="24" y1="10" x2="24" y2="40" stroke="#546e7a" stroke-width="1.2" opacity="0.25"/>
  <path d="M12 26 Q24 18 36 26" {NF} stroke="#546e7a" stroke-width="1" opacity="0.2"/>
  <path d="M13 30 Q24 22 35 30" {NF} stroke="#546e7a" stroke-width="1" opacity="0.18"/>
  <ellipse cx="24" cy="10" rx="3.5" ry="2.5" {W} opacity="0.8"/>
''')

# ─────────────────────────────────────────────
# 가무락 (Clam)  #37474f 어두운 청회색
# 두껍고 둥근 조개
# ─────────────────────────────────────────────
ICONS['가무락'] = icon('#37474f', f'''
  <ellipse cx="24" cy="26" rx="15" ry="12" {W} opacity="0.9"/>
  <line x1="24" y1="14" x2="24" y2="38" stroke="#37474f" stroke-width="1.5" opacity="0.3"/>
  <path d="M10 24 Q24 16 38 24" {NF} stroke="#37474f" stroke-width="1.2" opacity="0.22"/>
  <path d="M10 28 Q24 20 38 28" {NF} stroke="#37474f" stroke-width="1" opacity="0.18"/>
  <path d="M11 32 Q24 26 37 32" {NF} stroke="#37474f" stroke-width="1" opacity="0.15"/>
  <ellipse cx="24" cy="14" rx="4" ry="2.5" {W} opacity="0.75"/>
''')

# ─────────────────────────────────────────────
# 우렁쉥이 / 멍게 (Sea squirt)  #880e4f 자주
# 울퉁불퉁한 덩어리 + 두 개의 사이펀
# ─────────────────────────────────────────────
ICONS['우렁쉥이'] = icon('#880e4f', f'''
  <path d="M14 30 Q12 20 18 14 Q24 10 30 14 Q36 20 34 30 Q30 38 24 38 Q18 38 14 30 Z"
        {W} opacity="0.9"/>
  <circle cx="18" cy="22" r="3"   {W} opacity="0.55"/>
  <circle cx="28" cy="18" r="2.5" {W} opacity="0.5"/>
  <circle cx="31" cy="27" r="2"   {W} opacity="0.45"/>
  <rect x="19" y="8" width="4" height="8" rx="2" {W} opacity="0.9"/>
  <rect x="26" y="6" width="4" height="8" rx="2" {W} opacity="0.9"/>
''')

# ─────────────────────────────────────────────
# 백합 (Hard clam)  #0288d1 하늘색
# 둥글고 균일한 조개
# ─────────────────────────────────────────────
ICONS['백합'] = icon('#0288d1', f'''
  <path d="M24 12 Q36 12 38 24 Q38 36 24 38 Q10 38 10 26 Q10 14 24 12 Z" {W} opacity="0.9"/>
  <line x1="24" y1="12" x2="24" y2="38" stroke="#0288d1" stroke-width="1.2" opacity="0.25"/>
  <path d="M10 20 Q24 14 38 20" {NF} stroke="#0288d1" stroke-width="1" opacity="0.2"/>
  <path d="M10 26 Q24 20 38 26" {NF} stroke="#0288d1" stroke-width="1" opacity="0.2"/>
  <path d="M10 32 Q24 26 38 32" {NF} stroke="#0288d1" stroke-width="1" opacity="0.18"/>
  <ellipse cx="24" cy="12" rx="4" ry="2.5" {W} opacity="0.8"/>
''')

# ─────────────────────────────────────────────
# 기타 / 복합 (Others)  #607d8b 청회
# 물결 + 별 모양
# ─────────────────────────────────────────────
ICONS['기타'] = icon('#607d8b', f'''
  <path d="M8 28 Q12 22 16 28 Q20 34 24 28 Q28 22 32 28 Q36 34 40 28"
        {NF} {WS} stroke-width="3" stroke-linecap="round" opacity="0.9"/>
  <path d="M8 20 Q12 14 16 20 Q20 26 24 20 Q28 14 32 20 Q36 26 40 20"
        {NF} {WS} stroke-width="3" stroke-linecap="round" opacity="0.6"/>
''')

# ─────────────────────────────────────────────
# 파일 저장
# ─────────────────────────────────────────────
for name, svg_content in ICONS.items():
    filepath = os.path.join(OUT_DIR, f'{name}.svg')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)

import sys
sys.stdout.reconfigure(encoding='utf-8')
print(f'완료: {len(ICONS)}개 아이콘 생성 -> {OUT_DIR}')
for name in ICONS:
    print(f'   - {name}.svg')
