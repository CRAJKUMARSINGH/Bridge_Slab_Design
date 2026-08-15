import { Router, type IRouter } from "express";
import {
  bridgeDesignContract,
  calculateBridgeDesign,
} from "@workspace/engine";
import { renderHtmlReport } from "@workspace/report";

const router: IRouter = Router();

function invalidInput(res: { status: (code: number) => { json: (body: unknown) => void } }, error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    res.status(400).json({
      error: "INVALID_DESIGN_INPUT",
      issues: (error as { issues: unknown }).issues,
    });
    return;
  }

  res.status(400).json({
    error: "DESIGN_CALCULATION_FAILED",
    message: error instanceof Error ? error.message : "Unable to calculate design",
  });
}

router.get("/design/contract", (_req, res) => {
  res.json(bridgeDesignContract);
});

router.post("/design/calculate", (req, res) => {
  try {
    res.json(calculateBridgeDesign(req.body));
  } catch (error) {
    invalidInput(res, error);
  }
});

router.post("/design/report/html", (req, res) => {
  try {
    const result = calculateBridgeDesign(req.body);
    res.type("html").send(renderHtmlReport(result));
  } catch (error) {
    invalidInput(res, error);
  }
});

export default router;