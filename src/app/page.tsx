export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-void">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-serif text-cyan animate-pulse">
                    PROTOCOL <span className="text-blood">ECLIPSE</span>
                </h1>
            </div>

            <div className="mt-12 border border-slate-700 p-8 rounded bg-slate-dark/50 backdrop-blur-sm max-w-md w-full">
                <p className="text-cyan mb-4">> SYSTEM_STATUS: <span className="text-green-500">ONLINE</span></p>
                <p className="text-gray-400 mb-8">> WAITING_FOR_CONNECTION...</p>

                <button className="w-full bg-cyan/10 border border-cyan text-cyan hover:bg-cyan/20 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all py-3 px-4 rounded uppercase tracking-widest font-bold text-xs ring-1 ring-cyan ring-offset-2 ring-offset-void">
                    Initialize Uplink
                </button>
            </div>
        </main>
    );
}
