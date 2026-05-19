'use client';

export interface FHIRSessionData {
  id?: string;
  patient_id?: string;
  care_level?: string;
  symptoms?: string[];
  clinical_reasoning?: string;
}

export function generateFHIRObservation(sessionData: FHIRSessionData): object {
  return {
    resourceType: "Observation",
    id: `aegis-triage-${sessionData.id || 'stub'}`,
    status: "final",
    category: [{ coding: [{ system: "hl7.org", code: "exam", display: "Exam" }] }],
    code: { 
      coding: [{ system: "http://loinc.org", code: "86470-2", display: "Medical triage note" }], 
      text: "Aegis AI Automated Health Triage Assessment" 
    },
    subject: { identifier: { system: "aegis.os", value: sessionData.patient_id || "anonymous-hash" } },
    effectiveDateTime: new Date().toISOString(),
    valueString: `Care Level Assigned: ${sessionData.care_level || 'UNKNOWN'}`,
    component: [
      { code: { text: "Extracted Clinical Symptoms" }, valueString: JSON.stringify(sessionData.symptoms || []) },
      { code: { text: "Explainable AI Clinical Reasoning" }, valueString: sessionData.clinical_reasoning || "No automated lineage log generated." }
    ]
  };
}

import Cookies from 'js-cookie';

export function triggerFHIRDownload(sessionData: FHIRSessionData): void {
  const role = Cookies.get('aegis_role');
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    alert("Unauthorized. Only Doctors and Admins can export FHIR data.");
    return;
  }

  const fhirPayload = generateFHIRObservation(sessionData);
  const blob = new Blob([JSON.stringify(fhirPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `FHIR_R4_OBSERVATION_${sessionData.id || 'EXPORT'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
