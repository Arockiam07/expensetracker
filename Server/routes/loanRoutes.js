import express from "express";
import {
  getLoans,
  addLoan,
  payLoan,
  deleteLoan,
} from "../controllers/loanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getLoans)
  .post(protect, addLoan);

router.route("/:id")
  .delete(protect, deleteLoan);

router.route("/:id/pay")
  .put(protect, payLoan);

export default router;
