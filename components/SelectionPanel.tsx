'use client';

import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';
import FarmInfoContent from './FarmInfoContent';
import TideInfoContent, { TideStationInfo } from './TideInfoContent';
import { FarmProperties } from './KakaoMap';

export type PanelSelection =
  | { kind: 'farm'; data: FarmProperties }
  | { kind: 'station'; data: TideStationInfo }
  | null;

interface SelectionPanelProps {
  selection: PanelSelection;
  onClose: () => void;
}

/** 양식 어장 정보와 물때/바다날씨 정보를 하나의 BottomSheet로 통합해 보여준다.
 *  항상 마지막으로 선택된 정보만 표시되어 두 패널이 겹쳐 보이는 일이 없다. */
export default function SelectionPanel({ selection, onClose }: SelectionPanelProps) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState<PanelSelection>(null);

  useEffect(() => {
    if (selection) {
      console.log('[DEBUG] SelectionPanel useEffect: selection set, opening', selection.kind);
      setDisplay(selection);
      requestAnimationFrame(() => setOpen(true));
    } else {
      console.log('[DEBUG] SelectionPanel useEffect: selection null, closing');
      setOpen(false);
    }
  }, [selection]);

  const handleTransitionEnd = () => {
    console.log('[DEBUG] SelectionPanel handleTransitionEnd, open=', open);
    if (!open) setDisplay(null);
  };

  if (!display) return null;

  return (
    <BottomSheet open={open} onClose={onClose} onTransitionEnd={handleTransitionEnd}>
      {display.kind === 'farm'
        ? <FarmInfoContent farm={display.data} onClose={onClose} />
        : <TideInfoContent station={display.data} onClose={onClose} />}
    </BottomSheet>
  );
}
