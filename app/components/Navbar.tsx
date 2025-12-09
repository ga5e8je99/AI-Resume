import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center bg-white/20 border border-gray-800 px-8 py-4 rounded-4xl shadow-xl mx-10 mt-5">
      <Link href="/">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">J</span>
          </div>
          <span className="font-bold text-2xl text-white">
            Job
            <span className="bg-linear-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">
              Match
            </span>
          </span>
        </div>
      </Link>

      <Link href="#upload">
        <button className="bg-linear-to-r from-blue-600 to-pink-600 text-white px-6 py-3 rounded-4xl font-semibold hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2 group">
          <svg
            className="w-5 h-5 group-hover:animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload Resume
        </button>
      </Link>
    </nav>
  );
}
