import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const HomeAdOverlay = () => {
  const [ad, setAd] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only fetch/show ad on home page
    if (location.pathname !== "/") {
      setIsVisible(false);
      return;
    }

    // Static Ad Configuration
    const staticAd = {
      _id: "static_home_ad_001",
      imageUrl: "/Ad.png",
      title: "Special Offer",
      redirectUrl: "/testSeries", // Add URL here if needed
    };

    setAd(staticAd);

    // Check session storage
    const adClosed = sessionStorage.getItem(`ad_closed_${staticAd._id}`);
    if (!adClosed) {
      // Small delay for smooth entrance
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    if (ad) {
      sessionStorage.setItem(`ad_closed_${ad._id}`, "true");
    }
  };

  const handleClick = () => {
    if (ad && ad.redirectUrl) {
      if (ad.redirectUrl.startsWith("http")) {
        window.open(ad.redirectUrl, "_blank");
      } else {
        navigate(ad.redirectUrl);
      }
      handleClose();
    }
  };

  if (!ad) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Ad Content */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-500 transform ${
          isVisible
            ? "scale-100 opacity-100"
            : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative max-w-[90vw] max-h-[80vh] w-auto">
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-50"
            aria-label="Close advertisement"
          >
            <X size={24} />
          </button>

          {/* Ad Image */}
          <div
            className="cursor-pointer rounded-lg overflow-hidden shadow-2xl"
            onClick={handleClick}
          >
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeAdOverlay;
