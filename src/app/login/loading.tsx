export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EBE7] to-[#F4EBE7]/95 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#1C4444]/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/[0.03] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Large Logo */}
      <h1 className="text-6xl md:text-7xl lg:text-8xl font-normal tracking-[0.3em] text-[#1C4444] mb-8 animate-pulse">
        AYONNE
      </h1>

      {/* Tagline */}
      <p className="text-sm uppercase tracking-[0.25em] text-[#D4AF37] mb-12">
        Skin Analyzer
      </p>

      {/* Loading indicator */}
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-[#1C4444] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#1C4444] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#1C4444] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
