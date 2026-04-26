import QRCode from "react-qr-code";

const VisitorIdCard = ({ visitor }) => {
  const expiry = visitor.expectedCheckOut
    ? new Date(visitor.expectedCheckOut).toLocaleString("en-IN")
    : "N/A";
  const showQrCode = visitor.status === "approved" && Boolean(visitor.qrToken);

  return (
    <div className="bg-white border border-slate-200 rounded-[28px] shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-none w-full lg:w-56 bg-slate-50 rounded-[24px] border border-slate-200 p-4 flex flex-col items-center text-center">
          {visitor.photo ? (
            <img
              src={visitor.photo}
              alt="Visitor"
              className="h-48 w-full rounded-2xl object-cover border border-slate-300"
            />
          ) : (
            <div className="h-48 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center text-slate-500">
              Photo pending
            </div>
          )}
          <div className="mt-4 text-left w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Card ID</p>
            <p className="mt-1 text-base font-bold text-slate-900">{visitor.temporaryCardId || "TBD"}</p>
            <p className="mt-3 text-xs text-slate-500">Valid until</p>
            <p className="text-sm font-medium text-slate-700">{expiry}</p>
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visitor Name</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{visitor.name}</h2>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Temporary Card</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{visitor.temporaryCardId || "TBD"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
              <p className="mt-2 text-sm text-slate-700">{visitor.email || "—"}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Purpose</p>
              <p className="mt-2 text-sm text-slate-700">{visitor.purpose}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Person to Meet</p>
              <p className="mt-2 text-sm text-slate-700">{visitor.personToMeet}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{visitor.status || "N/A"}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[auto_1fr] items-center">
            <div id="visitor-card-qr" className="rounded-3xl border border-slate-200 bg-white p-4 flex items-center justify-center min-h-[154px] min-w-[154px]">
              {showQrCode ? (
                <QRCode value={visitor.qrToken} size={120} />
              ) : (
                <div className="text-center text-slate-400 text-xs font-medium uppercase tracking-[0.18em]">
                  QR Locked
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">QR Code</p>
              {showQrCode ? (
                <>
                  <p className="mt-2 text-sm text-slate-700">
                    Scan to verify visitor details, status, and expiry information.
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Expiry: {expiry}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-amber-700">
                  QR will be generated only after admin approval.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorIdCard;
