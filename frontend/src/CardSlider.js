import React, { useState, useEffect } from "react";

const aboutImages = [
  "/about/1000147608.jpg",
  "/about/1000147628.jpg",
];

const coursesImages = [
  "/courses/1000147631.jpg",
  "/courses/1000147634.jpg",
  "/courses/1000147637.jpg",
  "/courses/1000147640.jpg",
  "/courses/1000147643.jpg",
  "/courses/1000147646.jpg",
  "/courses/1000147649.jpg",
  "/courses/1000147652.jpg",
  "/courses/1000147655.jpg",
];

const DURATION = 1200;

const css = `
@keyframes slideIn {
  from { transform: translateX(calc(-50% + 110%)); }
  to   { transform: translateX(-50%); }
}
@keyframes slideOut {
  from { transform: translateX(-50%); }
  to   { transform: translateX(calc(-50% - 110%)); }
}
.slider-dots button {
  height: 5px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: width 0.3s;
}
@media (max-width: 640px) {
  .slider-dots button {
    height: 3px !important;
    border-radius: 2px !important;
  }
  .slider-dots button.active { width: 8px !important; }
  .slider-dots button.inactive { width: 3px !important; }
}
`;

const imgBase = {
  position: "absolute",
  top: 0, bottom: 0,
  left: "50%",
  margin: "auto",
  height: "100%",
  width: "auto",
  maxWidth: "100%",
};

const Panel = ({ images, interval }) => {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(null);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => {
      setCur(c => {
        setPrev(c);
        return (c + 1) % images.length;
      });
    }, interval);
    return () => clearInterval(t);
  }, [images.length, interval]);

  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), DURATION);
    return () => clearTimeout(t);
  }, [prev]);

  if (images.length === 0) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fcfcfc" }}>
        <span style={{ color: "#aaa", fontSize: 14 }}>No images</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#fcfcfc" }}>
      {/* Previous image slides out left */}
      {prev !== null && (
        <img
          key={"p" + prev}
          src={images[prev]}
          alt=""
          draggable="false"
          style={{
            ...imgBase,
            zIndex: 1,
            animation: `slideOut ${DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards`,
          }}
        />
      )}

      {/* Current image: first load = no animation, subsequent = slide in from right */}
      <img
        key={"c" + cur}
        src={images[cur]}
        alt=""
        draggable="false"
        style={{
          ...imgBase,
          zIndex: 2,
          transform: "translateX(-50%)",
          animation: prev !== null
            ? `slideIn ${DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards`
            : "none",
        }}
      />

      {images.length > 1 && (
        <div className="slider-dots" style={{ position: "absolute", bottom: 6, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4, zIndex: 3 }}>
          {images.map((_, i) => (
            <button
              key={i}
              className={i === cur ? "active" : "inactive"}
              onClick={() => { setPrev(cur); setCur(i); }}
              style={{
                width: i === cur ? 12 : 5, height: 5,
                borderRadius: 3, border: "none",
                background: i === cur ? "#353841" : "rgba(53,56,65,0.35)",
                cursor: "pointer", padding: 0,
                transition: "width 0.3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CardSlider = () => (
  <>
    <style>{css}</style>
    <div style={{ display: "flex", gap: "12px", width: "100%", height: "clamp(220px, 45vw, 480px)" }}>
      <div style={{ width: "60%", height: "100%", flexShrink: 0, borderRadius: "12px", overflow: "hidden" }}>
        <Panel images={aboutImages} interval={3500} />
      </div>
      <div style={{ width: "40%", height: "100%", flexShrink: 0, borderRadius: "12px", overflow: "hidden" }}>
        <Panel images={coursesImages} interval={2800} />
      </div>
    </div>
  </>
);

export default CardSlider;
