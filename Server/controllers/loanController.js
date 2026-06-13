import Loan from "../models/Loan.js";
import Transaction from "../models/Transaction.js";

export const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addLoan = async (req, res) => {
  const { name, note, amount, type, dueDate } = req.body;

  try {
    const loan = await Loan.create({
      user: req.user._id,
      name,
      note,
      amount,
      type,
      paid: 0,
      dueDate,
      status: "Active",
    });

    // Automatically log this in transactions!
    await Transaction.create({
      user: req.user._id,
      name: `Loan ${type === "Lent" ? "to" : "from"} ${name}`,
      cat: type === "Lent" ? "Lent" : "Borrowed",
      amount: type === "Lent" ? -Math.abs(amount) : Math.abs(amount),
      type: type === "Lent" ? "expense" : "income",
      date: new Date(),
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const payLoan = async (req, res) => {
  const { amount, date } = req.body;

  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const remaining = Math.abs(loan.amount) - loan.paid;
    const payment = Math.min(amount, remaining);
    loan.paid += payment;

    if (loan.paid >= Math.abs(loan.amount)) {
      loan.status = "Paid";
    }

    await loan.save();

    // Log the payment in transactions!
    await Transaction.create({
      user: req.user._id,
      name: `Repayment from/to ${loan.name}`,
      cat: loan.type === "Lent" ? "Lent" : "Borrowed",
      amount: loan.type === "Lent" ? payment : -payment,
      type: loan.type === "Lent" ? "income" : "expense",
      date: date ? new Date(date) : new Date(),
    });

    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const { name } = loan;

    await loan.deleteOne();

    // Delete corresponding transactions: initial loan transaction and repayments
    await Transaction.deleteMany({
      user: req.user._id,
      name: {
        $in: [
          `Loan to ${name}`,
          `Loan from ${name}`,
          `Repayment from/to ${name}`
        ]
      }
    });

    res.json({ message: "Loan removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
