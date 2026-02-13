import { GenesisHDR } from "../src/genesis-hdr/genesis-core.js";
import { OracleHDR } from "../src/oracle-hdr/oracle-core.js";
import { DiffusionHDR } from "../src/d-hdr/diffusion-core.js";
import { HDRIntegrationOrchestrator } from "../src/hdr-orchestrator.js";

describe("DEBUG: Orchestrator breed method", () => {
  let genesis;
  let oracle;
  let diffusion;
  let orchestrator;

  beforeEach(() => {
    genesis = new GenesisHDR({
      populationSize: 10,
      mutationRate: 0.15,
      fitnessThreshold: 0.7,
    });

    oracle = new OracleHDR({
      modelSize: "small",
      timeHorizon: "medium",
    });

    diffusion = new DiffusionHDR({
      timesteps: 50,
      scheduleType: "cosine",
      guidanceScale: 7.5,
    });

    orchestrator = new HDRIntegrationOrchestrator({
      genesis,
      oracle,
      diffusion,
    });
  });

  test("genesis breed works directly", () => {
    const agent = genesis.breed({
      baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      targetFitness: 0.85,
    });

    expect(agent).toBeDefined();
    expect(agent.id).toBeDefined();
  });

  test("orchestrator.genesis exists and has breed", () => {
    console.log("orchestrator.genesis:", orchestrator.genesis);
    console.log("typeof orchestrator.genesis:", typeof orchestrator.genesis);
    console.log("orchestrator.genesis constructor:", orchestrator.genesis?.constructor?.name);
    console.log("typeof orchestrator.genesis.breed:", typeof orchestrator.genesis?.breed);
    
    expect(orchestrator.genesis).toBeDefined();
    expect(typeof orchestrator.genesis.breed).toBe("function");
  });

  test("orchestrator can call breed directly", () => {
    const agent = orchestrator.genesis.breed({
      baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      targetFitness: 0.8,
    });

    expect(agent).toBeDefined();
    expect(agent.id).toBeDefined();
  });

  test("executeWorkflow should breed agent", async () => {
    const workflow = {
      task: "breed_and_analyze_agent",
      baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      targetFitness: 0.85,
    };

    try {
      const result = await orchestrator.executeWorkflow(workflow);
      console.log("Workflow result:", result);
      
      expect(result).toBeDefined();
      expect(result.status).not.toBe("failed");
    } catch (error) {
      console.error("Workflow failed:", error.message);
      throw error;
    }
  });
});
