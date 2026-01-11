// CardSlider.js
import React, { useEffect, useRef } from "react";
import { sliderCards } from "./slides/sliderCards";
import { useNavigate } from "react-router-dom";

const GAP = 32; // space between cards
const SPEED = 0.4; // px per frame

const CardSlider = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const cardsRef = useRef([]);
  const rafRef = useRef(null);
  const unmountedRef = useRef(false);
  const widthRef = useRef(0); // REAL card width

  let base = [...sliderCards];
  while (base.length < 10) base = [...base, ...sliderCards];

  useEffect(() => {
    unmountedRef.current = false;

    // 1. Measure the REAL width of the card (actual rendered width!)
    const firstCard = cardsRef.current[0];
    if (!firstCard) return;

    widthRef.current = firstCard.offsetWidth; // 💥 This fixes your issue completely

    const count = cardsRef.current.length;
    const positions = new Array(count).fill(0);

    // 2. Initial positioning
    for (let i = 0; i < count; i++) {
      positions[i] = i * (widthRef.current + GAP);
      cardsRef.current[i].style.transform = `translateX(${positions[i]}px)`;
    }

    // 3. Animation loop
    function tick() {
      if (unmountedRef.current) return;

      let maxRight = -Infinity;

      // Move left
      for (let i = 0; i < count; i++) {
        const el = cardsRef.current[i];
        if (!el) continue;

        positions[i] -= SPEED;
        const right = positions[i] + widthRef.current;
        if (right > maxRight) maxRight = right;
      }

      // Teleport if off-screen
      for (let i = 0; i < count; i++) {
        const el = cardsRef.current[i];
        if (!el) continue;

        if (positions[i] + widthRef.current < 0) {
          positions[i] = maxRight + GAP;
          maxRight = positions[i] + widthRef.current;
        }
      }

      // Apply transforms
      for (let i = 0; i < count; i++) {
        const el = cardsRef.current[i];
        if (el) {
          el.style.transform = `translateX(${positions[i]}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      unmountedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        overflow: "hidden",
        height: "500px",
        position: "relative",
      }}
    >
      {base.map((card, i) => (
        <div
          key={i}
          ref={(el) => (cardsRef.current[i] = el)}
          onClick={() => navigate(card.routing_link)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "500px",
            width: "auto", // allow REAL width
            cursor: "pointer",
          }}
        >
          <img
            src={card.img_link}
            alt=""
            draggable="false"
            style={{
              height: "100%",
              width: "auto",
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default CardSlider;
