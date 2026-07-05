import { NextResponse } from "next/server";
import {
  runHackathonVideoAgentAdapter,
  type VideoAgentRunRequest,
  type VideoAgentStrategy,
} from "@/lib/videoagent-adapter";
import type { Timeline } from "@/lib/types";

type RawRunRequest = {
  projectId?: unknown;
  sourceBranchId?: unknown;
  sourceBranchName?: unknown;
  goal?: unknown;
  strategies?: unknown;
  timeline?: unknown;
};

const VALID_STRATEGIES = new Set<VideoAgentStrategy>([
  "viral",
  "premium",
  "story",
  "brand_safe",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStrategies(value: unknown): VideoAgentStrategy[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strategies = value.filter((item): item is VideoAgentStrategy => {
    return typeof item === "string" && VALID_STRATEGIES.has(item as VideoAgentStrategy);
  });
  return strategies.length ? strategies : undefined;
}

function parseRequest(body: RawRunRequest): VideoAgentRunRequest | null {
  if (
    typeof body.projectId !== "string" ||
    typeof body.sourceBranchId !== "string" ||
    typeof body.sourceBranchName !== "string" ||
    !isRecord(body.timeline)
  ) {
    return null;
  }

  return {
    projectId: body.projectId,
    sourceBranchId: body.sourceBranchId,
    sourceBranchName: body.sourceBranchName,
    goal: typeof body.goal === "string" ? body.goal : undefined,
    strategies: parseStrategies(body.strategies),
    timeline: body.timeline as Timeline,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RawRunRequest;
    const parsed = parseRequest(body);

    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid VideoAgent request",
          message: "projectId, sourceBranchId, sourceBranchName, and timeline are required.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(runHackathonVideoAgentAdapter(parsed));
  } catch (error) {
    console.error("VideoAgent adapter failed:", error);
    return NextResponse.json(
      {
        error: "VideoAgent adapter failed",
        message: "The hackathon adapter could not generate branch plans.",
      },
      { status: 500 },
    );
  }
}
