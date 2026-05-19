import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // ramp up to 10 users
    { duration: '1m', target: 10 },  // stay at 10 users
    { duration: '30s', target: 0 },   // ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  // Use the public consent endpoint to avoid authentication boilerplate in load test
  // This exercises the DB connection and rate limiter.
  const url = 'http://localhost:8000/api/v1/patient/consent/record';
  
  // Generate a random session ID to avoid collisions
  const sessionId = `load_test_${Math.random().toString(36).substring(2, 15)}`;
  
  const payload = JSON.stringify({
    session_id: sessionId,
    purpose_agreed: 'ai_clinical_triage,symptom_assessment',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
