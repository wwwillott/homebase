import { LmsConnector } from "@/lib/connectors/interface";
import {
  CanvasConnector,
  GradescopeConnector,
  LearningSuiteConnector,
  MaxConnector
} from "@/lib/connectors/providers";
import { LmsProvider } from "@/types/lms";

const connectors: Record<LmsProvider, LmsConnector> = {
  LEARNING_SUITE: new LearningSuiteConnector(),
  CANVAS: new CanvasConnector(),
  GRADESCOPE: new GradescopeConnector(),
  MAX: new MaxConnector()
};

export function getConnector(provider: LmsProvider): LmsConnector {
  const connector = connectors[provider];
  if (!connector) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return connector;
}

export function allConnectors(): LmsConnector[] {
  return Object.values(connectors);
}
