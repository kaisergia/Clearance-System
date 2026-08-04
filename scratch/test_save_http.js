async function run() {
  const payload = {
    name: "HTTP Test Flow",
    description: "Testing saving via HTTP endpoint",
    termId: 1,
    status: "Draft",
    targetCriteria: {
      years: ["4th Year"],
      departments: ["CCIS"]
    },
    steps: [
      {
        officeId: 1,
        sequenceOrder: 1,
        isPrerequisiteOnly: false
      },
      {
        officeId: 2,
        sequenceOrder: 2,
        isPrerequisiteOnly: false,
        prerequisiteIndices: [0]
      }
    ]
  };

  try {
    console.log("Sending POST request to http://localhost:3000/api/flows...");
    const res = await fetch("http://localhost:3000/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
  } catch (err) {
    console.error("HTTP REQUEST FAILED:", err);
  }
}

run();
