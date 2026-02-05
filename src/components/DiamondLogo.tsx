interface DiamondLogoProps {
  className?: string;
  alt?: string;
}

export default function DiamondLogo({ className = '', alt = '' }: DiamondLogoProps) {
  return (
    <img 
      src="/diamond-white.png" 
      alt={alt}
      className={`diamond-dance ${className}`}
    />
  );
}
