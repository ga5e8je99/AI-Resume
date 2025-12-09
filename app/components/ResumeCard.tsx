import Link from "next/link";
import ScoreCircle from "./ScoreCircle";
import Image from "next/image";
import { Building2, Briefcase, ChevronRight } from "lucide-react";

export default function ResumeCard({ resume }: { resume: Resume }) {
  return (
    <Link
      href={`/resume/${resume.id}`}
      className="group animate-in fade-in border rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 block overflow-hidden bg-white hover:-translate-y-1"
    >
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {resume.companyName}
              </h2>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <p className="text-gray-700 font-medium truncate">
                {resume.jobTitle}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500"></div>
          </div>

          <div className="shrink-0 ml-4">
            <ScoreCircle score={resume.feedback.overallScore} />
            <div className="text-center mt-2">
              <span className="text-sm font-medium text-gray-600">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="px-6">
        <div className="border-t border-gray-100" />
      </div>

      {/* Image Preview Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-gray-50 to-white">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Preview</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow duration-300">
            <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent z-10" />
            <Image
              src={resume.imagePath}
              alt={`${resume.companyName} Resume Preview`}
              width={500}
              height={300}
              className="w-full h-[280px] object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              priority={false}
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-300 z-20" />
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-600">Analysis Complete</span>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-full hover:bg-blue-50 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
