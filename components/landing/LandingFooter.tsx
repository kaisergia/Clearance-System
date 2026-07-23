"use client";

import Image from "next/image";
import { Globe, Smartphone, Phone, Mail, MapPin } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#6b1219] text-white/70">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10 text-center md:text-left">
          {/* Logo + Info */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-5">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex-shrink-0">
                <Image
                  src="/images/logos/cjc-logo.webp"
                  alt="CJC Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-white font-bold text-base mb-1">Cor Jesu College</p>
            <p className="text-sm mb-4">Sacred Heart Avenue, Digos City</p>
            <p className="text-sm leading-relaxed">
              A digital clearance tracking system for students, departments, offices, and organizations of Cor Jesu College.
            </p>
          </div>

          {/* Colleges */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Colleges</h4>
            <ul className="space-y-2 text-sm">
              <li>College of Accountancy &amp; Business Education</li>
              <li>College of Education, Arts &amp; Sciences</li>
              <li>College of Computing &amp; Information Sciences</li>
              <li>College of Health Sciences</li>
              <li>College of Engineering</li>
              <li>College of Special Programs</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 md:justify-start justify-center">
                <Phone className="w-4 h-4 flex-shrink-0" />
                (082) 553-2433
              </li>
              <li className="flex items-center gap-2.5 md:justify-start justify-center">
                <Smartphone className="w-4 h-4 flex-shrink-0" />
                +63 985 062 0281
              </li>
              <li className="flex items-center gap-2.5 md:justify-start justify-center">
                <Mail className="w-4 h-4 flex-shrink-0" />
                customerservice@cjc.edu.ph
              </li>
              <li className="flex items-start gap-2.5 md:justify-start justify-center">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Sacred Heart Avenue,<br />Digos City, Davao del Sur</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Follow CJC</h4>
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://www.facebook.com/corjesucollege"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.cjc.edu.ph"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Official Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          <p>&copy; {new Date().getFullYear()} Cor Jesu College. All rights reserved.</p>
          <p className="text-white/40">
            Developed by College of Computing &amp; Information Sciences (CCIS)
          </p>
        </div>

        {/* Dev disclaimer */}
        <div className="mt-4 text-center text-xs text-white/30 leading-relaxed max-w-2xl mx-auto">
          This system is developed as a student project under Software Engineering and is currently under development.
          All content, media, and features shown are subject to change. All trademarks and logos belong to their respective owners.
        </div>
      </div>
    </footer>
  );
}
