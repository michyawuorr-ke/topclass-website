export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#fcfbf9] text-[#2c221e] p-6 pb-12 overflow-hidden selection:bg-[#f3ece3]">
      {/* Visual Workspace Top Header */}
      <div className="flex flex-col items-start pt-12 max-w-md w-full mx-auto space-y-2">
        <h1 className="text-3xl font-light tracking-wide text-[#2c221e]">
          Topclass Experience
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#a3978e]">
          Presence & Identity
        </p>
      </div>

      {/* Main Interaction Surface - Bottom 40% Ergonomics */}
      <div className="w-full max-w-md mx-auto flex flex-col justify-end h-[40vh] space-y-6">
        <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-[#f3ece3] shadow-sm space-y-4">
          <p className="text-sm font-light text-[#5a4d46] leading-relaxed">
            Welcome to your premium application framework. The workspace is officially active.
          </p>
          
          <div className="w-full py-4 bg-[#2c221e] text-[#fcfbf9] text-center text-sm font-medium tracking-wide rounded-xl active:scale-[0.98] transition-transform duration-150">
            Initialize Workspace
          </div>
        </div>
      </div>
    </main>
  );
}
