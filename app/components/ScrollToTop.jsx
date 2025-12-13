import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <button
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed bottom-6 right-6
          w-12 h-12
          rounded-full
          bg-white/10
          backdrop-blur-md
          text-white
          border-2 border-white/20
          cursor-pointer
          shadow-lg shadow-blue-500/30
          flex items-center justify-center
          text-xl font-bold
          transition-all duration-300 ease-out
          z-50
          ${
            isVisible
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 translate-y-24 invisible"
          }
          hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40
          hover:border-white/30
          active:scale-95
          focus:outline-none focus:ring-3 focus:ring-blue-400 focus:ring-offset-2
          backdrop-blur-sm
        `}
        aria-label="Scroll to top"
      >
        <span className="transform transition-transform duration-200 hover:-translate-y-0.5">
          < ArrowUp size={24} />
        </span>
      </button>

      {/* Tooltip */}
      {isHovered && isVisible && (
        <div className="fixed bottom-20 right-6 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          Back to top
          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </>
  );
}
