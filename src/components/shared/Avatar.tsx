import React from 'react';

interface AvatarProps {
  photoURL?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  border?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  photoURL, 
  name = "Anónimo", 
  size = "md", 
  className = "",
  border = true
}) => {
  const getInitials = (userFullName: string): string => {
    const parts = userFullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl font-bold"
  };

  const ringStyles = border ? "border-2 border-brand-ink" : "";

  if (photoURL) {
    return (
      <img 
        src={photoURL} 
        alt={name} 
        referrerPolicy="no-referrer"
        className={`${sizes[size]} rounded-full object-cover bg-brand-card aspect-square ${ringStyles} ${className}`}
      />
    );
  }

  // Fallback with initials and beautiful retro pastel textures
  const initials = getInitials(name);
  
  // Pick a stable background color based on name string sum
  const colors = [
    "bg-brand-accent text-brand-bg",
    "bg-brand-blue text-brand-bg",
    "bg-brand-gold text-brand-ink",
    "bg-brand-ink text-brand-bg",
    "bg-brand-win text-brand-bg"
  ];
  const colorIndex = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const pickedColor = colors[colorIndex];

  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-mono font-bold tracking-tight uppercase shadow-sm ${pickedColor} ${ringStyles} ${className}`}>
      {initials}
    </div>
  );
};
export default Avatar;
