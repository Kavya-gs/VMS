import stripe from "../config/stripe.js";
import User from "../models/User.js";
import Visitor from "../models/visitor.model.js";
import VisitorPayment from "../models/visitorPayment.model.js";
import WebhookEvent from "../models/webhookEvent.model.js";

const amount = () => Number(process.env.VISITOR_FEE_CENTS || 2500);
const currency = () => process.env.STRIPE_CURRENCY || "usd";

export const createVisitorCheckout = async (req, res) => {
  try {
    if (req.user.role !== "visitor") return res.status(403).json({ message: "Only visitor self check-in requires payment." });

    const profile = await User.findById(req.user.id).select("name email");
    const { purpose, personToMeet, expectedCheckIn, expectedCheckOut } = req.body;
    if (!profile?.name || !profile?.email || !purpose || !personToMeet || !expectedCheckIn || !expectedCheckOut) {
      return res.status(400).json({ message: "Complete the visitor and schedule details before payment." });
    }
    if (new Date(expectedCheckOut) <= new Date(expectedCheckIn)) {
      return res.status(400).json({ message: "Expected checkout must be later than expected check-in." });
    }
    const activeVisit = await Visitor.findOne({ userId: req.user.id, status: "approved", checkInTime: { $ne: null }, checkOutTime: null });
    if (activeVisit) return res.status(400).json({ message: "You already have an active visit. Please checkout first." });

    const pending = await VisitorPayment.create({ userId: req.user.id, name: profile.name, email: profile.email, purpose, personToMeet, expectedCheckIn, expectedCheckOut, amount: amount() });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: profile.email,
      line_items: [{ price_data: { currency: currency(), product_data: { name: "Visitor booking fee" }, unit_amount: pending.amount }, quantity: 1 }],
      payment_intent_data: { metadata: { visitorPaymentId: pending.id } },
      metadata: { visitorPaymentId: pending.id },
      success_url: `${process.env.CLIENT_URL}/checkin?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkin?payment=cancelled`,
    });
    pending.stripeCheckoutSessionId = session.id;
    await pending.save();
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const existingEvent = await WebhookEvent.findOne({ stripeEventId: event.id });
    if (existingEvent) return res.json({ received: true, duplicate: true });
    await WebhookEvent.create({ stripeEventId: event.id, type: event.type });

    const object = event.data.object;
    const paymentId = object.metadata?.visitorPaymentId;
    if (paymentId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")) {
      const pending = await VisitorPayment.findOne({ _id: paymentId, status: "pending" });
      if (pending) {
        const visitor = await Visitor.create({ name: pending.name, email: pending.email, purpose: pending.purpose, personToMeet: pending.personToMeet, expectedCheckIn: pending.expectedCheckIn, expectedCheckOut: pending.expectedCheckOut, userId: pending.userId, status: "pending", checkInTime: null, checkInType: "self" });
        pending.status = "completed";
        pending.stripePaymentIntentId = object.payment_intent || pending.stripePaymentIntentId;
        pending.visitorId = visitor._id;
        await pending.save();
      }
    }
    if (paymentId && (event.type === "checkout.session.async_payment_failed" || event.type === "payment_intent.payment_failed")) {
      await VisitorPayment.findByIdAndUpdate(paymentId, { status: "failed", stripePaymentIntentId: object.id });
    }
    if (paymentId && event.type === "checkout.session.expired") {
      await VisitorPayment.findByIdAndUpdate(paymentId, { status: "cancelled" });
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

export const getVisitorPaymentStatus = async (req, res) => {
  try {
    const payment = await VisitorPayment.findOne({
      stripeCheckoutSessionId: req.params.sessionId,
      userId: req.user.id,
    }).select("status visitorId");

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ status: payment.status, visitorId: payment.visitorId || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};