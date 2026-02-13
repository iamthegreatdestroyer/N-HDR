import { GenesisHDR } from "../src/genesis-hdr/genesis-core.js";

describe("DEBUG: Genesis breed method", () => {
  let genesis;

  beforeEach(() => {
    genesis = new GenesisHDR({
      populationSize: 10,
      mutationRate: 0.15,
      fitnessThreshold: 0.7,
    });
  });

  test("genesis instance exists", () => {
    console.log("genesis:", genesis);
    console.log("genesis constructor:", genesis.constructor.name);
    console.log("typeof genesis.breed:", typeof genesis.breed);
    console.log("genesis.breed:", genesis.breed);
    console.log("Object.keys(genesis):", Object.keys(genesis));
    console.log("Object.getOwnPropertyNames(genesis):", Object.getOwnPropertyNames(genesis));
    const proto = Object.getPrototypeOf(genesis);
    console.log("Prototype:", proto);
    console.log("Prototype constructor:", proto.constructor.name);
    console.log("Prototype keys:", Object.getOwnPropertyNames(proto));
    
    expect(genesis).toBeDefined();
  });

  test("breed method exists and is callable", () => {
    expect(typeof genesis.breed).toBe("function");
  });

  test("breed can be called directly", () => {
    const agent = genesis.breed({
      baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      targetFitness: 0.85,
    });

    expect(agent).toBeDefined();
    expect(agent.id).toBeDefined();
    expect(agent.genes).toBeDefined();
  });

  test("breed method is accessible via this", () => {
    // Call breed the same way orchestrator does
    const result = genesis.breed({
      baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      targetFitness: 0.8,
    });

    expect(result).toBeDefined();
  });

  test("simulate orchestrator calling breed", () => {
    // Wrap in a function like executeWorkflow does
    const executeBread = function(gen) {
      if (gen && typeof gen.breed === "function") {
        return gen.breed({
          baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
          targetFitness: 0.8,
        });
      } else {
        throw new Error("gen.breed is not a function");
      }
    };

    const agent = executeBread(genesis);
    expect(agent).toBeDefined();
  });
});
