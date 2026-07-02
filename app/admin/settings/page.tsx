"use client";

export default function AdminSettingsPage() {
  return (
    <div className="p-margin-desktop max-w-3xl mx-auto">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Settings</h2>
        <p className="font-body-md text-body-md text-secondary mt-1">System configuration and preferences.</p>
      </div>

      <div className="space-y-lg">
        {/* General Settings */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg">
          <h3 className="font-title-md text-title-md text-on-surface mb-lg">General</h3>
          <div className="space-y-md">
            {[
              { label: "Institution Name", value: "University of Sample" },
              { label: "Current Academic Year", value: "2024-2025" },
              { label: "Current Semester", value: "1st Semester" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1">{f.label}</label>
                <input
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                  defaultValue={f.value}
                />
              </div>
            ))}
          </div>
          <button className="mt-lg px-md py-sm bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors btn-hover">
            Save Changes
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg">
          <h3 className="font-title-md text-title-md text-on-surface mb-lg">Notifications</h3>
          <div className="space-y-md">
            {[
              { label: "Email notifications for new clearance requests", enabled: true },
              { label: "Weekly clearance summary report", enabled: true },
              { label: "Org status change alerts", enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-on-surface">{setting.label}</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${setting.enabled ? "bg-brand-red" : "bg-surface-container-high"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${setting.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-surface-container-lowest rounded-xl border border-error/20 shadow-sm p-lg">
          <h3 className="font-title-md text-title-md text-error mb-sm">Danger Zone</h3>
          <p className="font-body-sm text-body-sm text-secondary mb-lg">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex gap-sm">
            <button className="px-md py-sm border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors">
              Reset All Clearances
            </button>
            <button className="px-md py-sm border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors">
              Archive Semester Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
