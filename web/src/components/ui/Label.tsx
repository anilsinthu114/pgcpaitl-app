import React from "react";

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={`label ${className || ""}`} {...props}>{children}</label>;
}
