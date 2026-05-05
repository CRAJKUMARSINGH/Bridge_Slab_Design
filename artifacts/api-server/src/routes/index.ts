import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import lfsSyncRouter from "./lfs-sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(lfsSyncRouter);

export default router;
