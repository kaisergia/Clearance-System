"use client";

import { useState, useEffect } from "react";

interface AcademicTerm {
  id: number;
  name: string;
  status: string;
}

interface ReactPrereq {
  officeId: number | null;
  departmentId: number | null;
  orgId: number | null;
  isDynamicDept: boolean;
  isDynamicOrgs: boolean;
  type: "office" | "department" | "org" | "dynamicDept" | "dynamicOrgs";
}

interface FlowStep {
  id?: number;
  flowId?: number;
  officeId: number | null;
  departmentId: number | null;
  orgId: number | null;
  isDynamicDept: boolean;
  isDynamicOrgs: boolean;
  isPrerequisiteOnly?: boolean;
  sequenceOrder: number;
  prerequisites: ReactPrereq[];
  type?: "office" | "department" | "org" | "dynamicDept" | "dynamicOrgs";
}

interface ClearanceFlow {
  id?: number;
  name: string;
  description: string;
  termId: number;
  status: string;
  targetCriteria: {
    years?: string[];
    departments?: string[];
  };
  steps: FlowStep[];
}

interface Office {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  abbreviation: string;
}

interface Org {
  id: number;
  name: string;
}

export default function ClearanceRequirementsPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [activeTermId, setActiveTermId] = useState<number | null>(null);
  const [flows, setFlows] = useState<ClearanceFlow[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);

  // Modals / Form States
  const [showTermModal, setShowTermModal] = useState(false);
  const [newTermName, setNewTermName] = useState("");
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ClearanceFlow | null>(null);

  // Form Fields for Flow
  const [flowName, setFlowName] = useState("");
  const [flowDesc, setFlowDesc] = useState("");
  const [flowStatus, setFlowStatus] = useState("Draft");
  const [targetYears, setTargetYears] = useState<string[]>([]);
  const [targetDepts, setTargetDepts] = useState<string[]>([]);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [prereqFormStates, setPrereqFormStates] = useState<{[key: number]: { type: string; entityId: string }}>({});

  // Fetch initial data
  useEffect(() => {
    fetchTerms();
    fetchEntityData();
  }, []);

  // Fetch flows when active term changes
  useEffect(() => {
    if (activeTermId !== null) {
      fetchFlows(activeTermId);
    }
  }, [activeTermId]);

  const fetchTerms = async () => {
    try {
      const res = await fetch("/api/terms");
      const data = await res.json();
      setTerms(data);
      if (data.length > 0 && activeTermId === null) {
        const active = data.find((t: any) => t.status === "Active") || data[0];
        setActiveTermId(active.id);
      }
    } catch (err) {
      console.error("Error fetching terms:", err);
    }
  };

  const fetchEntityData = async () => {
    try {
      const [officesRes, deptsRes, orgsRes] = await Promise.all([
        fetch("/api/offices"),
        fetch("/api/departments"),
        fetch("/api/orgs"),
      ]);
      const off = await officesRes.json();
      const dep = await deptsRes.json();
      const og = await orgsRes.json();
      setOffices(off);
      setDepartments(dep);
      setOrgs(og);
    } catch (err) {
      console.error("Error fetching entities:", err);
    }
  };

  const fetchFlows = async (termId: number) => {
    try {
      const res = await fetch(`/api/flows?termId=${termId}`);
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      console.error("Error fetching flows:", err);
    }
  };

  const handleCreateTerm = async () => {
    if (!newTermName) return;
    try {
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTermName, status: "Active" }),
      });
      if (res.ok) {
        setNewTermName("");
        setShowTermModal(false);
        fetchTerms();
      }
    } catch (err) {
      console.error("Error creating term:", err);
    }
  };

  const handleOpenFlowModal = (flow: ClearanceFlow | null = null) => {
    if (flow) {
      setEditingFlow(flow);
      setFlowName(flow.name);
      setFlowDesc(flow.description || "");
      setFlowStatus(flow.status);
      setTargetYears(flow.targetCriteria?.years || []);
      setTargetDepts(flow.targetCriteria?.departments || []);

      // Filter to only main steps (isPrerequisiteOnly === false)
      const mainSteps = flow.steps.filter((s) => !s.isPrerequisiteOnly);

      const mappedSteps = mainSteps.map((step) => {
        let type: FlowStep["type"] = "office";
        if (step.isDynamicDept) type = "dynamicDept";
        else if (step.isDynamicOrgs) type = "dynamicOrgs";
        else if (step.departmentId) type = "department";
        else if (step.orgId) type = "org";

        // Find prerequisite step objects in flow.steps
        const prereqSteps = step.prerequisites
          .map((p) => flow.steps.find((s) => s.id === p.prerequisiteStepId))
          .filter(Boolean) as any[];

        const prerequisites: ReactPrereq[] = prereqSteps.map((pStep) => {
          let pType: ReactPrereq["type"] = "office";
          if (pStep.isDynamicDept) pType = "dynamicDept";
          else if (pStep.isDynamicOrgs) pType = "dynamicOrgs";
          else if (pStep.departmentId) pType = "department";
          else if (pStep.orgId) pType = "org";

          return {
            officeId: pStep.officeId,
            departmentId: pStep.departmentId,
            orgId: pStep.orgId,
            isDynamicDept: pStep.isDynamicDept,
            isDynamicOrgs: pStep.isDynamicOrgs,
            type: pType,
          };
        });

        return {
          ...step,
          type,
          prerequisites,
        };
      });

      setFlowSteps(mappedSteps);
    } else {
      setEditingFlow(null);
      setFlowName("");
      setFlowDesc("");
      setFlowStatus("Draft");
      setTargetYears([]);
      setTargetDepts([]);
      setFlowSteps([]);
    }
    setPrereqFormStates({});
    setShowFlowModal(true);
  };

  const handleAddStep = () => {
    const newStep: FlowStep = {
      officeId: offices[0]?.id || null,
      departmentId: null,
      orgId: null,
      isDynamicDept: false,
      isDynamicOrgs: false,
      isPrerequisiteOnly: false,
      sequenceOrder: flowSteps.length + 1,
      prerequisites: [],
      type: "office",
    };
    setFlowSteps([...flowSteps, newStep]);
  };

  const handleRemoveStep = (idx: number) => {
    const updated = flowSteps.filter((_, i) => i !== idx).map((step, i) => ({
      ...step,
      sequenceOrder: i + 1,
    }));
    setFlowSteps(updated);
  };

  const handleStepChange = (idx: number, field: string, val: any) => {
    const updated = [...flowSteps];
    const step = { ...updated[idx] };

    if (field === "type") {
      step.type = val;
      step.officeId = null;
      step.departmentId = null;
      step.orgId = null;
      step.isDynamicDept = false;
      step.isDynamicOrgs = false;

      if (val === "office" && offices.length > 0) step.officeId = offices[0].id;
      else if (val === "department" && departments.length > 0) step.departmentId = departments[0].id;
      else if (val === "org" && orgs.length > 0) step.orgId = orgs[0].id;
      else if (val === "dynamicDept") step.isDynamicDept = true;
      else if (val === "dynamicOrgs") step.isDynamicOrgs = true;
    } else if (field === "entityId") {
      const type = step.type;
      if (type === "office") step.officeId = Number(val);
      else if (type === "department") step.departmentId = Number(val);
      else if (type === "org") step.orgId = Number(val);
    }

    updated[idx] = step;
    setFlowSteps(updated);
  };

  const handleAddPrereq = (stepIdx: number) => {
    const formState = prereqFormStates[stepIdx] || { type: "office", entityId: offices[0]?.id?.toString() || "" };
    
    let pOfficeId: number | null = null;
    let pDepartmentId: number | null = null;
    let pOrgId: number | null = null;
    let pIsDynamicDept = false;
    let pIsDynamicOrgs = false;

    if (formState.type === "office") pOfficeId = Number(formState.entityId);
    else if (formState.type === "department") pDepartmentId = Number(formState.entityId);
    else if (formState.type === "org") pOrgId = Number(formState.entityId);
    else if (formState.type === "dynamicDept") pIsDynamicDept = true;
    else if (formState.type === "dynamicOrgs") pIsDynamicOrgs = true;

    const newPrereq: ReactPrereq = {
      officeId: pOfficeId,
      departmentId: pDepartmentId,
      orgId: pOrgId,
      isDynamicDept: pIsDynamicDept,
      isDynamicOrgs: pIsDynamicOrgs,
      type: formState.type as any,
    };

    const updated = [...flowSteps];
    const step = { ...updated[stepIdx] };
    step.prerequisites = [...(step.prerequisites || []), newPrereq];
    updated[stepIdx] = step;
    setFlowSteps(updated);

    // Reset selector form state for this index
    setPrereqFormStates({
      ...prereqFormStates,
      [stepIdx]: { type: "office", entityId: offices[0]?.id?.toString() || "" }
    });
  };

  const handleRemovePrereq = (stepIdx: number, prereqIdx: number) => {
    const updated = [...flowSteps];
    const step = { ...updated[stepIdx] };
    step.prerequisites = (step.prerequisites || []).filter((_, i) => i !== prereqIdx);
    updated[stepIdx] = step;
    setFlowSteps(updated);
  };

  const handleSaveFlow = async () => {
    if (!flowName || activeTermId === null) return;

    const flatSteps: any[] = [];

    flowSteps.forEach((mainStep, mainIdx) => {
      const prereqIndicesForThisStep: number[] = [];

      (mainStep.prerequisites || []).forEach((prereq) => {
        const prereqPayloadIdx = flatSteps.length;
        flatSteps.push({
          officeId: prereq.officeId,
          departmentId: prereq.departmentId,
          orgId: prereq.orgId,
          isDynamicDept: prereq.isDynamicDept,
          isDynamicOrgs: prereq.isDynamicOrgs,
          isPrerequisiteOnly: true,
          sequenceOrder: mainIdx + 1,
        });
        prereqIndicesForThisStep.push(prereqPayloadIdx);
      });

      flatSteps.push({
        id: mainStep.id,
        officeId: mainStep.officeId,
        departmentId: mainStep.departmentId,
        orgId: mainStep.orgId,
        isDynamicDept: mainStep.isDynamicDept,
        isDynamicOrgs: mainStep.isDynamicOrgs,
        isPrerequisiteOnly: false,
        sequenceOrder: mainIdx + 1,
        prerequisiteIndices: prereqIndicesForThisStep,
      });
    });

    const payload = {
      id: editingFlow?.id,
      name: flowName,
      description: flowDesc,
      termId: activeTermId,
      status: flowStatus,
      targetCriteria: {
        years: targetYears,
        departments: targetDepts,
      },
      steps: flatSteps,
    };

    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowFlowModal(false);
        fetchFlows(activeTermId);
      }
    } catch (err) {
      console.error("Error saving flow:", err);
    }
  };

  const toggleYearFilter = (year: string) => {
    if (targetYears.includes(year)) {
      setTargetYears(targetYears.filter((y) => y !== year));
    } else {
      setTargetYears([...targetYears, year]);
    }
  };

  const toggleDeptFilter = (deptAbbr: string) => {
    if (targetDepts.includes(deptAbbr)) {
      setTargetDepts(targetDepts.filter((d) => d !== deptAbbr));
    } else {
      setTargetDepts([...targetDepts, deptAbbr]);
    }
  };

  const getStepName = (step: any) => {
    if (step.officeId) {
      return offices.find((o) => o.id === step.officeId)?.name || `Office (ID: ${step.officeId})`;
    }
    if (step.departmentId) {
      return departments.find((d) => d.id === step.departmentId)?.name || `Department (ID: ${step.departmentId})`;
    }
    if (step.orgId) {
      return orgs.find((o) => o.id === step.orgId)?.name || `Organization (ID: ${step.orgId})`;
    }
    if (step.isDynamicDept) return "Dynamic: Student's Academic Department";
    if (step.isDynamicOrgs) return "Dynamic: Student's Registered Clubs/Orgs";
    return "Unknown Signatory";
  };

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Clearance Flow Architect</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Sequence signatories and configure prerequisite flows for each term.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTermModal(true)}
            className="px-4 py-2 bg-surface-container-lowest border border-surface-container-high rounded text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            New Term
          </button>
          <button
            onClick={() => handleOpenFlowModal()}
            className="px-5 py-2 bg-brand-red text-white rounded font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2 btn-hover"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Flow
          </button>
        </div>
      </div>

      {/* Term Tabs */}
      <div className="flex gap-6 border-b border-surface-container-high mb-8 relative overflow-x-auto whitespace-nowrap scrollbar-none">
        {terms.map((term) => (
          <button
            key={term.id}
            onClick={() => setActiveTermId(term.id)}
            className={`pb-3 font-title-md text-title-md border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTermId === term.id
                ? "text-brand-red border-brand-red"
                : "text-secondary hover:text-on-surface border-transparent"
            }`}
          >
            {term.name}
            {term.status === "Active" && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-label-md text-[10px] uppercase tracking-wider">
                Active
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-red/20" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-title-md text-title-md text-on-surface font-semibold">{flow.name}</h3>
                <span className="font-label-md text-label-md text-secondary block mt-1">
                  Target: {flow.targetCriteria?.years?.join(", ") || "All Years"}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  flow.status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {flow.status}
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-secondary mb-6 flex-1">
              {flow.description || "No description provided."}
            </p>

            <div className="bg-surface-container-low rounded-lg p-4 mb-6">
              <div className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-2">
                Flow Hierarchy ({flow.steps.length} steps)
              </div>
              <div className="space-y-2">
                {flow.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-semibold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{getStepName(step)}</span>
                    {step.prerequisites.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.25 bg-surface-container-high text-secondary rounded">
                        Requires Step{" "}
                        {step.prerequisites
                          .map((p) => flow.steps.findIndex((s) => s.id === p.prerequisiteStepId) + 1)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-surface-container-high pt-4 mt-auto">
              <button
                onClick={() => handleOpenFlowModal(flow)}
                className="text-brand-red hover:underline text-sm font-semibold flex items-center gap-1"
              >
                Edit Flow Config
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
          </div>
        ))}

        {flows.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-surface-container-high rounded-xl text-secondary">
            <span className="material-symbols-outlined text-5xl mb-3">timeline</span>
            <p className="font-body-lg text-body-lg">No Clearance Flows Defined</p>
            <p className="font-body-sm text-body-sm mt-1 mb-4">
              Get started by creating a signatory hierarchy for this term.
            </p>
            <button
              onClick={() => handleOpenFlowModal()}
              className="px-4 py-2 bg-brand-red text-white rounded font-label-md text-label-md hover:bg-primary transition-all"
            >
              Add First Flow
            </button>
          </div>
        )}
      </div>

      {/* Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-title-md text-title-md text-on-surface mb-4">Create Academic Term</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1">Term Name *</label>
                <input
                  className="w-full px-4 py-2 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm outline-none"
                  placeholder="e.g. 1st Sem 2024-2025"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTermModal(false)}
                className="flex-1 py-2 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTerm}
                className="flex-1 py-2 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md"
              >
                Create & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flow Builder Modal */}
      {showFlowModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-surface-container-high shrink-0">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                {editingFlow ? "Edit Clearance Flow" : "Create Clearance Flow"}
              </h3>
              <button onClick={() => setShowFlowModal(false)} className="p-1 rounded text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Flow Configuration and Steps Editor */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block font-body-sm text-body-sm text-on-surface font-semibold mb-1">Flow Name *</label>
                      <input
                        className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm outline-none"
                        placeholder="e.g. Regular Semestral Clearance"
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-body-sm text-body-sm text-on-surface font-semibold mb-1">Description</label>
                      <textarea
                        className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm outline-none resize-none h-20"
                        placeholder="Brief description of who needs this and why..."
                        value={flowDesc}
                        onChange={(e) => setFlowDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-body-sm text-body-sm text-on-surface font-semibold mb-1">Publish Status</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm outline-none"
                        value={flowStatus}
                        onChange={(e) => setFlowStatus(e.target.value)}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Targeting Filters */}
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <h4 className="font-title-sm text-title-sm text-on-surface font-bold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-brand-red">group</span>
                    Audience Targeting Criteria
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body-sm text-body-sm text-secondary font-semibold mb-2">Target Year Levels (Empty = All)</label>
                      <div className="flex flex-wrap gap-2">
                        {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Irregular"].map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => toggleYearFilter(year)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              targetYears.includes(year)
                                ? "bg-brand-red/10 border-brand-red text-brand-red"
                                : "bg-surface-container-lowest border-surface-container-high text-secondary"
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block font-body-sm text-body-sm text-secondary font-semibold mb-2">Target Departments (Empty = All)</label>
                      <div className="flex flex-wrap gap-2">
                        {departments.map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => toggleDeptFilter(dept.abbreviation)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              targetDepts.includes(dept.abbreviation)
                                ? "bg-brand-red/10 border-brand-red text-brand-red"
                                : "bg-surface-container-lowest border-surface-container-high text-secondary"
                            }`}
                          >
                            {dept.abbreviation}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatory Hierarchy Builder */}
                <div className="border border-surface-container-high rounded-xl overflow-hidden">
                  <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-b border-surface-container-high">
                    <h4 className="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-brand-red">schema</span>
                      Signatory Hierarchy (Sequence & Prerequisites)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="px-3 py-1.5 bg-brand-red text-white rounded font-label-md text-label-md hover:bg-primary transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      Add Signatory Node
                    </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto bg-surface-container-lowest">
                    {flowSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col xl:flex-row xl:items-start gap-6 p-5 border border-surface-container-high rounded-xl bg-surface-container-low hover:border-brand-red/30 transition-all relative"
                      >
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {idx + 1}
                          </span>
                          <div className="xl:hidden font-bold text-sm">Node Settings</div>
                        </div>

                        {/* Main Step Signatory Picker */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <div>
                            <label className="block text-xs font-semibold text-secondary mb-1">Signatory Type</label>
                            <select
                              className="w-full px-3 py-2 rounded border border-surface-container-high bg-surface-container-lowest text-xs outline-none"
                              value={step.type}
                              onChange={(e) => handleStepChange(idx, "type", e.target.value)}
                            >
                              <option value="office">Office</option>
                              <option value="department">Department</option>
                              <option value="org">Organization</option>
                            </select>
                          </div>

                          {step.type === "office" && (
                            <div>
                              <label className="block text-xs font-semibold text-secondary mb-1">Select Office</label>
                              <select
                                className="w-full px-3 py-2 rounded border border-surface-container-high bg-surface-container-lowest text-xs outline-none"
                                value={step.officeId || ""}
                                onChange={(e) => handleStepChange(idx, "entityId", e.target.value)}
                              >
                                {offices.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {step.type === "department" && (
                            <div>
                              <label className="block text-xs font-semibold text-secondary mb-1">Select Department</label>
                              <select
                                className="w-full px-3 py-2 rounded border border-surface-container-high bg-surface-container-lowest text-xs outline-none"
                                value={step.departmentId || ""}
                                onChange={(e) => handleStepChange(idx, "entityId", e.target.value)}
                              >
                                {departments.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {step.type === "org" && (
                            <div>
                              <label className="block text-xs font-semibold text-secondary mb-1">Select Organization</label>
                              <select
                                className="w-full px-3 py-2 rounded border border-surface-container-high bg-surface-container-lowest text-xs outline-none"
                                value={step.orgId || ""}
                                onChange={(e) => handleStepChange(idx, "entityId", e.target.value)}
                              >
                                {orgs.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Prerequisite Steps nested under the card */}
                        <div className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-surface-container-high pt-4 xl:pt-0 xl:pl-6 shrink-0">
                          <label className="block text-xs font-semibold text-secondary mb-1">Prerequisite Steps</label>
                          
                          {/* List of currently added prerequisites as chips */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(step.prerequisites || []).map((prereq, pIdx) => (
                              <span key={pIdx} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-red/10 border border-brand-red/20 text-brand-red text-[11px] font-semibold shadow-sm">
                                {getStepName(prereq)}
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrereq(idx, pIdx)}
                                  className="hover:text-primary transition-colors text-[14px] leading-none select-none font-bold ml-1"
                                  title="Remove Prerequisite"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                            {(step.prerequisites || []).length === 0 && (
                              <span className="text-[11px] text-secondary italic block py-1">No prerequisites defined yet.</span>
                            )}
                          </div>

                          {/* Dropdown selectors to add new prerequisite signatory */}
                          <div className="space-y-2 border border-surface-container-high bg-surface-container-lowest p-2 rounded">
                            <div className="grid grid-cols-2 gap-1.5">
                              {/* Prerequisite Type selector */}
                              <select
                                className="px-2 py-1 rounded border border-surface-container-high bg-surface-container-lowest text-[11px] outline-none cursor-pointer"
                                value={prereqFormStates[idx]?.type || "office"}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  let defaultId = "";
                                  if (newType === "office" && offices.length > 0) defaultId = offices[0].id.toString();
                                  else if (newType === "department" && departments.length > 0) defaultId = departments[0].id.toString();
                                  else if (newType === "org" && orgs.length > 0) defaultId = orgs[0].id.toString();
                                  
                                  setPrereqFormStates({
                                    ...prereqFormStates,
                                    [idx]: { type: newType, entityId: defaultId }
                                  });
                                }}
                              >
                                <option value="office">Office</option>
                                <option value="department">Department</option>
                                <option value="org">Organization</option>
                              </select>

                              {/* Prerequisite Entity Selector */}
                              {(!prereqFormStates[idx]?.type || prereqFormStates[idx]?.type === "office") && (
                                <select
                                  className="px-2 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest text-[11px] outline-none cursor-pointer"
                                  value={prereqFormStates[idx]?.entityId || (offices[0]?.id?.toString() || "")}
                                  onChange={(e) => setPrereqFormStates({
                                    ...prereqFormStates,
                                    [idx]: { type: prereqFormStates[idx]?.type || "office", entityId: e.target.value }
                                  })}
                                >
                                  {offices.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                  ))}
                                </select>
                              )}

                              {prereqFormStates[idx]?.type === "department" && (
                                <select
                                  className="px-2 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest text-[11px] outline-none cursor-pointer"
                                  value={prereqFormStates[idx]?.entityId || (departments[0]?.id?.toString() || "")}
                                  onChange={(e) => setPrereqFormStates({
                                    ...prereqFormStates,
                                    [idx]: { type: "department", entityId: e.target.value }
                                  })}
                                >
                                  {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                  ))}
                                </select>
                              )}

                              {prereqFormStates[idx]?.type === "org" && (
                                <select
                                  className="px-2 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest text-[11px] outline-none cursor-pointer"
                                  value={prereqFormStates[idx]?.entityId || (orgs[0]?.id?.toString() || "")}
                                  onChange={(e) => setPrereqFormStates({
                                    ...prereqFormStates,
                                    [idx]: { type: "org", entityId: e.target.value }
                                  })}
                                >
                                  {orgs.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleAddPrereq(idx)}
                              className="w-full py-1.5 bg-brand-red text-white text-[10px] font-bold rounded hover:bg-primary transition-all flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px]">add</span>
                              Add Prerequisite
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="text-secondary hover:text-brand-red p-2.5 rounded hover:bg-brand-red/5 shrink-0 self-end xl:self-auto xl:absolute xl:top-4 xl:right-4"
                          title="Remove Step"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}

                    {flowSteps.length === 0 && (
                      <div className="py-8 text-center text-secondary text-xs italic">
                        No signatories added to this flow yet. Add at least one to define the clearance sequence.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Visual Timeline Map */}
              <div className="lg:col-span-1 bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col min-h-[400px]">
                <h4 className="font-title-sm text-title-sm text-on-surface font-bold mb-6 flex items-center gap-2 border-b border-surface-container-high pb-3">
                  <span className="material-symbols-outlined text-[22px] text-brand-red">timeline</span>
                  Clearance Status Map
                </h4>

                {flowSteps.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-secondary py-12">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-40">alt_route</span>
                    <p className="text-xs italic">Add signatory nodes on the left to generate the visual clearance sequence.</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-0 relative pl-2">
                    {flowSteps.map((step, idx) => {
                      const stepName = getStepName(step);
                      const hasPrereqs = step.prerequisites && step.prerequisites.length > 0;

                      return (
                        <div key={idx} className="relative flex gap-4 items-start pb-8 last:pb-0 group">
                          {/* Vertical Connector Line */}
                          {idx < flowSteps.length - 1 && (
                            <div className="absolute top-7 left-3.5 w-[2px] bottom-0 bg-surface-container-high" />
                          )}

                          {/* Node Circle Icon */}
                          <div className="w-7 h-7 rounded-full border-2 border-surface-container-high bg-white flex items-center justify-center shrink-0 z-10">
                            <div className="w-2 h-2 rounded-full bg-secondary/35" />
                          </div>

                          {/* Node Content Info */}
                          <div className="flex-1 flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="font-title-sm text-sm text-on-surface font-bold group-hover:text-primary transition-colors">
                                {stepName}
                              </span>
                              
                              {/* Prerequisites Checklists nested under the parent office */}
                              {hasPrereqs && (
                                <div className="mt-3 pl-4 border-l-2 border-dashed border-brand-red/20 space-y-2.5">
                                  {step.prerequisites.map((prereq, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-2 text-xs text-secondary relative">
                                      <div className="w-4 h-4 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0">
                                        <div className="w-1 h-1 rounded-full bg-secondary/35" />
                                      </div>
                                      <span>{getStepName(prereq)}</span>
                                      <span className="text-[10px] text-secondary bg-surface-container-low px-1.5 py-0.25 rounded font-semibold ml-auto">
                                        Not cleared
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Node Status Pill */}
                            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-secondary text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm border border-surface-container-high">
                              Pending
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

            <div className="flex gap-3 justify-end border-t border-surface-container-high p-6 bg-surface-container-low/30 shrink-0">
              <button
                type="button"
                onClick={() => setShowFlowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFlow}
                className="px-6 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md btn-hover"
              >
                Save Clearance Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
