"use client";

const STEPS = [
  {
    step: "01",
    title: "Sign In to Your Account",
    desc: "Use the Sign In button and log in with your institutional Google account (@g.cjc.edu.ph) to access the portal.",
  },
  {
    step: "02",
    title: "Initiate Your Clearance Request",
    desc: "Start a semester clearance request from your dashboard. The system automatically generates clearance items for your department, all school offices, and the organizations you belong to.",
  },
  {
    step: "03",
    title: "Submit Requirements Per Source",
    desc: "For each clearance source — department, office, club, or student government — upload the required documents. Some requirements are fulfilled automatically when staff scan your ID at an event.",
  },
  {
    step: "04",
    title: "View Your Completed Clearance",
    desc: "Once every department, office, and organization has approved your items, your overall clearance status becomes Completed — fully cleared for the semester.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-gray-50 py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
          <div className="w-14 h-0.5 bg-[#c41e2a] mx-auto mt-4" />
        </div>

        <div className="space-y-6">
          {STEPS.map((item, index) => (
            <div key={item.step} className="flex gap-5 sm:gap-8">
              {/* Number bubble + connecting line */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#c41e2a] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                  {item.step}
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 bg-red-100 mt-2" />
                )}
              </div>

              {/* Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1 mb-2">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
