import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import API from "../../../../services/api";
import { useAuth } from "../../../../contexts/useAuth";
import VisitorIdCard from "../components/VisitorIdCard";

const VisitorCardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturePreview, setCapturePreview] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [saving, setSaving] = useState(false);
  const { role, user } = useAuth();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoStartTriggeredRef = useRef(false);

  const canSecurityCheckout = (() => {
    if (role !== "security" || !visitor) return false;
    if (visitor.status === "checked-out" || visitor.status === "rejected")
      return false;
    if (visitor.status === "checkout-requested") return true;
    if (visitor.qrTokenExpiry) {
      const expiry = new Date(visitor.qrTokenExpiry);
      if (!isNaN(expiry) && Date.now() > expiry.getTime()) return true;
    }
    return false;
  })();

  const fetchVisitor = useCallback(async (options = {}) => {
    if (!options.skipLoader) {
      setLoading(true);
    }

    try {
      const response = await API.get(`/visitors/details/${id}`, {
        showLoader: !options.skipLoader,
      });
      setVisitor(response.data);
    } catch (error) {
      console.error(error);
      if (!options.skipLoader) {
        toast.error("Unable to load visitor details");
      }
    } finally {
      if (!options.skipLoader) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchVisitor();
  }, [fetchVisitor]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchVisitor({ skipLoader: true });
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, [fetchVisitor]);

  useEffect(() => {
    const cleanup = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    return cleanup;
  }, []);

  useEffect(() => {
    if (cameraActive && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setCameraError("");
    } catch (error) {
      console.error(error);
      setCameraError("Unable to access camera. Please allow camera access.");
    }
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturePreview(dataUrl);
    stopCamera();
  };

  const uploadPhoto = async () => {
    if (!capturePreview) {
      toast.error("Please capture a photo first.");
      return;
    }

    setSaving(true);
    try {
      const response = await API.put(`/visitors/photo/${id}`, {
        photo: capturePreview,
      });
      setVisitor(response.data);
      setCapturePreview(null);
      toast.success("Visitor photo captured and ID card updated.");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to save visitor photo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityCheckout = async () => {
    if (!visitor?._id) return;

    setCheckoutLoading(true);
    try {
      await API.put(`/visitors/checkout/${visitor._id}`);
      toast.success("Visitor checked out successfully");
      fetchVisitor({ skipLoader: true });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to checkout visitor");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const svgToPngDataUrl = async (svg) => {
    if (!svg) return null;

    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = image64;
    });
  };

  const downloadPdf = async () => {
    if (!visitor) return;
    setPdfLoading(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const cardWidth = 520;
      const cardHeight = 320;
      const cardX = (pageWidth - cardWidth) / 2;
      const cardY = 80;
      const photoWidth = 160;
      const photoHeight = 170;
      const leftPanelX = cardX + 16;
      const leftPanelY = cardY + 16;
      const rightX = leftPanelX + photoWidth + 18;
      const rightWidth = cardWidth - photoWidth - 50;
      const detailRowWidth = rightWidth - 10;
      const expiry = visitor.expectedCheckOut
        ? new Date(visitor.expectedCheckOut).toLocaleString("en-IN")
        : "N/A";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Visitor ID Card", pageWidth / 2, 45, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generated: ${new Date().toLocaleString("en-IN")}`,
        pageWidth / 2,
        64,
        { align: "center" },
      );

      doc.setDrawColor(200);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 16, 16, "FD");

      if (visitor.photo) {
        doc.addImage(
          visitor.photo,
          "JPEG",
          leftPanelX,
          leftPanelY,
          photoWidth,
          photoHeight,
        );
      } else {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(
          leftPanelX,
          leftPanelY,
          photoWidth,
          photoHeight,
          12,
          12,
          "F",
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(
          "Photo pending",
          leftPanelX + photoWidth / 2,
          leftPanelY + photoHeight / 2,
          { align: "center", baseline: "middle" },
        );
        doc.setTextColor(0, 0, 0);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const leftInfoY = leftPanelY + photoHeight + 22;
      doc.text("CARD DETAILS", leftPanelX, leftInfoY);
      doc.setFontSize(10);
      doc.text("Card ID", leftPanelX, leftInfoY + 20);
      doc.setFont("helvetica", "bold");
      doc.text(visitor.temporaryCardId || "TBD", leftPanelX, leftInfoY + 36);
      doc.setFont("helvetica", "normal");
      doc.text("Valid until", leftPanelX, leftInfoY + 58);
      doc.setFont("helvetica", "bold");
      doc.text(expiry, leftPanelX, leftInfoY + 74);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(visitor.name || "Visitor Name", rightX, leftPanelY + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `UID: ${visitor._id.slice(-8).toUpperCase()}`,
        rightX,
        leftPanelY + 36,
      );

      if (visitor.status) {
        const statusText = visitor.status.toUpperCase();
        const statusWidth = doc.getTextWidth(statusText) + 24;
        const statusHeight = 20;
        const statusX = rightX;
        const statusY = leftPanelY + 48;
        doc.setFillColor(230, 248, 255);
        doc.setDrawColor(15, 118, 168);
        doc.roundedRect(
          statusX,
          statusY,
          statusWidth,
          statusHeight,
          10,
          10,
          "FD",
        );
        doc.setTextColor(15, 118, 168);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(statusText, statusX + 12, statusY + 14);
        doc.setTextColor(0, 0, 0);
      }

      const rows = [
        ["Email", visitor.email || "N/A"],
        ["Purpose", visitor.purpose || "N/A"],
        ["Person to Meet", visitor.personToMeet || "N/A"],
      ];

      let currentY = leftPanelY + 84;
      rows.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`${label}:`, rightX, currentY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitValue = doc.splitTextToSize(value, detailRowWidth);
        doc.text(splitValue, rightX, currentY + 14);
        currentY += splitValue.length * 14 + 12;
      });

      const qrSize = 140;
      const qrX = cardX + cardWidth - qrSize - 16;
      const qrY = cardY + cardHeight - qrSize - 16;
      const svg = document.querySelector("#visitor-card-qr svg");
      const qrDataUrl = await svgToPngDataUrl(svg);

      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Scan this QR code to verify..", qrX, qrY + qrSize + 16, {
        maxWidth: qrSize,
      });

      doc.save(`visitor-id-card-${visitor.temporaryCardId || visitor._id}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const canCapture =
    visitor &&
    visitor.status !== "rejected" &&
    visitor.status !== "checked-out" &&
    !visitor.photo &&
    (role === "security" ||
      role === "admin" ||
      (role === "visitor" && visitor.userId?.toString() === user?._id));

  useEffect(() => {
    if (!canCapture || cameraActive || capturePreview || autoStartTriggeredRef.current) {
      return;
    }

    autoStartTriggeredRef.current = true;
    startCamera();
  }, [canCapture, cameraActive, capturePreview, startCamera]);

  const statusTone =
    visitor?.status === "approved"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : visitor?.status === "pending"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : visitor?.status === "rejected"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  const checkInTypeLabel =
    visitor?.checkInType === "self"
      ? "Self Check-In"
      : visitor?.checkInType === "security"
      ? "Security Check-In"
      : visitor?.checkInType === "admin"
      ? "Admin Check-In"
      : "Not set";

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visitor ID Card</h1>
          <p className="mt-1 text-slate-600">
            Review and download the visitor card for verification.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300"
        >
          Back
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          Loading visitor details...
        </div>
      ) : !visitor ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          Visitor not found.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-sm font-semibold text-slate-700">Status</span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusTone}`}>
                {visitor.status || "unknown"}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {checkInTypeLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                Card ID: {visitor.temporaryCardId || "Pending"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p>
                <span className="font-medium text-slate-700">Created:</span>{" "}
                {visitor.createdAt
                  ? new Date(visitor.createdAt).toLocaleString("en-IN")
                  : "N/A"}
              </p>
              <p>
                <span className="font-medium text-slate-700">Expected In:</span>{" "}
                {visitor.expectedCheckIn
                  ? new Date(visitor.expectedCheckIn).toLocaleString("en-IN")
                  : "N/A"}
              </p>
              <p>
                <span className="font-medium text-slate-700">Expected Out:</span>{" "}
                {visitor.expectedCheckOut
                  ? new Date(visitor.expectedCheckOut).toLocaleString("en-IN")
                  : "N/A"}
              </p>
            </div>
          </div>

          <VisitorIdCard visitor={visitor} />

          {canCapture && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Capture visitor photo</h2>
              <p className="text-sm text-slate-600">
                Use the camera interface to capture a live photo for the visitor
                card.
              </p>

              {cameraError && (
                <p className="text-sm text-rose-600">{cameraError}</p>
              )}

              {capturePreview ? (
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
                    <img
                      src={capturePreview}
                      alt="Capture preview"
                      className="w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={uploadPhoto}
                      disabled={saving}
                      className="w-full sm:w-auto rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Photo & Update Card"}
                    </button>
                    <button
                      onClick={() => setCapturePreview(null)}
                      className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800"
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cameraActive ? (
                    <div className="space-y-4">
                      <div className="rounded-3xl overflow-hidden border border-slate-200 bg-black">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-80 w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={captureImage}
                          className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                          Capture Photo
                        </button>
                        <button
                          onClick={stopCamera}
                          className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                    >
                      Start Camera
                    </button>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={downloadPdf}
              disabled={pdfLoading || !visitor.photo}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {pdfLoading ? "Generating PDF..." : "Download ID Card PDF"}
            </button>
            {role === "security" && canSecurityCheckout && (
              <button
                disabled={checkoutLoading}
                className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
                onClick={handleSecurityCheckout}
              >
                {checkoutLoading ? "Checking Out..." : "Checkout Visitor"}
              </button>
            )}
            <p className="text-sm text-slate-500">
              The PDF will include the visitor details, live photo, QR code, and
              expiry information.
            </p>
          </div>
          {!visitor.photo && (
            <p className="text-sm text-rose-600">
              Please capture and save the visitor photo before generating the ID
              card.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitorCardPage;
