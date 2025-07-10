"use client";
import CookieConsent from "react-cookie-consent";

export default function CookieConsentBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Kabul Et"
      declineButtonText="Reddet"
      enableDeclineButton
      cookieName="siteCookieConsent"
      style={{ background: "#2B373B", fontSize: "1rem", borderRadius: "12px", boxShadow: "0 2px 16px rgba(37,99,235,0.12)", padding: "1.2rem 1.5rem", maxWidth: 600, margin: "0 auto 2rem auto", left: 0, right: 0 }}
      buttonStyle={{ color: "#fff", background: "#2563eb", fontSize: "1rem", borderRadius: "8px", padding: "0.5rem 1.5rem", marginRight: 12, border: "none", boxShadow: "0 1px 4px rgba(37,99,235,0.15)", fontWeight: 600 }}
      declineButtonStyle={{ color: "#fff", background: "#ef4444", fontSize: "1rem", borderRadius: "8px", padding: "0.5rem 1.5rem", border: "none", fontWeight: 600 }}
      expires={365}
      overlay
      overlayStyle={{ background: "rgba(0,0,0,0.25)" }}
      onAccept={() => {
        // Analytics veya diğer çerezler burada aktif edilebilir
      }}
      onDecline={() => {
        // Reddedilirse yapılacaklar
      }}
    >
      <span style={{ color: "#fff" }}>
        Sitemiz, deneyiminizi iyileştirmek için çerezler kullanır. Detaylı bilgi için {" "}
        <a href="/privacy" style={{ color: "#93c5fd", textDecoration: "underline" }}>Gizlilik Politikamıza</a> göz atabilirsiniz.
      </span>
    </CookieConsent>
  );
} 