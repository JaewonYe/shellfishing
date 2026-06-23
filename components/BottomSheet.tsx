'use client';

import { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  onTransitionEnd?: () => void;
  children: ReactNode;
}

/**
 * 지도 위에 떠 있는 하단 시트형 정보 패널의 공용 틀.
 * 모바일에서는 화면 하단에서 슬라이드 업, 데스크톱에서는 우측 하단에 카드로 떠 있는
 * 동일한 구조·크기·위치·애니메이션을 InfoPanel/TidePanel이 그대로 공유한다.
 */
export default function BottomSheet({
  open,
  onClose,
  onTransitionEnd,
  children,
}: BottomSheetProps) {
  return (
    <>
      {/* 배경 딤 (모바일) */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 z-20 md:hidden transition-opacity duration-300
                    ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* 하단 시트 */}
      <div
        onTransitionEnd={onTransitionEnd}
        className={`absolute bottom-0 left-0 right-0
                    md:left-auto md:right-4 md:bottom-4 md:w-[22rem]
                    bg-white rounded-t-[20px] md:rounded-[20px]
                    shadow-[0_-2px_20px_rgba(0,0,0,0.18)] md:shadow-xl
                    z-30 max-h-[70vh] overflow-y-auto
                    transition-transform duration-300 ease-out will-change-transform
                    ${open ? 'translate-y-0' : 'translate-y-full md:translate-y-8 md:opacity-0'}`}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {children}
      </div>
    </>
  );
}
