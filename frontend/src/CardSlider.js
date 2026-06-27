import React from "react";
import { useNavigate } from "react-router-dom";
import { sliderCards } from "./slides/sliderCards";

// Duplicate enough times for a seamless infinite loop
const COPIES = 4;
const items = Array.from({ length: COPIES }, () => sliderCards).flat();

const CardSlider = () => {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .marquee-viewport {
          width: 100%;
          overflow: hidden;
          /* Force GPU layer — eliminates jank on all browsers */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marquee 20s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .marquee-item {
          flex-shrink: 0;
          margin-right: 16px;
          cursor: pointer;
          border-radius: 12px;
          overflow: hidden;
          line-height: 0; /* remove inline-block gap under img */
        }

        .marquee-item img {
          display: block;
          object-fit: contain;   /* never crop any side */
          object-position: center;
          border-radius: 12px;
          image-rendering: -webkit-optimize-contrast;
        }

        /* Mobile — portrait photo */
        @media (max-width: 768px) {
          .marquee-viewport { height: 72vw; max-height: 460px; }
          .marquee-item     { height: 72vw; max-height: 460px; }
          .marquee-item img { height: 100%; width: auto; }
          .marquee-track    { animation-duration: 14s; }
          .marquee-item .img-landscape { display: none; }
          .marquee-item .img-portrait  { display: block; }
        }

        /* Desktop — landscape photo */
        @media (min-width: 769px) {
          .marquee-viewport { height: 400px; }
          .marquee-item     { height: 400px; }
          .marquee-item img { height: 100%; width: auto; }
          .marquee-item .img-portrait  { display: none; }
          .marquee-item .img-landscape { display: block; }
        }
      `}</style>

      <div className="marquee-viewport">
        <div className="marquee-track">
          {items.map((card, i) => (
            <div
              key={i}
              className="marquee-item"
              onClick={() => navigate(card.routing_link)}
            >
              {/* Portrait — shown on mobile */}
              <img
                className="img-portrait"
                src={card.img_portrait}
                alt="Course banner"
                draggable="false"
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
              />
              {/* Landscape — shown on desktop */}
              <img
                className="img-landscape"
                src={card.img_landscape}
                alt="Course banner"
                draggable="false"
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CardSlider;
