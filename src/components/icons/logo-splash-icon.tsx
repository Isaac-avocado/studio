import type { SVGProps } from 'react';

export function LogoSplashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M108.311 10.0002C130.033 -3.33316 153.333 14.1201 147.801 35.1174C142.269 56.1146 153.333 78.4479 139.779 93.9466C126.224 109.445 108.311 125.612 87.2001 125.612C66.0889 125.612 41.8889 120.778 29.8889 104.279C17.8889 87.7798 11.6666 64.0009 23.0555 45.2231C34.4444 26.4453 86.5889 23.3335 108.311 10.0002Z" 
        fill="hsl(var(--dashboard-background))" 
      />
      <g>
        {/* Scales top bar and stand */}
        <path d="M75 36.75C73.2051 36.75 71.75 38.2051 71.75 40V45.25H40C38.2051 45.25 36.75 46.7051 36.75 48.5C36.75 50.2949 38.2051 51.75 40 51.75H110C111.795 51.75 113.25 50.2949 113.25 48.5C113.25 46.7051 111.795 45.25 110 45.25H78.25V40C78.25 38.2051 76.7949 36.75 75 36.75Z" fill="hsl(var(--dashboard-foreground))"/>
        {/* Scales pans */}
        <path d="M48.5 51.75L40 70.25H57L48.5 51.75Z" fill="hsl(var(--dashboard-foreground))"/>
        <path d="M101.5 51.75L110 70.25H93L101.5 51.75Z" fill="hsl(var(--dashboard-foreground))"/>
        {/* Car body and wheels */}
        <path d="M108.5 80.75H97.25L93.5 75.5H56.5L52.75 80.75H41.5C38.9289 80.75 36.75 82.9289 36.75 85.5V97.25C36.75 98.863 37.737 100.263 39.1258 100.852L43.75 107H50.375L52.75 102.5H97.25L99.625 107H106.25L110.874 100.852C112.263 100.263 113.25 98.863 113.25 97.25V85.5C113.25 82.9289 111.071 80.75 108.5 80.75Z" fill="hsl(var(--dashboard-foreground))"/>
        <ellipse cx="57" cy="102.5" rx="5.25" ry="5.25" fill="hsl(var(--background))"/>
        <ellipse cx="93" cy="102.5" rx="5.25" ry="5.25" fill="hsl(var(--background))"/>
      </g>
    </svg>
  );
}
