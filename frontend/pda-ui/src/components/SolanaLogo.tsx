interface SolanaLogoProps {
  width?: number;
  height?: number;
  className?: string;
  circle?: boolean; // Option to show with circular background
  useImage?: boolean; // Use image file if available instead of SVG
}

export function SolanaLogo({ width = 48, height = 48, className = '', circle = false, useImage = true }: SolanaLogoProps) {
  // Try to use the Solana logo image if available
  if (useImage) {
    const logoImage = (
      <img
        src="/assets/solana-logo.png"
        alt="Solana"
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          // Fallback to SVG if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const svgFallback = parent.querySelector('.solana-svg-fallback') as HTMLElement;
            if (svgFallback) {
              svgFallback.style.display = 'block';
            }
          }
        }}
      />
    );

    const svgFallback = (
      <div className="solana-svg-fallback" style={{ display: 'none' }}>
        {getSolanaSVG(width, height, className)}
      </div>
    );

    if (circle) {
      return (
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-black rounded-full border-2 border-white"></div>
          <div className="relative p-2">
            {logoImage}
            {svgFallback}
          </div>
        </div>
      );
    }

    return (
      <div className="relative inline-block">
        {logoImage}
        {svgFallback}
      </div>
    );
  }

  // Use SVG directly
  return getSolanaSVG(width, height, className, circle);
}

function getSolanaSVG(width: number, height: number, className: string, circle: boolean = false) {
  const logo = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 397.7 311.7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Official Solana Logo - Three parallelograms */}
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill="url(#solanaGradient1)"
      />
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill="url(#solanaGradient2)"
      />
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill="url(#solanaGradient3)"
      />
      <defs>
        <linearGradient id="solanaGradient1" x1="200" y1="200" x2="300" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
        <linearGradient id="solanaGradient2" x1="100" y1="50" x2="200" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="solanaGradient3" x1="150" y1="150" x2="250" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (circle) {
    return (
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute inset-0 bg-black rounded-full border-2 border-white"></div>
        <div className="relative p-2">{logo}</div>
      </div>
    );
  }

  return logo;
}

