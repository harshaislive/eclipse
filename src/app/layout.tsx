import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
});

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
});

export const metadata: Metadata = {
    title: "Protocol ECLIPSE",
    description: "A Cyber-Noir Social Deduction Game",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn(
                "min-h-screen bg-void text-gray-300 font-mono antialiased",
                jetbrainsMono.variable,
                playfairDisplay.variable
            )}>
                <div className="scanlines"></div>
                <div className="relative z-10">
                    {children}
                </div>
            </body>
        </html>
    );
}
