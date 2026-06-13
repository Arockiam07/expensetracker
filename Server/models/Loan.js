import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Lent", "Borrowed"],
    },
    paid: {
      type: Number,
      required: true,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Paid"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
