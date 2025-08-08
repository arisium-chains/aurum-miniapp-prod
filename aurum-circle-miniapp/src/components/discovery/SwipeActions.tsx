"use client"

import { motion } from "framer-motion"

interface SwipeActionsProps {
  onPass: () => void
  onLike: () => void
  onSuperLike: () => void
  disabled?: boolean
  className?: string
}

export function SwipeActions({ 
  onPass, 
  onLike, 
  onSuperLike, 
  disabled = false, 
  className = "" 
}: SwipeActionsProps) {
  const buttonVariants = {
    tap: { scale: 0.95 },
    hover: { scale: 1.1 }
  }

  const ActionButton = ({ 
    onClick, 
    icon, 
    bgColor, 
    size = "md",
    ariaLabel 
  }: {
    onClick: () => void
    icon: string
    bgColor: string
    size?: "sm" | "md" | "lg"
    ariaLabel: string
  }) => {
    const sizeClasses = {
      sm: "w-12 h-12 text-lg",
      md: "w-14 h-14 text-xl", 
      lg: "w-16 h-16 text-2xl"
    }

    return (
      <motion.button
        onClick={onClick}
        disabled={disabled}
        variants={buttonVariants}
        whileTap="tap"
        whileHover="hover"
        className={`
          ${sizeClasses[size]} ${bgColor}
          rounded-full flex items-center justify-center font-bold
          shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 active:shadow-md
        `}
        aria-label={ariaLabel}
      >
        {icon}
      </motion.button>
    )
  }

  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      {/* Pass Button */}
      <ActionButton
        onClick={onPass}
        icon="✕"
        bgColor="bg-red-500 hover:bg-red-600 text-white"
        ariaLabel="Pass on this profile"
      />
      
      {/* Super Like Button */}
      <ActionButton
        onClick={onSuperLike}
        icon="⭐"
        bgColor="bg-accent hover:bg-accent/90 text-accent-foreground"
        size="lg"
        ariaLabel="Super like this profile"
      />
      
      {/* Like Button */}
      <ActionButton
        onClick={onLike}
        icon="💖"
        bgColor="bg-green-500 hover:bg-green-600 text-white"
        ariaLabel="Like this profile"
      />
    </div>
  )
}