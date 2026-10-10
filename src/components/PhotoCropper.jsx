import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMinus, FiPlus, FiRotateCw, FiCrop } from 'react-icons/fi';
import { PHOTO_ASPECT, cropPhoto } from '../utils/memberCard';

const MAX_ZOOM = 5;
const PAD = 28;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Crop dialog: drag to pan, wheel / pinch / slider to zoom, rotate in 90° steps.
// Calls onApply(photoDataUrl, sourceUrl) — sourceUrl lets the crop be re-adjusted later.
function PhotoCropper({ src, onCancel, onApply }) {
  const [source, setSource] = useState(src);
  const [img, setImg] = useState(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(null);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const ownedUrls = useRef([]);
  const keepUrl = useRef(null);

  // Rotated copies are created here; release all but the one handed back to the parent
  useEffect(() => () => {
    ownedUrls.current.forEach(u => u !== keepUrl.current && URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    let alive = true;
    const el = new Image();
    el.onload = () => alive && setImg({ el, w: el.naturalWidth, h: el.naturalHeight });
    el.src = source;
    return () => { alive = false; };
  }, [source]);

  useLayoutEffect(() => {
    const node = stageRef.current;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStage({ w: width, h: height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Crop frame: largest 4:5 rectangle that fits the stage
  let fh = Math.max(0, stage.h - PAD * 2);
  let fw = fh * PHOTO_ASPECT;
  if (fw > stage.w - PAD * 2) {
    fw = Math.max(0, stage.w - PAD * 2);
    fh = fw / PHOTO_ASPECT;
  }
  const frame = { x: (stage.w - fw) / 2, y: (stage.h - fh) / 2, w: fw, h: fh };
  const baseScale = img ? Math.max(frame.w / img.w, frame.h / img.h) : 1;

  // Keep the image covering the frame at all times
  const fit = useCallback((v) => {
    const s = baseScale * v.zoom;
    return {
      zoom: v.zoom,
      x: clamp(v.x, frame.x + frame.w - img.w * s, frame.x),
      y: clamp(v.y, frame.y + frame.h - img.h * s, frame.y)
    };
  }, [baseScale, frame.x, frame.y, frame.w, frame.h, img]);

  // Start centred horizontally and biased to the top, where faces usually are
  useEffect(() => {
    if (!img || !frame.w) return;
    const s = baseScale;
    setView({ zoom: 1, x: frame.x + (frame.w - img.w * s) / 2, y: frame.y + (frame.h - img.h * s) * 0.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, stage.w, stage.h]);

  const zoomTo = (zoom, ax = frame.x + frame.w / 2, ay = frame.y + frame.h / 2) => {
    setView(v => {
      if (!v) return v;
      const z = clamp(zoom, 1, MAX_ZOOM);
      const k = z / v.zoom;
      return fit({ zoom: z, x: ax - (ax - v.x) * k, y: ay - (ay - v.y) * k });
    });
  };

  const pan = (dx, dy) => setView(v => (v ? fit({ ...v, x: v.x + dx, y: v.y + dy }) : v));

  const local = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e) => {
    stageRef.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
    }
  };

  const onPointerMove = (e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size === 1) {
      pan(p.x - prev.x, p.y - prev.y);
    } else if (pinch.current) {
      const [a, b] = [...pointers.current.values()];
      zoomTo(pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const onWheel = (e) => {
    if (!view) return;
    const p = local(e);
    zoomTo(view.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), p.x, p.y);
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 40 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      pan(...moves[e.key]);
    } else if (e.key === '+' || e.key === '=') {
      zoomTo(view.zoom * 1.1);
    } else if (e.key === '-') {
      zoomTo(view.zoom / 1.1);
    }
  };

  const rotate = () => {
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = img.h;
    c.height = img.w;
    const ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img.el, -img.w / 2, -img.h / 2);
    c.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      ownedUrls.current.push(url);
      setSource(url);
    }, 'image/jpeg', 0.92);
  };

  const apply = () => {
    if (!img || !view) return;
    const s = baseScale * view.zoom;
    keepUrl.current = source;
    onApply(cropPhoto(img.el, (frame.x - view.x) / s, (frame.y - view.y) / s, frame.w / s, frame.h / s), source);
  };

  const s = baseScale * (view?.zoom ?? 1);

  return createPortal(
    <div className="ld-modal-backdrop" onClick={onCancel}>
      <div className="idc-crop" role="dialog" aria-modal="true" aria-labelledby="idc-crop-title" onClick={(e) => e.stopPropagation()}>
        <div className="idc-crop-head">
          <div>
            <h3 id="idc-crop-title">Crop photo</h3>
            <p>Drag to position the face inside the guide. Scroll or pinch to zoom.</p>
          </div>
          <button type="button" className="ld-modal-close" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>

        <div
          ref={stageRef}
          className={`idc-crop-stage ${dragging ? 'is-dragging' : ''}`}
          tabIndex={0}
          aria-label="Photo crop area. Use arrow keys to move and plus or minus to zoom."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        >
          {img && view && (
            <img
              src={source}
              alt=""
              draggable={false}
              style={{ width: img.w * s, height: img.h * s, transform: `translate(${view.x}px, ${view.y}px)` }}
            />
          )}
          {frame.w > 0 && (
            <div className="idc-crop-frame" style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}>
              <i className="idc-crop-face" />
            </div>
          )}
        </div>

        <div className="idc-crop-tools">
          <button type="button" className="idc-icon" onClick={() => zoomTo(view.zoom / 1.2)} disabled={!view || view.zoom <= 1} aria-label="Zoom out"><FiMinus /></button>
          <input
            type="range"
            min="1"
            max={MAX_ZOOM}
            step="0.01"
            value={view?.zoom ?? 1}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="Zoom"
            disabled={!view}
          />
          <button type="button" className="idc-icon" onClick={() => zoomTo(view.zoom * 1.2)} disabled={!view || view.zoom >= MAX_ZOOM} aria-label="Zoom in"><FiPlus /></button>
          <span className="idc-crop-sep" />
          <button type="button" className="idc-icon" onClick={rotate} disabled={!img} aria-label="Rotate 90 degrees" title="Rotate"><FiRotateCw /></button>
        </div>

        <div className="ld-modal-actions">
          <button type="button" className="ld-modal-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="ld-modal-btn idc-crop-apply" onClick={apply} disabled={!view}><FiCrop /> Use photo</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PhotoCropper;
