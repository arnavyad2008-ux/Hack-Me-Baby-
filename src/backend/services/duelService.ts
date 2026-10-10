import { DuelResponse } from "@/shared/types";

export class DuelService {
  public static evaluatePayload(
    targetCode: string,
    patchedCode: string | null,
    customPayload: string
  ): DuelResponse {
    const trimmed = customPayload.trim();
    if (!trimmed) {
      return {
        bypassed: false,
        statusCode: 400,
        statusText: "EMPTY_PAYLOAD",
        feedback: "Please provide a test payload string.",
        responsePayload: "ERR: No payload received",
      };
    }

    // If patched code exists and active, the defense intercepts
    if (patchedCode) {
      const isSqlInjectionPattern = /'|--|OR|SELECT|UNION|;|DROP/i.test(trimmed);
      const isSsrfPattern = /169\.254|localhost|127\.0\.0\.1|file:\/\//i.test(trimmed);

      if (isSqlInjectionPattern || isSsrfPattern) {
        return {
          bypassed: false,
          statusCode: 403,
          statusText: "403 FORBIDDEN // BLOCKED BY BLUE SENTINEL",
          feedback: `[INTERCEPTED] Blue Bot defense detected hostile token vector. Parameterized query / IP filter quarantined input safely.`,
          responsePayload: `{"status": 403, "error": "Blocked by Zero-Trust Boundary Guard", "vector": "${trimmed}"}`,
        };
      }

      return {
        bypassed: false,
        statusCode: 200,
        statusText: "200 OK // BENIGN INPUT PROCESSED",
        feedback: `Input treated as sanitized string parameter. Zero control-flow hijacking occurred.`,
        responsePayload: `{"status": 200, "result": "Safe execution verified"}`,
      };
    }

    // If unpatched, dangerous tokens succeed against the raw code
    const exploits = /'|--|1=1|169\.254|admin/i.test(trimmed);
    if (exploits) {
      return {
        bypassed: true,
        statusCode: 200,
        statusText: "200 OK // EXPLOIT TRIGGERED",
        feedback: `[!] CRITICAL: Payload successfully evaluated in raw SQL/network sink! System compromised. Apply Blue Team patch immediately.`,
        responsePayload: `{"status": 200, "session": "ADMIN_TAUTOLOGY_BYPASS", "token": "EXPLOITED_JWT"}`,
      };
    }

    return {
      bypassed: false,
      statusCode: 401,
      statusText: "401 INVALID_CREDENTIALS",
      feedback: "Payload rejected by standard logic.",
      responsePayload: `{"status": 401, "error": "Invalid input"}`,
    };
  }
}
