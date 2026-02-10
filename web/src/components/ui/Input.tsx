import React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return <input className={`input ${className || ""}`} ref={ref} {...props} />;
    }
);
Input.displayName = "Input";
