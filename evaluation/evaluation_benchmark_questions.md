[
  {
    "id": "Q1_historical",
    "category": "historical",
    "mode": "cti",
    "question": "What do historical reports state about MiniDuke PDF zero-day attacks, how it works in a real scenario, and what mitigations are documented?",
    "expected_behavior": "ground_and_cite"
  },
  {
    "id": "Q2_vulnerability",
    "category": "vulnerability",
    "mode": "cti",
    "question": "What vulnerability severity, CISA KEV status, and exploit signals are recorded in the CVE snapshot for recent critical vulnerabilities?",
    "expected_behavior": "ground_and_cite"
  },
  {
    "id": "Q3_ransomware_claims",
    "category": "ransomware",
    "mode": "cti",
    "question": "What ransomware-group leak-site victim claims are recorded for healthcare organisations, and what caveats apply?",
    "expected_behavior": "ground_and_cite"
  },
  {
    "id": "Q4_definition_mitigation",
    "category": "definition_mitigation",
    "mode": "cti",
    "question": "What is a wiper attack and what step-by-step mitigations are documented in the selected datasets?",
    "expected_behavior": "ground_and_cite"
  },
  {
    "id": "Q5_case_studies",
    "category": "case_studies",
    "mode": "cti",
    "question": "Give two documented healthcare ransomware cases and explain their impact and documented response.",
    "expected_behavior": "ground_and_cite"
  },
  {
    "id": "Q6_out_of_scope",
    "category": "out_of_scope",
    "mode": "cti",
    "question": "What was the exact financial loss of the 2031 Mars colony ransomware attack?",
    "expected_behavior": "abstain"
  },
  {
    "id": "Q7_email_triage",
    "category": "email_triage",
    "mode": "email",
    "question": "From: \"Microsoft 365 Security\" <alert@m365-auth-verify-portal.com>\nSubject: URGENT: Password expires in 2 hours\nBody: Click https://m365-auth-verify-portal.com/login immediately to verify your credentials or your mailbox will be locked.",
    "expected_behavior": "triage_indicators"
  }
]