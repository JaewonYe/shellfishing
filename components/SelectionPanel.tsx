'use client';

import { useCallback, useEffect, useState } from 'react';
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

export default function SelectionPanel({ selection, onClose }: SelectionPanelProps) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState<PanelSelection>(null);

  useEffect(() => {
    if (selection) {
      setDisplay(selection);
      requestAnimationFrame(() => setOpen(true));
    } else {
      setOpen(false);
    }
  }, [selection]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose();
  }, [onClose]);

  const handleTransitionEnd = () => {
    if (!open) setDisplay(null);
  };

  if (!display) return null;

  return (
    <BottomSheet open={open} onClose={handleClose} onTransitionEnd={handleTransitionEnd}>
      {display.kind === 'farm'
        ? <FarmInfoContent farm={display.data} onClose={handleClose} />
        : <TideInfoContent station={display.data} onClose={handleClose} />}
    </BottomSheet>
  );
}
