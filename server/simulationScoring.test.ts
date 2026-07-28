import { describe, expect, it } from "vitest";
import {
  checkSimulationAnswer,
  getSimulationRewardTransactionId,
  scorePhishingSimulation,
  scoreSimulationAnswers,
} from "./services/simulationService";
import { SERVER_SIMULATIONS } from "./simulationDefinitions";
import { SIMULATION_CATALOG } from "../src/simulationCatalog";

describe("server-authoritative phishing simulation scoring", () => {
  it("passes a correct classification with at least three valid indicators", () => {
    const result = scorePhishingSimulation("Phishing", [
      "domain pengirim tidak resmi",
      "bahasa mendesak",
      "meminta klik tautan",
    ]);
    expect(result.score).toBe(80);
    expect(result.passed).toBe(true);
  });

  it("does not let duplicate indicators inflate the score", () => {
    const result = scorePhishingSimulation("Phishing", [
      "bahasa mendesak",
      "bahasa mendesak",
      "bahasa mendesak",
    ]);
    expect(result.uniqueIndicators).toEqual(["bahasa mendesak"]);
    expect(result.score).toBe(60);
    expect(result.passed).toBe(false);
  });

  it("does not pass a wrong classification even with every valid indicator", () => {
    const result = scorePhishingSimulation("Aman", [
      "domain pengirim tidak resmi",
      "bahasa mendesak",
      "ancaman pemblokiran akun",
      "meminta klik tautan",
      "meminta informasi sensitif",
    ]);
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
  });

  it("ignores invented client indicators", () => {
    const result = scorePhishingSimulation("Phishing", ["saya meminta nilai penuh"]);
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
  });
});

describe("server-authoritative multi-simulation scoring", () => {
  it("keeps every public scenario and action aligned with the private server answer key", () => {
    expect(SIMULATION_CATALOG).toHaveLength(4);
    expect(SERVER_SIMULATIONS).toHaveLength(4);
    for (const clientSimulation of SIMULATION_CATALOG) {
      const serverSimulation = SERVER_SIMULATIONS.find(
        (item) => item.simulationId === clientSimulation.simulationId
      );
      expect(serverSimulation).toBeDefined();
      expect(Object.keys(serverSimulation!.answers)).toEqual(
        clientSimulation.scenarios.map((scenario) => scenario.id)
      );
      clientSimulation.scenarios.forEach((scenario) => {
        const correctAction = serverSimulation!.answers[scenario.id].correctActionId;
        expect(scenario.choices.some((choice) => choice.id === correctAction)).toBe(true);
      });
    }
  });

  it("scores a perfect attempt for all four simulations without trusting client score values", () => {
    for (const simulation of SERVER_SIMULATIONS) {
      const answers = Object.fromEntries(
        Object.entries(simulation.answers).map(([scenarioId, key]) => [
          scenarioId,
          key.correctActionId,
        ])
      );
      const result = scoreSimulationAnswers(simulation.simulationId, answers);
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.correctCount).toBe(result.totalQuestions);
    }
  });

  it("returns educational feedback for an unsafe answer", () => {
    const feedback = checkSimulationAnswer("vishing-call", "call-otp", "give-otp");
    expect(feedback.isCorrect).toBe(false);
    expect(feedback.explanation.length).toBeGreaterThan(20);
    expect(feedback.risk.length).toBeGreaterThan(20);
    expect(feedback.tip.length).toBeGreaterThan(20);
  });

  it("does not pass an incomplete answer map", () => {
    const result = scoreSimulationAnswers("malware-analysis", {
      "sandbox-safe": "safe-verified",
    });
    expect(result.score).toBe(20);
    expect(result.passed).toBe(false);
  });

  it("uses one deterministic XP transaction key per user and simulation", () => {
    const firstCompletion = getSimulationRewardTransactionId("user-1", "vishing-call");
    const repeatedCompletion = getSimulationRewardTransactionId("user-1", "vishing-call");
    expect(firstCompletion).toBe("user-1__simulation__vishing-call");
    expect(repeatedCompletion).toBe(firstCompletion);
    expect(getSimulationRewardTransactionId("user-1", "malware-analysis")).not.toBe(firstCompletion);
    expect(getSimulationRewardTransactionId("user-2", "vishing-call")).not.toBe(firstCompletion);
  });
});
