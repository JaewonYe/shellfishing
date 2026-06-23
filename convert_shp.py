"""
SHP -> GeoJSON 변환 스크립트
=============================
TL_DIST_FSHFRM.shp 컬럼 구조:
  gid        : 고유ID
  fids_se    : 어업 구분 (마을어업 / 양식어업 / 정치망어업 등)
  fids_knd   : 어업 종류
  farm_knd   : 주요 어종
  addr       : 어장 소재지
  area       : 면적 (ha)
  lcns_no    : 허가 번호
  lcns_bgng_ : 허가 시작일 (YYYYMMDD)
  lcns_end_y : 허가 종료일 (YYYYMMDD)
  rel_dept   : 관련 부서
  sgg_nm     : 시군구명
  ctpv_nm    : 시도명
  ycdnt/xcdnt: 위도/경도 (WGS84)
  좌표계: EPSG:5179
"""

import sys
import json
import math
import os

sys.stdout.reconfigure(encoding='utf-8')

SHP_PATH = r'C:\Users\User\Desktop\2026\shellfishing\data\해양수산부 국립해양조사원_어장정보_20250813\TL_DIST_FSHFRM.shp'

os.makedirs('public', exist_ok=True)

# 레이어별 설정: (어업구분 집합, 출력경로, 단순화 허용오차)
LAYERS = [
    {
        'types': {'마을어업', '마을어업(한정)'},
        'output': 'public/fishfarms.geojson',
        'simplify': 0.00005,   # ~5m
        'label': '마을어업',
    },
    {
        'types': {'양식어업', '양식어업(한정)'},
        'output': 'public/aquafarms.geojson',
        'simplify': 0.0001,    # ~10m (데이터 많아 더 강하게)
        'label': '양식어업',
    },
    {
        'types': {'정치망어업'},
        'output': 'public/setnets.geojson',
        'simplify': 0.00005,
        'label': '정치망어업',
    },
]

COORD_PRECISION = 5


def str_or_dash(val):
    if val is None:
        return '-'
    try:
        if math.isnan(float(val)):
            return '-'
    except (TypeError, ValueError):
        pass
    s = str(val).strip()
    return s if s and s.lower() != 'nan' else '-'


def format_date(val):
    s = str_or_dash(val)
    if len(s) == 8 and s.isdigit():
        return f'{s[:4]}.{s[4:6]}.{s[6:]}'
    return s


def round_coords(coords, precision):
    if isinstance(coords[0], (int, float)):
        return [round(c, precision) for c in coords]
    return [round_coords(c, precision) for c in coords]


def build_features(filtered, precision):
    features = []
    skipped = 0
    for _, row in filtered.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            skipped += 1
            continue

        period_start = format_date(row.get('lcns_bgng_'))
        period_end   = format_date(row.get('lcns_end_y'))
        period = f'{period_start} ~ {period_end}' if period_start != '-' else '-'

        area_val = row.get('area')
        try:
            area_ha = round(float(area_val), 2) if area_val is not None and not math.isnan(float(area_val)) else None
        except (TypeError, ValueError):
            area_ha = None

        props = {
            'id':      str(row['gid']),
            'name':    str_or_dash(row.get('addr')),
            'type':    str_or_dash(row.get('fids_se')),
            'kind':    str_or_dash(row.get('fids_knd')),
            'species': str_or_dash(row.get('farm_knd')),
            'area':    area_ha,
            'lcns_no': str_or_dash(row.get('lcns_no')),
            'period':  period,
            'org':     str_or_dash(row.get('rel_dept')),
            'sgg':     str_or_dash(row.get('sgg_nm')),
            'ctpv':    str_or_dash(row.get('ctpv_nm')),
            'address': f"{str_or_dash(row.get('sgg_nm'))} {str_or_dash(row.get('addr'))}".strip(),
            'lat':     round(float(row['ycdnt']), precision) if row.get('ycdnt') else None,
            'lng':     round(float(row['xcdnt']), precision) if row.get('xcdnt') else None,
        }

        geo = geom.__geo_interface__
        geo['coordinates'] = round_coords(geo['coordinates'], precision)
        features.append({'type': 'Feature', 'geometry': geo, 'properties': props})

    return features, skipped


def main():
    try:
        import geopandas as gpd
    except ImportError:
        print("geopandas 설치 중...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'geopandas'])
        import geopandas as gpd

    print(f"SHP 로딩: {SHP_PATH}")
    gdf = gpd.read_file(SHP_PATH, encoding='cp949')
    print(f"전체 레코드: {len(gdf)}개  |  좌표계: {gdf.crs}\n")

    for layer in LAYERS:
        print(f"=== {layer['label']} ===")
        filtered = gdf[gdf['fids_se'].isin(layer['types'])].copy()
        print(f"  필터링: {len(filtered)}개")

        if filtered.crs and filtered.crs.to_epsg() != 4326:
            filtered = filtered.to_crs('EPSG:4326')

        tol = layer['simplify']
        filtered['geometry'] = filtered['geometry'].simplify(tol, preserve_topology=True)
        print(f"  단순화 완료 (허용오차={tol})")

        features, skipped = build_features(filtered, COORD_PRECISION)
        geojson = {'type': 'FeatureCollection', 'features': features}

        with open(layer['output'], 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))

        size_kb = len(json.dumps(geojson).encode('utf-8')) / 1024
        print(f"  출력: {layer['output']}")
        print(f"  어장 수: {len(features)}개  |  스킵: {skipped}개  |  크기: {size_kb:.0f} KB\n")


if __name__ == '__main__':
    main()
