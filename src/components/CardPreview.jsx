import React, { useEffect, useRef } from 'react';
import { CARD_W, CARD_H, renderCard } from '../utils/memberCard';

const paint = (target, source) => {
  if (!target) return;
  const ctx = target.getContext('2d');
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.drawImage(source, 0, 0);
};

// Live, flippable preview of a member card. Renders through the same canvas
// pipeline used for downloads, so what you see is exactly what gets exported.
function CardPreview({ member, side, onFlip, debounce = 120 }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const renderId = useRef(0);

  useEffect(() => {
    const id = ++renderId.current;
    const timer = setTimeout(async () => {
      const { front, back } = await renderCard(member);
      if (id !== renderId.current) return;
      paint(frontRef.current, front);
      paint(backRef.current, back);
    }, debounce);
    return () => clearTimeout(timer);
  }, [member, debounce]);

  const isBack = side === 'back';

  return (
    <button
      type="button"
      className={`idc-flip ${isBack ? 'is-back' : ''}`}
      onClick={onFlip}
      aria-label={isBack ? 'Showing back of card. Click to show front.' : 'Showing front of card. Click to show back.'}
    >
      <div className="idc-flip-inner">
        <div className="idc-face" aria-hidden={isBack}>
          <canvas ref={frontRef} width={CARD_W} height={CARD_H} />
        </div>
        <div className="idc-face idc-face-back" aria-hidden={!isBack}>
          <canvas ref={backRef} width={CARD_W} height={CARD_H} />
        </div>
      </div>
    </button>
  );
}

export default CardPreview;
