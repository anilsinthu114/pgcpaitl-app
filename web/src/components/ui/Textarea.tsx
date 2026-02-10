import React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={`input h-auto min-h-[100px] py-2 ${className || ""}`}
                ref={ref}
                {...props}
            />
        );
    }
);
Textarea.displayName = "Textarea";
