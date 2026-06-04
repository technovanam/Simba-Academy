import { WHATSAPP_URL } from "../lib/constants";

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-md bg-[#25D366] shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.465 5.214 3.464 8.384-.003 6.536-5.328 11.86-11.859 11.86-2.002-.001-3.973-.509-5.714-1.486L0 24zm6.529-3.722l.379.225c1.462.868 3.093 1.325 4.767 1.326 5.37 0 9.739-4.37 9.742-9.743.002-2.602-1.01-5.05-2.85-6.892-1.84-1.84-4.29-2.853-6.897-2.853-5.372 0-9.744 4.373-9.747 9.747-.001 1.769.467 3.498 1.354 5.023l.247.428-1.012 3.693 3.788-.992z" />
      </svg>
    </a>
  );
}
