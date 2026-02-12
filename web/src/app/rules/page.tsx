import React from 'react';
import { Metadata } from "next";
import RulesContent from './RulesContent';

export const metadata: Metadata = {
    title: "Fee Payment & EMI Rules — PGCPAITL",
    description: "Fee structure and payment rules for PGCPAITL program",
};

export default function RulesPage() {
    return <RulesContent />;
}
