import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "BotBinance | High-Frequency Trading Core",
    description: "Premium execution dashboard for algorithmic trading bots",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark h-full" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-zinc-950 text-zinc-200 overflow-hidden`}>
                <Providers>
                    <div className="flex h-full w-full overflow-hidden">
                        {/* Static Sidebar */}
                        <Sidebar />

                        {/* Main Content Area */}
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <TopBar />
                            <main className="flex-1 overflow-y-auto px-8 py-8 scroll-smooth">
                                <div className="mx-auto max-w-7xl">
                                    {children}
                                </div>
                            </main>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
