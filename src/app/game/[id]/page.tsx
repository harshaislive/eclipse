import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Force dynamic
export const dynamic = "force-dynamic";

interface GamePageProps {
    params: {
        id: string;
    };
    searchParams: {
        userId?: string;
    };
}

export default async function GamePage({ params }: GamePageProps) {
    // NOTE: In a real app we'd get userId from session.
    // Here we relying on client to handle identity, but for SSR we can't easily know "who" is viewing 
    // without cookies/headers.
    // 
    // STRATEGY: 
    // The server-side page here will just render a "Loading Interface..." skeleton.
    // A Client Component will fetch the specific player's data (Role) using their localStorage userId.
    // OR, we can pass userId via query param for this MVP if we want SSR, but that's insecure.
    //
    // Better approach for MVP:
    // Render a Client Component "GameTerminal" that reads localStorage, fetches /api/me (or similar), 
    // and displays the role.

    return (
        <main className="flex min-h-screen flex-col bg-void text-white font-mono">
            <GameTerminal matchId={params.id} />
        </main>
    );
}

// Check below for the Client Component
import { GameTerminal } from "@/components/game/game-terminal";
