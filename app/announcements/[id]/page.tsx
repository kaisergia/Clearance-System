import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Calendar, MapPin, ExternalLink, ArrowLeft, Building2 } from "lucide-react";
import { ShareButton } from "@/components/announcements/ShareButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string | Date) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "Important",
  normal: "Notice",
  low: "Notice",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  normal: "bg-red-50 text-[#c41e2a] border-red-100",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

async function getAnnouncement(idStr: string) {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return null;

  try {
    const item = await prisma.announcement.findUnique({
      where: { id },
      include: {
        office: { select: { id: true, name: true, logoUrl: true } },
        department: { select: { id: true, name: true, abbreviation: true, logoUrl: true } },
        org: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!item || !item.isActive) return null;
    return item;
  } catch (err) {
    console.error("Failed to fetch announcement permalink:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getAnnouncement(id);

  if (!item) {
    return {
      title: "Announcement Not Found — Cor Jesu College",
    };
  }

  const images = Array.isArray(item.imageUrls) && (item.imageUrls as string[]).length > 0
    ? (item.imageUrls as string[])
    : ["/images/logos/cjc-logo.webp"];

  return {
    title: `${item.title} — Cor Jesu College`,
    description: item.content.substring(0, 160),
    openGraph: {
      title: item.title,
      description: item.content.substring(0, 160),
      images: images.map((url) => ({ url })),
    },
  };
}

export default async function PublicAnnouncementPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getAnnouncement(id);

  if (!item) {
    notFound();
  }

  const postedBy = item.office
    ? item.office.name
    : item.department
    ? `${item.department.name} (${item.department.abbreviation})`
    : item.org
    ? item.org.name
    : "Cor Jesu College";

  const imageUrls = Array.isArray(item.imageUrls) ? (item.imageUrls as string[]) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-100">
              <Image
                src="/images/logos/cjc-logo.webp"
                alt="CJC Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm block leading-tight">
                Cor Jesu College
              </span>
              <span className="text-[11px] text-gray-500 font-medium">Clearance System</span>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Sign In to System
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-7 sm:p-10 space-y-6">
            {/* Header badges & metadata */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.normal}`}>
                  {PRIORITY_LABELS[item.priority] ?? "Notice"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c41e2a] bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                  <Building2 className="w-3.5 h-3.5" />
                  {postedBy}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                {item.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                <span>Posted {formatDate(item.createdAt)}</span>
                {item.eventDate && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Calendar className="w-3.5 h-3.5 text-[#c41e2a]" />
                    Event: {formatDate(item.eventDate)}
                  </span>
                )}
                {item.eventLocation && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-[#c41e2a]" />
                    {item.eventLocation}
                  </span>
                )}
              </div>
            </div>

            {/* Attached Image Gallery */}
            {imageUrls.length > 0 && (
              <div className={`grid gap-4 ${imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={url}
                      alt={`${item.title} image ${idx + 1}`}
                      className="w-full h-auto max-h-[450px] object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Content Body */}
            <div className="text-gray-800 leading-relaxed text-sm sm:text-base whitespace-pre-wrap pt-2">
              {item.content}
            </div>

            {/* External Link if present */}
            {item.linkUrl && (
              <div className="pt-4 border-t border-gray-100">
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  {item.linkLabel || "Open Link"}
                </a>
              </div>
            )}

            {/* Share Footer Bar */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <ShareButton id={item.id} title={item.title} />
              <Link
                href="/login"
                className="text-xs font-semibold text-[#c41e2a] hover:underline"
              >
                Sign in to view your personalized student dashboard →
              </Link>
            </div>
          </div>
        </article>
      </main>

      {/* Simple Public Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Cor Jesu College. All rights reserved.</p>
      </footer>
    </div>
  );
}
