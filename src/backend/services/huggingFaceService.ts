import { HfInference } from "@huggingface/inference";
import { VulnerabilityProfile, SecurityScorecard } from "@/shared/types";
import { RED_BOT_SYSTEM_PROMPT } from "@/backend/agents/redTeam/redBotPrompts";
import { BLUE_BOT_SYSTEM_PROMPT } from "@/backend/agents/blueTeam/blueBotPrompts";

const HF_MODEL = "Qwen/Qwen2.5-Coder-32B-Instruct";

export class HuggingFaceService {
  private static client: HfInference | null = null;

  private static getClient(): HfInference {
    if (!this.client) {
      const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || "";
      this.client = new HfInference(token);
    }
    return this.client;
  }

  public static async analyzeVulnerability(code: string): Promise<VulnerabilityProfile | null> {
    const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    if (!token) return null;

    try {
      const hf = this.getClient();
      const prompt = `${RED_BOT_SYSTEM_PROMPT}\n\nAnalyze this code and respond ONLY in valid JSON matching VulnerabilityProfile schema:\n\`\`\`\n${code}\n\`\`\``;

      const response = await hf.chatCompletion({
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as VulnerabilityProfile;
      }
      return null;
    } catch (err) {
      console.warn("[HuggingFace] Red Team query failed, falling back to AST analyzer:", err);
      return null;
    }
  }

  public static async generateDefensivePatch(
    code: string,
    vuln: VulnerabilityProfile
  ): Promise<{ patchedCode: string; scorecard: SecurityScorecard } | null> {
    const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
    if (!token) return null;

    try {
      const hf = this.getClient();
      const prompt = `${BLUE_BOT_SYSTEM_PROMPT}\n\nVulnerability to fix: ${vuln.cwe} - ${vuln.title}\nDescription: ${vuln.description}\n\nSource code to patch:\n\`\`\`\n${code}\n\`\`\`\n\nReturn JSON with { "patchedCode": string, "scorecard": SecurityScorecard }`;

      const response = await hf.chatCompletion({
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (err) {
      console.warn("[HuggingFace] Blue Team patch failed, falling back to AST analyzer:", err);
      return null;
    }
  }
}
