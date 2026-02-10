import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", isLoading, className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={`btn btn-${variant} ${isLoading ? "opacity-70 cursor-not-allowed" : ""} ${className || ""}`}
                {...props}
            >
                {isLoading && (
                    <span className="mr-2 animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"></span>
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
